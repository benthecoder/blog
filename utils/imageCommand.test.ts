import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ditherImage } from "./images/dither";

const exec = promisify(execFile);
let directory: string;
let input: string;
let original: Buffer;
const run = (...args: string[]) =>
  exec(
    process.execPath,
    ["--import", "tsx", "scripts/prepareImage.ts", ...args],
    { timeout: 10_000 }
  );
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "blog-image-test-"));
  input = path.join(directory, "original.png");
  original = await sharp({
    create: {
      width: 12,
      height: 24,
      channels: 4,
      background: { r: 128, g: 128, b: 128, alpha: 0.8 },
    },
  })
    .png()
    .toBuffer();
  await writeFile(input, original);
});
afterEach(async () => rm(directory, { recursive: true, force: true }));

describe("image copy command", () => {
  it("applies EXIF orientation before resizing and dithering", async () => {
    const oriented = path.join(directory, "camera.jpg");
    await sharp(original)
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toFile(oriented);
    const output = path.join(directory, "rotated.png");
    await run(oriented, "--output", output, "--width", "8", "--dither");
    expect(await sharp(output).metadata()).toMatchObject({
      format: "png",
      width: 8,
      height: 4,
    });
  });
  it("fits a portrait within the requested edge and leaves its source unchanged", async () => {
    const output = path.join(directory, "copy.webp");
    await run(input, "--output", output, "--width", "8");
    expect(await readFile(input)).toEqual(original);
    expect(await sharp(output).metadata()).toMatchObject({
      format: "webp",
      width: 4,
      height: 8,
    });
  });
  it("exports dithered PNG with alpha and only black/white visible pixels", async () => {
    const output = path.join(directory, "dots.png");
    await run(input, "--output", output, "--dither");
    const { data, info } = await sharp(output)
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(4);
    const shades = new Set<number>();
    for (let i = 0; i < data.length; i += 4) {
      shades.add(data[i]);
      expect(data[i + 1]).toBe(data[i]);
      expect(data[i + 2]).toBe(data[i]);
      expect(data[i + 3]).toBe(204);
    }
    expect(shades).toEqual(new Set([0, 255]));
    expect(await readFile(input)).toEqual(original);
  });
  it("refuses to overwrite the source or another existing output", async () => {
    await expect(run(input, "--output", input)).rejects.toThrow();
    expect(await readFile(input)).toEqual(original);
    const output = path.join(directory, "existing.jpg");
    await writeFile(output, "keep this file");
    await expect(run(input, "--output", output)).rejects.toThrow();
    expect(await readFile(output, "utf8")).toBe("keep this file");
  });
  it("rejects a mismatched dither extension and an invalid size without writing", async () => {
    await expect(
      run(input, "--output", path.join(directory, "dots.jpg"), "--dither")
    ).rejects.toThrow();
    await expect(
      run(input, "--output", path.join(directory, "copy.png"), "--width", "0")
    ).rejects.toThrow();
  });
});

describe("dither pixels", () => {
  it("preserves transparent pixels and does not modify the source", () => {
    const pixels = Uint8Array.from([128, 128, 128, 255, 90, 100, 110, 0]);
    expect(ditherImage(pixels, 2, 1)).toEqual(
      Uint8Array.from([255, 255, 255, 255, 90, 100, 110, 0])
    );
    expect(pixels).toEqual(
      Uint8Array.from([128, 128, 128, 255, 90, 100, 110, 0])
    );
  });
  it("rejects incomplete pixel data", () => {
    expect(() => ditherImage(new Uint8Array(4), 2, 1)).toThrow("RGBA");
  });
});
