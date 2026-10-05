import type { LinkSource } from "../types";

const USER_ID = 2790;
const MAX_PAGES = 20;

interface CuriusLink {
  link: string;
  title: string;
  createdDate: string;
  highlights: {
    highlight: string;
    createdDate: string;
    comment?: string | null;
  }[];
}

// `/links` is paginated newest-first and, unlike `/searchLinks`, includes
// highlights.
export const curius: LinkSource = {
  name: "curius",
  async fetch(since, until) {
    const out = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await fetch(
        `https://curius.app/api/users/${USER_ID}/links?page=${page}`
      );
      if (!res.ok) throw new Error(`curius ${res.status}`);
      const { userSaved }: { userSaved: CuriusLink[] } = await res.json();
      if (!userSaved?.length) break;

      for (const l of userSaved) {
        const saved = new Date(l.createdDate);
        if (saved < since || saved >= until) continue;
        const marks = l.highlights.filter((h) => h.highlight.trim());
        out.push({
          url: l.link,
          title: l.title,
          savedAt: new Date(l.createdDate),
          highlights: marks.map((h) => h.highlight.trim()),
          take:
            marks
              .map((h) => h.comment?.trim())
              .filter(Boolean)
              .join(" ") || undefined,
        });
      }
      if (new Date(userSaved[userSaved.length - 1].createdDate) < since) break;
    }
    return out;
  },
};
