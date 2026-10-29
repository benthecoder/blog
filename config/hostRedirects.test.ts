import { expect, it } from "vitest";
import { blogSections, hostRedirects } from "./hostRedirects";

const dir = (name: string) => ({ name, isDirectory: () => true });
const file = (name: string) => ({ name, isDirectory: () => false });

it("keeps only real route directories", () => {
  expect(
    blogSections([
      dir("posts"),
      dir("(group)"),
      dir("[slug]"),
      dir("_private"),
      dir("about"),
      file("layout.tsx"),
    ])
  ).toEqual(["about", "posts"]);
});

it("sends each host's foreign pages to their home host", () => {
  const rules = hostRedirects(["posts"]);
  const find = (host: string, source: string) =>
    rules.find((r) => r.source === source && r.has[0].value === host);

  expect(find("bneo.xyz", "/photos")?.destination).toBe(
    "https://photos.bneo.xyz"
  );
  expect(find("bneo.xyz", "/photos/:path*")?.destination).toBe(
    "https://photos.bneo.xyz/photos/:path*"
  );
  expect(find("bneo.xyz", "/map")?.destination).toBe("https://maps.bneo.xyz");
  expect(find("photos.bneo.xyz", "/posts/:path*")?.destination).toBe(
    "https://bneo.xyz/posts/:path*"
  );
  expect(find("maps.bneo.xyz", "/posts")?.destination).toBe(
    "https://bneo.xyz/posts"
  );
  expect(find("maps.bneo.xyz", "/photos/:path*")?.destination).toBe(
    "https://photos.bneo.xyz/photos/:path*"
  );
  expect(find("photos.bneo.xyz", "/map")?.destination).toBe(
    "https://maps.bneo.xyz"
  );
  expect(rules.every((r) => r.permanent)).toBe(true);
});

it("never redirects the home page or non-page paths", () => {
  const sources = hostRedirects(["posts"]).map((r) => r.source);
  expect(sources).not.toContain("/");
  expect(sources.some((s) => /^\/(api|_next|images)/.test(s))).toBe(false);
});
