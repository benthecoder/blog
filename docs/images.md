# Image copies

Resize a copy, keeping the original:

```sh
pnpm image ~/Pictures/photo.jpg --output /tmp/photo.webp
```

Dither a copy:

```sh
pnpm image ~/Pictures/photo.jpg --output /tmp/photo-dithered.png --dither --width 640
```

Lower width makes the dots larger when displayed at the same size. The maximum edge defaults to 1920 pixels; smaller images stay at their original size. Orientation is applied before resizing. PNG preserves transparency; JPEG and WebP use quality 85. Dithering uses Stucki error diffusion and requires PNG output.

The command refuses to overwrite any existing output. It never edits originals, processes a whole folder, uploads, or publishes. Compare the copy before adding it to a post.

This replaces `compressImages.js`, `compressImages.sh`, and the hardcoded `dither.mjs` batch script. The existing `/uses` images are unchanged. Run `pnpm image --help` for options.
