import { parseArgs } from "node:util";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ditherImage } from "../utils/images/dither";

const usage = `pnpm image INPUT --output OUTPUT [--width 1920] [--dither]

Create a resized copy as .png, .jpg or .webp. Originals are preserved.
--width sets the longest edge (default 1920); small images are not enlarged.
--dither creates a black-and-white PNG. Try --width 640 for larger dots.
An existing output is never overwritten.`;

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      output: { type: "string", short: "o" },
      width: { type: "string" },
      dither: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });
  if (values.help || (!positionals.length && !Object.keys(values).length)) {
    console.log(usage);
    return;
  }
  if (positionals.length !== 1 || !values.output) throw new Error(usage);
  const width = Number(values.width ?? 1920);
  if (!Number.isInteger(width) || width < 1 || width > 4096)
    throw new Error("Width must be between 1 and 4096 pixels.");
  const extension = path.extname(values.output).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension))
    throw new Error("Use a .png, .jpg or .webp output.");
  if (values.dither && extension !== ".png")
    throw new Error("Use a .png output for dithering.");

  let image = sharp(positionals[0])
    .autoOrient()
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true });
  if (values.dither) {
    const { data, info } = await image
      .toColourspace("srgb")
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    image = sharp(ditherImage(data, info.width, info.height), {
      raw: { width: info.width, height: info.height, channels: 4 },
    });
  }
  const encoded = await (
    extension === ".png"
      ? image.png()
      : extension === ".webp"
        ? image.webp({ quality: 85 })
        : image.jpeg({ quality: 85, progressive: true })
  ).toBuffer();
  await writeFile(values.output, encoded, { flag: "wx" });
  console.log(
    `Created ${values.output} (${Math.round(encoded.length / 1024)} KB)`
  );
}

main().catch((error: NodeJS.ErrnoException) => {
  console.error(
    error.code === "EEXIST"
      ? "Output already exists. Choose a new name."
      : error.message
  );
  process.exitCode = 1;
});
