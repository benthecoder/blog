import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ exists: vi.fn(), read: vi.fn() }));
vi.mock("fs", () => ({
  default: { existsSync: mocks.exists, readFileSync: mocks.read },
}));
const meta = {
  width: 100,
  height: 80,
  blurDataURL: "data:image/jpeg;base64,test",
};
beforeEach(() => {
  vi.resetModules();
  mocks.exists.mockReset().mockReturnValue(true);
  mocks.read
    .mockReset()
    .mockReturnValue(JSON.stringify({ "hello world.jpg": meta }));
});
describe("image metadata lookup", () => {
  it("decodes filenames and reads the manifest once", async () => {
    const { getImageMeta } = await import("./imageMeta");
    expect(getImageMeta("/images/hello%20world.jpg")).toEqual(meta);
    expect(getImageMeta("/images/hello world.jpg")).toEqual(meta);
    expect(mocks.read).toHaveBeenCalledTimes(1);
  });
  it("returns null for unknown and inherited names", async () => {
    const { getImageMeta } = await import("./imageMeta");
    for (const name of [
      "missing.jpg",
      "constructor",
      "__proto__",
      "toString",
      "hasOwnProperty",
    ])
      expect(getImageMeta(`/images/${name}`)).toBeNull();
  });
  it("allows own keys even when their names collide with Object.prototype", async () => {
    mocks.read.mockReturnValue(
      JSON.stringify(
        Object.fromEntries([
          ["__proto__", meta],
          ["constructor", meta],
        ])
      )
    );
    const { getImageMeta } = await import("./imageMeta");
    expect(getImageMeta("/images/__proto__")).toEqual(meta);
    expect(getImageMeta("/images/constructor")).toEqual(meta);
  });
  it("handles a missing manifest without returning inherited properties", async () => {
    mocks.exists.mockReturnValue(false);
    const { getImageMeta } = await import("./imageMeta");
    expect(getImageMeta("/images/toString")).toBeNull();
    expect(getImageMeta("/images/hello.jpg")).toBeNull();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("rejects unrelated paths and malformed URL encoding before reading", async () => {
    const { getImageMeta } = await import("./imageMeta");
    for (const source of [
      "/other/image.jpg",
      "/images/drawings/image.jpg",
      "/images/%E0%A4%A",
    ])
      expect(getImageMeta(source)).toBeNull();
    expect(mocks.read).not.toHaveBeenCalled();
  });
});
