import { NextResponse } from "next/server";
import getPostMetadata from "@/utils/getPostMetadata";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const posts = getPostMetadata({ includeDrafts: false });

    // Use existing wordcount field
    const totalWords = posts.reduce(
      (sum, post) => sum + (post.wordcount || 0),
      0
    );

    const postsWithWords = posts.map((post) => ({
      ...post,
      words: post.wordcount || 0,
    }));

    // Find longest and shortest
    const sorted = [...postsWithWords].sort((a, b) => b.words - a.words);
    const longestPost = sorted[0];
    const shortestPost = sorted[sorted.length - 1];

    // Calculate top tags
    const tagCounts: Record<string, number> = {};
    posts.forEach((post) => {
      const tags = post.tags.split(",").map((t) => t.trim());
      tags.forEach((tag) => {
        if (tag) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Posts per year
    const yearCounts: Record<string, number> = {};
    posts.forEach((post) => {
      const year = new Date(post.date).getFullYear().toString();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    const postsPerYear = Object.entries(yearCounts)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([year, count]) => ({ year, count }));

    // First and latest
    const sortedByDate = [...posts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstPost = sortedByDate[0];
    const latestPost = sortedByDate[sortedByDate.length - 1];

    // Calculate total days since first post
    const totalDays =
      Math.floor(
        (new Date(latestPost.date).getTime() -
          new Date(firstPost.date).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1; // +1 to include both first and last day

    // Calculate longest streak
    const dates = posts
      .map((p) => new Date(p.date))
      .sort((a, b) => a.getTime() - b.getTime());

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const diffDays = Math.floor(
        (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 7) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    const stats = {
      totalPosts: posts.length,
      totalWords,
      totalDays,
      averageWords: Math.round(totalWords / posts.length),
      longestPost: {
        title: longestPost.title,
        words: longestPost.words,
        slug: longestPost.slug,
      },
      shortestPost: {
        title: shortestPost.title,
        words: shortestPost.words,
        slug: shortestPost.slug,
      },
      topTags,
      postsPerYear,
      firstPost: { title: firstPost.title, date: firstPost.date },
      latestPost: { title: latestPost.title, date: latestPost.date },
      writingStreak: maxStreak,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to calculate stats" },
      { status: 500 }
    );
  }
}
