import { describe, expect, it } from "vitest";
import learn from "@/data/learn.json";
import {
  data,
  lastScore,
  learnDataSchema,
  plain,
  type Course,
  type Feedback,
  type LearnData,
  type Lesson,
} from "@/lib/syllabus";

describe("syllabus boundary schema and helpers", () => {
  it("parses the real data/learn.json export cleanly", () => {
    const parsed: LearnData = learnDataSchema.parse(learn);
    expect(data).toEqual(parsed);
    expect(data.curriculum?.length).toBeGreaterThan(0);
    for (const course of data.curriculum ?? []) {
      const typedCourse: Course = course;
      expect(typeof typedCourse.id).toBe("string");
      expect(typedCourse.id.length).toBeGreaterThan(0);
    }
    for (const lesson of data.current_week?.lessons ?? []) {
      const typedLesson: Lesson = lesson;
      expect(typeof typedLesson.course_id).toBe("string");
    }
    for (const row of data.feedback ?? []) {
      const typedFeedback: Feedback = row;
      expect(typeof typedFeedback).toBe("object");
    }
    expect(data.activity?.length).toBeGreaterThan(0);
    expect(typeof data.totals?.courses).toBe("number");
  });

  it("rejects malformed syllabus payloads at the boundary", () => {
    expect(() =>
      learnDataSchema.parse({
        curriculum: [{ title: "missing id" }],
      })
    ).toThrow();
    expect(() =>
      learnDataSchema.parse({
        activity: [{ date: "2026-11-09", level: "high" }],
      })
    ).toThrow();
  });

  it("normalizes em and en dashes in plain()", () => {
    expect(plain("Stat 110\u2014Probability")).toBe("Stat 110 - Probability");
    expect(plain("pages 1\u201310")).toBe("pages 1-10");
    expect(plain(null)).toBe("");
    expect(plain(undefined)).toBe("");
  });

  it("formats the latest course score or falls back when ungraded", () => {
    expect(lastScore("nonexistent-course")).toBe("no score yet");
  });
});
