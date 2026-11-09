import catalogDoc from "@/data/curriculum-catalog.json";
import mapDoc from "@/data/curriculum-map.json";
import { data, plain, type Course } from "@/lib/syllabus";

export type CatalogItem = {
  id: string;
  title: string;
  kind?: string;
  instructor?: string;
  institution?: string;
  url?: string;
  area?: string;
  area_title?: string;
  topic?: string;
  topic_title?: string;
  track?: string;
  era?: string | null;
  hours_core?: number | null;
  hours_full?: number | null;
  why_canonical?: string;
  one_liner?: string;
  recommended_by?: { name: string; url?: string }[];
  free?: boolean;
  has_assignments?: boolean;
};

export type MapNode = {
  id: string;
  area: string;
  topic?: string;
  title: string;
  prereqs: string[];
  items: string[];
};

export type MapArea = { id: string; title: string };

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

function clampLevel(value: number): MasteryLevel {
  if (value <= 0) return 0;
  if (value >= 5) return 5;
  return value as MasteryLevel;
}

export function skillBar(level: number): string {
  const n = clampLevel(level);
  return `[${"#".repeat(n * 2)}${".".repeat((5 - n) * 2)}] ${n}/5`;
}

// The learn export already scores mastery from graded work only, so an
// issued sheet stays at 0. Catalog-only courses have no level.
export function courseLevel(course?: Course | null): MasteryLevel {
  return clampLevel(course?.level ?? 0);
}

const HUMAN_NAMES: Record<string, string> = {
  stat110: "Probability",
  "mit-1801sc": "Calculus",
  "stanford-cs234": "Reinforcement Learning",
  "yale-rlst145": "The Hebrew Bible",
  "mit-6006": "Algorithms",
  "yale-rlst152": "The New Testament",
};

const CODE_TOKEN =
  /^(?:[A-Z]{2,8}\s*\d+[A-Z]*(?:\/\d+[A-Z]*)?|\d+\.\d+[A-Z]*|\d+-\d+|Stat\s+\d+)/i;

function looksLikeCode(value: string): boolean {
  return (
    CODE_TOKEN.test(value.trim()) &&
    CODE_TOKEN.exec(value.trim())?.[0] === value.trim()
  );
}

function stripSchoolPrefix(name: string, school: string): string {
  if (school && name.toLowerCase().startsWith(`${school.toLowerCase()} `)) {
    return name.slice(school.length).trim();
  }
  return name;
}

function stripCodePrefix(name: string): string {
  return name
    .replace(new RegExp(`${CODE_TOKEN.source}\\s*[.:—–/-]?\\s*`, "i"), "")
    .trim();
}

function descriptiveName(course: {
  id: string;
  title?: string;
  short_title?: string;
}): string {
  const school = schoolOf(course.id);
  let name = plain(course.title || course.short_title || course.id);
  name = stripSchoolPrefix(name, school);
  name = stripCodePrefix(name);
  return name || plain(course.short_title || course.title || course.id);
}

export function humanName(course: {
  id: string;
  title?: string;
  short_title?: string;
}): string {
  return HUMAN_NAMES[course.id] || descriptiveName(course);
}

function courseCode(id: string): string {
  const live = learnById.get(id);
  const cat = catalogById.get(id);
  const short = plain(live?.short_title || "");
  if (short && looksLikeCode(short)) return short;
  const school = schoolOf(id);
  let title = plain(live?.title || cat?.title || "");
  title = stripSchoolPrefix(title, school);
  const match = title.match(CODE_TOKEN);
  return match ? match[0].trim() : "";
}

export function courseCitation(id: string): string {
  const school = schoolOf(id);
  if (school.toLowerCase() === "personal") return "";
  const code = courseCode(id);
  if (school && code) return `${school} ${code}`;
  return school || code;
}

export const ENROLLED_NIGHTS = [
  { day: "Mon", courseId: "stat110", track: "math / statistics" },
  { day: "Tue", courseId: "mit-1801sc", track: "math / statistics" },
  { day: "Wed", courseId: "stanford-cs234", track: "AI" },
  { day: "Thu", courseId: "yale-rlst145", track: "theology" },
  { day: "Fri", courseId: "mit-6006", track: "CS / software engineering" },
] as const;

export const SESSION_HOURS = "9–10pm ET";

export const UP_NEXT = [
  {
    courseId: "mit-1806",
    track: "math / statistics",
    citationExtra: "Strang",
  },
  { courseId: "berkeley-cs285", track: "AI" },
  { courseId: "mit-65840", track: "CS / software engineering" },
  { courseId: "yale-rlst152", track: "theology" },
] as const;

