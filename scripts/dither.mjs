import sharp from "sharp";
import { readdirSync } from "fs";
import { join } from "path";

const dir = "./public/images/uses";
const alreadyDithered = ["anua", "bp", "differin", "joseonspf", "laroche", "roundlab", "airpodspro2", "fujifilmx100s", "m1air", "portapro", "remarkable2", "xteinkx4", "applekeyboard", "applewatchs8", "osprey", "trackpad"];
const files = readdirSync(dir).filter(f => {
  if (!/\.(png|jpg|jpeg)$/i.test(f)) return false;
  const base = f.replace(/\.(png|jpg|jpeg)$/i, "");
  return !alreadyDithered.includes(base);
});

const stucki = [
  [1, 0, 8/42], [2, 0, 4/42],
  [-2, 1, 2/42], [-1, 1, 4/42], [0, 1, 8/42], [1, 1, 4/42], [2, 1, 2/42],
  [-2, 2, 1/42], [-1, 2, 2/42], [0, 2, 4/42], [1, 2, 2/42], [2, 2, 1/42],
];

function ditherStucki(pixels, width, height) {
  const data = new Float32Array(pixels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 128) continue;

      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const newVal = gray < 128 ? 0 : 255;
      const error = gray - newVal;

      data[i] = newVal;
      data[i + 1] = newVal;
      data[i + 2] = newVal;

      for (const [dx, dy, weight] of stucki) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny < height) {
          const ni = (ny * width + nx) * 4;
          if (data[ni + 3] >= 128) {
            data[ni] += error * weight;
            data[ni + 1] += error * weight;
            data[ni + 2] += error * weight;
          }
        }
      }
    }
  }

  return Buffer.from(data.map(v => Math.max(0, Math.min(255, Math.round(v)))));
}

for (const file of files) {
  const input = join(dir, file);
  console.log(`Dithering ${file}...`);

  const image = sharp(input);
  const { width, height } = await image.metadata();
  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const dithered = ditherStucki(data, width, height);

  await sharp(dithered, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(input);

  console.log(`Done: ${file}`);
}

console.log("All done!");
