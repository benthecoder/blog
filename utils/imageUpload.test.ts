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

function request(
  file: File | string,
  published = false,
  crop?: object,
  rotation?: string
) {
  const body = new FormData();
  body.set("file", file);
  body.set("name", "photo");
  body.set("published", String(published));
  if (crop) body.set("crop", JSON.stringify(crop));
  if (rotation !== undefined) body.set("rotation", rotation);
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

it("rotates before cropping, using the same coordinates as the preview", async () => {
  const pixels = Buffer.alloc(40 * 20 * 3);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 40; x++)
      pixels[(y * 40 + x) * 3 + (x < 20 ? 0 : 2)] = 255;
  const input = await sharp(pixels, {
    raw: { width: 40, height: 20, channels: 3 },
  })
    .png()
    .toBuffer();
  const response = await POST(
    request(
      new File([new Uint8Array(input)], "two-colours.png"),
      false,
      { x: 0, y: 20, width: 20, height: 20 },
      "90"
    )
  );
  expect(response.status).toBe(200);
  const output = sharp(path.join(state.directory, "photo.jpg"));
  expect(await output.metadata()).toMatchObject({ width: 20, height: 20 });
  const { data } = await output.raw().toBuffer({ resolveWithObject: true });
  const centre = (10 * 20 + 10) * 3;
  expect(data[centre + 2]).toBeGreaterThan(220);
  expect(data[centre]).toBeLessThan(30);
});
it("combines EXIF orientation with a manual quarter turn", async () => {
  const input = await original()
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  expect(
    (
      await POST(
        request(
          new File([new Uint8Array(input)], "camera.jpg"),
          false,
          undefined,
          "90"
        )
      )
    ).status
  ).toBe(200);
  expect(
    await sharp(path.join(state.directory, "photo.jpg")).metadata()
  ).toMatchObject({ width: 24, height: 12 });
});
it("rejects unsupported rotations before writing", async () => {
  const input = await original().png().toBuffer();
  for (const rotation of ["45", "-90", "NaN", ""]) {
    expect(
      (
        await POST(
          request(
            new File([new Uint8Array(input)], "photo.png"),
            false,
            undefined,
            rotation
          )
        )
      ).status
    ).toBe(400);
  }
  expect(fs.readdirSync(state.directory)).toEqual([]);
});

it("rejects malformed crop fields without replacing an existing image", async () => {
  const input = await original().png().toBuffer();
  const existing = path.join(state.directory, "photo.jpg");
  fs.writeFileSync(existing, "untouched original");
  const invalidCrops = [
    "{",
    "null",
    "[]",
    JSON.stringify({ x: 0, y: 0, width: 6 }),
    JSON.stringify({ x: "0", y: 0, width: 6, height: 8 }),
    JSON.stringify({ x: 0, y: 0, width: 0, height: 8 }),
    JSON.stringify({ x: 0, y: 0, width: 6, height: -1 }),
    '{"x":0,"y":0,"width":1e400,"height":8}',
    new File(["crop"], "crop.json"),
  ];
  for (const published of [false, true]) {
    for (const crop of invalidCrops) {
      const body = await request(
        new File([new Uint8Array(input)], "photo.png"),
        published
      ).formData();
      body.set("crop", crop);
      const response = await POST(
        new NextRequest("http://localhost/api/admin/upload-image", {
          method: "POST",
          body,
        })
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid crop" });
      expect(fs.readFileSync(existing, "utf8")).toBe("untouched original");
      expect(state.put).not.toHaveBeenCalled();
    }
  }
});

it("rejects files submitted as image names before writing", async () => {
  const input = await original().png().toBuffer();
  for (const published of [false, true]) {
    const body = await request(
      new File([new Uint8Array(input)], "photo.png"),
      published
    ).formData();
    body.set("name", new File(["photo"], "name.txt"));
    const response = await POST(
      new NextRequest("http://localhost/api/admin/upload-image", {
        method: "POST",
        body,
      })
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid file name" });
  }
  expect(fs.readdirSync(state.directory)).toEqual([]);
  expect(state.put).not.toHaveBeenCalled();
});