// Totals taken from the official course pages, not guessed.
// Numerator stays 0 until a full lecture or problem set is graded.
const COURSE_PACE: Record<
  string,
  { total: number; unit: string; source: string }
> = {
  stat110: {
    total: 11,
    unit: "problem sets",
    source: "https://stat110.hsites.harvard.edu/strategic-practice-problems",
  },
  "mit-1801sc": {
    total: 101,
    unit: "sessions",
    source:
      "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/",
  },
  "stanford-cs234": {
    total: 15,
    unit: "lectures",
    source: "https://web.stanford.edu/class/cs234/",
  },
  "yale-rlst145": {
    total: 24,
    unit: "lectures",
    source: "https://oyc.yale.edu/religious-studies/rlst-145",
  },
  "mit-6006": {
    total: 9,
    unit: "problem sets",
    source:
      "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/assignments/",
  },
};

export function paceProgress(courseId: string): string {
  const pace = COURSE_PACE[courseId];
  const done = 0;
  if (!pace) return `${done} sessions`;
  return `${done} of ${pace.total} ${pace.unit}`;
}

function formatDueDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .replace(",", "");
}

/** The next due item as separate facts, e.g. ["due Mon Nov 9", "HW1 problems 1–2"]. */
export function dueParts(
  course?: { next_due?: { date?: string; title?: string } | null } | null
): string[] {
  const next = course?.next_due;
  if (!next?.date) return [];
  const day = `due ${formatDueDay(next.date)}`;
  return next.title ? [day, next.title] : [day];
}

function enrolledNightIds(): Set<string> {
  return new Set(ENROLLED_NIGHTS.map((row) => row.courseId));
}

export const REQUIRED_AREA_IDS = (mapDoc as { required_areas: string[] })
  .required_areas;

const catalogItems = (catalogDoc as { items: CatalogItem[] }).items;
export const mapNodes = (mapDoc as { nodes: MapNode[] }).nodes;
export const mapAreas = (mapDoc as { areas: MapArea[] }).areas;

const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
const learnById = new Map(
  (data.curriculum || []).map((course) => [course.id, course])
);

export function catalogItem(id: string): CatalogItem | undefined {
  return catalogById.get(id);
}

export function allCourseIds(): string[] {
  const ids = new Set<string>();
  for (const course of data.curriculum || []) ids.add(course.id);
  for (const item of catalogItems) ids.add(item.id);
  for (const night of ENROLLED_NIGHTS) ids.add(night.courseId);
  for (const next of UP_NEXT) ids.add(next.courseId);
  return [...ids];
}

export function mergedCourse(id: string): Course | undefined {
  const live = learnById.get(id);
  const cat = catalogById.get(id);
  if (!live && !cat) return undefined;
  return {
    id,
    title: live?.title || cat?.title,
    short_title: live?.short_title,
    institution: live?.institution || cat?.institution,
    url: live?.url || cat?.url,
    level: live?.level,
    units: live?.units,
    late: live?.late,
    missed: live?.missed,
    next_due: live?.next_due,
  };
}

export function courseUrl(id: string): string | undefined {
  return learnById.get(id)?.url || catalogById.get(id)?.url;
}

export function hoursLabel(id: string): string {
  const hours = catalogById.get(id)?.hours_core;
  if (hours == null) return "";
  return `${hours}h core`;
}

function schoolOf(id: string): string {
  const live = learnById.get(id);
  const cat = catalogById.get(id);
  return plain(live?.institution || cat?.institution || cat?.instructor || "");
}

export function topicsAndInterests(): {
  id: string;
  title: string;
  citation: string;
}[] {
  const taking = enrolledNightIds();
  return catalogItems
    .filter((item) => !taking.has(item.id))
    .map((item) => ({
      id: item.id,
      title: humanName({ id: item.id, title: item.title }),
      citation: courseCitation(item.id),
    }));
}

function nodeLevel(node: MapNode): MasteryLevel {
  const weak = (data.review?.weak || []).some(
    (item) =>
      item.concept_id === node.id ||
      (item.course_id && node.items.includes(item.course_id))
  );
  const linked = node.items
    .map((id) => learnById.get(id))
    .filter((course): course is Course => Boolean(course));
  if (!linked.length) return weak ? 1 : 0;
  let level = Math.max(...linked.map((course) => courseLevel(course)));
  if (weak) level = Math.max(0, level - 1);
  return clampLevel(level);
}

export function nodeLevels(): Record<string, MasteryLevel> {
  const levels: Record<string, MasteryLevel> = {};
  for (const node of mapNodes) levels[node.id] = nodeLevel(node);
  return levels;
}
