import learn from "@/data/learn.json";

type Unit = {
  id?: string;
  title?: string;
};

export type Course = {
  id: string;
  title?: string;
  short_title?: string;
  institution?: string;
  url?: string;
  level?: number;
  units?: Unit[];
  late?: number;
  missed?: number;
  next_due?: { date: string; title: string } | null;
};

type LessonProblem = {
  ref?: string;
  status?: string;
  feedback?: string | null;
};

type Lesson = {
  course_id?: string;
  title?: string;
  short_title?: string;
  source_url?: string;
  problems?: LessonProblem[];
};

type Feedback = {
  course_id?: string;
  week?: string | null;
  problem_ref?: string;
  status?: string;
  summary?: string | null;
};

type Stream = {
  date?: string;
  url?: string;
  title?: string | null;
  platform?: string;
  course_id?: string;
};

type ReviewItem = {
  concept_id?: string;
  title?: string;
  course_id?: string;
  due?: string;
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
  activity?: ActivityDay[];
  totals?: {
    hours?: number;
    sessions?: number;
    courses?: number;
    late?: number;
    missed?: number;
    streak?: number;
  };
};

export const data = learn as unknown as LearnData;

export function plain(s: string | null | undefined): string {
  return (s || "").replaceAll("\u2014", " - ").replaceAll("\u2013", "-");
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
