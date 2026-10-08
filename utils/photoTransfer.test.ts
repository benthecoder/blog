import { describe, expect, it } from "vitest";
import { photoFileUrl, readPhotoTransfer } from "./photoTransfer";
const id = "12345678-1234-1234-1234-123456789abc/L0/001";
describe("photo transfers", () => {
  it("accepts a PhotoKit identifier and builds a same-origin URL", () => {
    expect(
      readPhotoTransfer(
        JSON.stringify({ kind: "blog-photo", id, name: "IMG_1234.HEIC" })
      )
    ).toEqual({ id, name: "IMG_1234.HEIC" });
    expect(photoFileUrl(id, "full")).toBe(
      `/api/admin/photos/file?id=${encodeURIComponent(id)}&size=full`
    );
  });
  it.each([
    "broken",
    "null",
    JSON.stringify({ id: "../../secret", name: "test" }),
    JSON.stringify({ id: "https://example.com", name: "test" }),
    JSON.stringify({ kind: "blog-photo", id, name: 123 }),
    JSON.stringify({ kind: "blog-photo", id, name: "" }),
  ])("rejects invalid drag data: %s", (raw) =>
    expect(readPhotoTransfer(raw)).toBeNull()
  );
});
