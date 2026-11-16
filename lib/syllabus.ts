import { z } from "zod";
import learn from "@/data/learn.json";

const unitSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
});

const courseSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  short_title: z.string().optional(),
  institution: z.string().optional(),
  url: z.string().optional(),
  level: z.number().optional(),
  units: z.array(unitSchema).optional(),
  late: z.number().optional(),
  missed: z.number().optional(),
  next_due: z
    .object({
      date: z.string(),
      title: z.string(),
    })
    .nullable()
    .optional(),
});

export type Course = z.infer<typeof courseSchema>;

const lessonProblemSchema = z.object({
  ref: z.string().optional(),
  status: z.string().optional(),
  feedback: z.string().nullable().optional(),
});

const lessonSchema = z.object({
  course_id: z.string().optional(),
  title: z.string().optional(),
  short_title: z.string().optional(),
  source_url: z.string().optional(),
  problems: z.array(lessonProblemSchema).optional(),
});

export type Lesson = z.infer<typeof lessonSchema>;

const feedbackSchema = z.object({
  course_id: z.string().optional(),
  week: z.string().nullable().optional(),
  problem_ref: z.string().optional(),
  status: z.string().optional(),
  summary: z.string().nullable().optional(),
});

export type Feedback = z.infer<typeof feedbackSchema>;

const streamSchema = z.object({
  date: z.string().optional(),
  url: z.string().optional(),
  title: z.string().nullable().optional(),
  platform: z.string().optional(),
  course_id: z.string().optional(),
});

const reviewItemSchema = z.object({
  concept_id: z.string().optional(),
  title: z.string().optional(),
  course_id: z.string().optional(),
  due: z.string().optional(),
});

const activityDaySchema = z.object({
  date: z.string(),
  level: z.number(),
});

export type ActivityDay = z.infer<typeof activityDaySchema>;

export const learnDataSchema = z.object({
  as_of: z.string().optional(),
  curriculum: z.array(courseSchema).optional(),
  current_week: z
    .object({
      week: z.string().optional(),
      issued_on: z.string().optional(),
      lessons: z.array(lessonSchema).optional(),
    })
    .optional(),
  feedback: z.array(feedbackSchema).optional(),
  streams: z.array(streamSchema).optional(),
  review: z
    .object({
      due: z.array(reviewItemSchema).optional(),
      weak: z.array(reviewItemSchema).optional(),
    })
    .optional(),
  activity: z.array(activityDaySchema).optional(),
  totals: z
    .object({
      hours: z.number().optional(),
      sessions: z.number().optional(),
      courses: z.number().optional(),
      late: z.number().optional(),
      missed: z.number().optional(),
      streak: z.number().optional(),
    })
    .optional(),
});

export type LearnData = z.infer<typeof learnDataSchema>;

export const data: LearnData = learnDataSchema.parse(learn);

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
