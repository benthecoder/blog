import { expect, it } from "vitest";
import EssaysPage from "@/app/(sidebar)/essays/page";
import WikiPage from "@/app/(sidebar)/wiki/page";
import EssayPage from "@/app/(sidebar)/essays/[slug]/page";
import WikiEntry from "@/app/(sidebar)/wiki/[slug]/page";
import { GET as essayFeed } from "@/app/(sidebar)/essays/rss.xml/route";

it("consolidates empty essay/wiki sections into posts and preserves old entry links", async () => {
  await expect(
    Promise.resolve().then(() => EssaysPage())
  ).rejects.toMatchObject({
    digest: expect.stringContaining("/posts?view=essay;308;"),
  });
  await expect(Promise.resolve().then(() => WikiPage())).rejects.toMatchObject({
    digest: expect.stringContaining("/posts;308;"),
  });
  for (const render of [EssayPage, WikiEntry]) {
    await expect(
      render({ params: Promise.resolve({ slug: "feelgood" }) })
    ).rejects.toMatchObject({
      digest: expect.stringContaining("/posts/feelgood;308;"),
    });
  }
  await expect(Promise.resolve().then(() => essayFeed())).rejects.toMatchObject(
    { digest: expect.stringContaining("/rss.xml;308;") }
  );
});
