import learn from "@/data/learn.json";

export type Unit = {
  id?: string;
  title?: string;
};

export type Course = {
  id: string;
  title?: string;
  short_title?: string;
  institution?: string;
  area?: string;
  phase?: string;
  track?: string;
  kind?: string;
  lane?: string;
  enrolled?: boolean;
  url?: string;
  assigned?: number;
  certified?: number;
  percent_certified?: number | null;
  units?: Unit[];
};

export type LessonProblem = {
  ref?: string;
  status?: string;
  feedback?: string | null;
};

export type Lesson = {
  course_id?: string;
  title?: string;
  short_title?: string;
  source_url?: string;
  problems?: LessonProblem[];
};

export type Feedback = {
  course_id?: string;
  week?: string | null;
  problem_ref?: string;
  status?: string;
  summary?: string | null;
};

export type Stream = {
  date?: string;
  url?: string;
  title?: string | null;
  platform?: string;
  course_id?: string;
};

export type ReviewItem = {
  concept_id?: string;
  title?: string;
  course_id?: string;
  due?: string;
};

export type CalendarEvent = {
  id?: string;
  date?: string;
  start?: string;
  end?: string;
  title?: string;
  course_id?: string | null;
  source_url?: string | null;
};

export type ActivityDay = {
  date: string;
  level: number;
};

export type LearnData = {
  as_of?: string;
  curriculum?: Course[];
  current_week?: { week?: string; issued_on?: string; lessons?: Lesson[] };
  feedback?: Feedback[];
  streams?: Stream[];
  review?: { due?: ReviewItem[]; weak?: ReviewItem[] };
  calendar?: { timezone?: string; events?: CalendarEvent[] };
  activity?: ActivityDay[];
  totals?: { hours?: number; sessions?: number; courses?: number };
  schedule?: {
    day?: string;
    title?: string;
    detail?: string | null;
    course_id?: string | null;
  }[];
};

export const data = learn as unknown as LearnData;

export function plain(s: string | null | undefined): string {
  return (s || "").replaceAll("\u2014", " - ").replaceAll("\u2013", "-");
}

export function displayTitle(course: Course): string {
  return plain(course.short_title || course.title || course.id);
}

export function trackOf(course: Course): "core" | "major" | "minor" {
  if (
    course.track === "core" ||
    course.track === "major" ||
    course.track === "minor"
  ) {
    return course.track;
  }
  if (course.phase === "foundation" || course.phase === "core") return "core";
  if (
    course.phase === "ml" ||
    course.area === "machine-learning" ||
    (course.area === "computer-science" && course.phase !== "core")
  ) {
    return "major";
  }
  return "minor";
}

export function isEnrolled(course: Course): boolean {
  if (typeof course.enrolled === "boolean") return course.enrolled;
  return course.lane === "now";
}

export function progressLabel(course: Course): string {
  const assigned = course.assigned ?? 0;
  const certified = course.certified ?? 0;
  return `${certified}/${assigned}`;
}

export function progressRatio(course: Course): number {
  const assigned = course.assigned ?? 0;
  if (assigned <= 0) return 0;
  return Math.max(0, Math.min(1, (course.certified ?? 0) / assigned));
}

export function lessonFor(courseId: string): Lesson | undefined {
  return (data.current_week?.lessons || []).find(
    (lesson) => lesson.course_id === courseId
  );
}

export function currentUnit(course: Course): string {
  const lesson = lessonFor(course.id);
  if (lesson?.problems?.length) {
    const first = course.units?.[0]?.title;
    return first ? plain(first) : "this week's sheet";
  }
  const first = course.units?.[0]?.title;
  return first ? plain(first) : "no units listed yet";
}

export function lastScore(courseId: string): string {
  const notes = (data.feedback || []).filter(
    (row) => row.course_id === courseId
  );
  if (!notes.length) return "no score yet";
  const latest = notes[notes.length - 1];
  const bit = [latest.status, latest.problem_ref].filter(Boolean).join(" · ");
  return plain(bit || "no score yet");
}

export function courseById(id: string): Course | undefined {
  return (data.curriculum || []).find((course) => course.id === id);
}
