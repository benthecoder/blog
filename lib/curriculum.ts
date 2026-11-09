import catalogDoc from "@/data/curriculum-catalog.json";
import mapDoc from "@/data/curriculum-map.json";
import {
  data,
  displayTitle,
  isEnrolled,
  lastScore,
  lessonFor,
  plain,
  progressLabel,
  type CalendarEvent,
  type Course,
} from "@/lib/syllabus";

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

export type NodeState = "mastered" | "in-progress" | "weak" | "not-started";

export type TrackId = "cs-se" | "math-stats" | "ai" | "theology";

export type TrackDef = {
  id: TrackId;
  title: string;
  blurb: string;
  nowId: string;
  nextId: string;
};

export const REQUIRED_TRACKS: TrackDef[] = [
  {
    id: "cs-se",
    title: "CS / software engineering",
    blurb:
      "Think like a software engineer when designing solutions and instructing AI.",
    nowId: "mit-6006",
    nextId: "mit-65840",
  },
  {
    id: "math-stats",
    title: "Math / statistics",
    blurb: "Probability first, then the calculus that holds it up.",
    nowId: "stat110",
    nextId: "mit-1801sc",
  },
  {
    id: "ai",
    title: "AI",
    blurb:
      "Reinforcement learning first, then a deeper pass at modern deep RL.",
    nowId: "stanford-cs234",
    nextId: "berkeley-cs285",
  },
  {
    id: "theology",
    title: "Theology",
    blurb: "Close reading of scripture, starting with the Hebrew Bible.",
    nowId: "yale-rlst145",
    nextId: "yale-rlst152",
  },
];

export const REQUIRED_AREA_IDS = (mapDoc as { required_areas: string[] })
  .required_areas;

export const catalogItems = (catalogDoc as { items: CatalogItem[] }).items;
export const catalogAreas = (
  catalogDoc as {
    areas: { id: string; title: string; why_this_outlasts_ai: string }[];
  }
).areas;
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
  for (const track of REQUIRED_TRACKS) {
    ids.add(track.nowId);
    ids.add(track.nextId);
  }
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
    area: live?.area || cat?.area,
    track: live?.track || cat?.track,
    kind: live?.kind || cat?.kind,
    enrolled: live?.enrolled,
    url: live?.url || cat?.url,
    assigned: live?.assigned,
    certified: live?.certified,
    percent_certified: live?.percent_certified,
    units: live?.units,
  };
}

export function courseUrl(id: string): string | undefined {
  return learnById.get(id)?.url || catalogById.get(id)?.url;
}

export function oneLiner(id: string): string {
  const cat = catalogById.get(id);
  if (cat?.one_liner) return plain(cat.one_liner);
  if (cat?.why_canonical)
    return plain(cat.why_canonical.split(/(?<=[.!?])\s/)[0] || "");
  const course = learnById.get(id);
  return plain(course?.title || "");
}

export function hoursLabel(id: string): string {
  const hours = catalogById.get(id)?.hours_core;
  if (hours == null) return "";
  return `${hours}h core`;
}

export function schoolOf(id: string): string {
  const live = learnById.get(id);
  const cat = catalogById.get(id);
  return plain(live?.institution || cat?.institution || cat?.instructor || "");
}

export function weekEvent(courseId: string): CalendarEvent | undefined {
  return (data.calendar?.events || []).find(
    (event) => event.course_id === courseId
  );
}

export function weekSessionLabel(courseId: string): string {
  const event = weekEvent(courseId);
  if (!event) return "";
  const lesson = lessonFor(courseId);
  const problem = lesson?.problems?.[0]?.ref;
  return plain(problem || event.title || "");
}

export function formatDay(iso?: string): string {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function requiredIds(): Set<string> {
  const ids = new Set<string>();
  for (const track of REQUIRED_TRACKS) {
    ids.add(track.nowId);
    ids.add(track.nextId);
  }
  return ids;
}

export function optionalSubscribed(): Course[] {
  const required = requiredIds();
  return (data.curriculum || []).filter(
    (course) => isEnrolled(course) && !required.has(course.id)
  );
}

export function shelfItems(): CatalogItem[] {
  const required = requiredIds();
  const subscribed = new Set(
    (data.curriculum || []).filter(isEnrolled).map((course) => course.id)
  );
  return catalogItems.filter(
    (item) => !required.has(item.id) && !subscribed.has(item.id)
  );
}

export function nodeState(node: MapNode): NodeState {
  const weak = data.review?.weak || [];
  if (
    weak.some(
      (item) =>
        item.concept_id === node.id ||
        (item.course_id && node.items.includes(item.course_id))
    )
  ) {
    return "weak";
  }

  const linked = node.items
    .map((id) => learnById.get(id))
    .filter((course): course is Course => Boolean(course));
  if (!linked.length) return "not-started";

  const notes = data.feedback || [];
  const hasWork = linked.some(
    (course) =>
      (course.certified ?? 0) > 0 ||
      notes.some((row) => row.course_id === course.id)
  );
  if (!hasWork) return "not-started";

  const complete = linked.every(
    (course) =>
      (course.assigned ?? 0) > 0 &&
      (course.certified ?? 0) >= (course.assigned ?? 0)
  );
  return complete ? "mastered" : "in-progress";
}

export function nodeStates(): Record<string, NodeState> {
  const states: Record<string, NodeState> = {};
  for (const node of mapNodes) states[node.id] = nodeState(node);
  return states;
}

export function progressText(course: Course): string {
  const assigned = course.assigned ?? 0;
  const certified = course.certified ?? 0;
  if (assigned <= 0 && certified <= 0) return "no sessions yet";
  return `${progressLabel(course)} sheets done`;
}

export function unitText(course: Course): string {
  const first = course.units?.[0]?.title;
  return first ? plain(first) : "";
}

export { displayTitle, lastScore, plain };
