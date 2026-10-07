import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ directory: "", put: vi.fn() }));
vi.mock("@/utils/adminAuth", () => ({ checkAdminAuth: () => null }));
vi.mock("@/utils/r2", () => ({ r2PutImage: state.put }));
vi.mock("@/config/paths", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/config/paths")>()),
  get IMAGES_DRAFTS_DIR() {
    return state.directory;
  },
}));
import { POST } from "@/app/api/admin/upload-image/route";

beforeEach(() => {
  state.directory = fs.mkdtempSync(path.join(os.tmpdir(), "image-upload-"));
  state.put.mockReset().mockResolvedValue(undefined);
});
afterEach(() => fs.rmSync(state.directory, { recursive: true, force: true }));

function request(file: File | string, published = false, crop?: object) {
  const body = new FormData();
  body.set("file", file);
  body.set("name", "photo");
  body.set("published", String(published));
  if (crop) body.set("crop", JSON.stringify(crop));
  return new NextRequest("http://localhost/api/admin/upload-image", {
    method: "POST",
    body,
  });
}
const original = () =>
  sharp({
    create: { width: 24, height: 12, channels: 3, background: "#4682b4" },
  });

it("encodes images from their bytes even when the filename extension is unfamiliar", async () => {
  const buffer = await original().avif().toBuffer();
  const response = await POST(
    request(new File([new Uint8Array(buffer)], "camera.avif"), true)
  );
  expect(response.status).toBe(200);
  expect(state.put).toHaveBeenCalledOnce();
  const [name, bytes] = state.put.mock.calls[0];
  expect(name).toBe("photo.jpg");
  expect(await sharp(bytes).metadata()).toMatchObject({
    format: "jpeg",
    width: 24,
    height: 12,
  });
  expect(fs.readdirSync(state.directory)).toEqual([]);
});

it("rejects nonfiles and invalid image data before replacing local or remote content", async () => {
  const existing = path.join(state.directory, "photo.jpg");
  fs.writeFileSync(existing, "untouched original");
  for (const file of [
    "not a file",
    new File(["not an image"], "pretend.jpg"),
    new File(["not an image"], "text.txt"),
    new File([], "empty.png"),
  ]) {
    expect((await POST(request(file))).status).toBe(400);
    expect((await POST(request(file, true))).status).toBe(400);
  }
  expect(fs.readFileSync(existing, "utf8")).toBe("untouched original");
  expect(state.put).not.toHaveBeenCalled();
});

it("preserves EXIF orientation and cropping in browser coordinates", async () => {
  const buffer = await original()
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  const response = await POST(
    request(new File([new Uint8Array(buffer)], "camera.jpg"), false, {
      x: 2,
      y: 4,
      width: 6,
      height: 8,
    })
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    url: "/images/drafts/photo.jpg",
  });
  expect(
    await sharp(path.join(state.directory, "photo.jpg")).metadata()
  ).toMatchObject({ format: "jpeg", width: 6, height: 8 });
  expect(state.put).not.toHaveBeenCalled();
});
