import { DRAWINGS_URL } from "./constants";

// Every published sketch, in the order /sketch shows them. Width and height
// are the source pixels, so thumbnails keep their aspect ratio.
export const SKETCHES = [
  {
    file: "handrose.png",
    label: "hand rose pencil sketch",
    width: 1096,
    height: 1519,
  },
  {
    file: "sunflowersketch.png",
    label: "sunflower pencil sketch",
    width: 1404,
    height: 1872,
  },
  {
    file: "peony.png",
    label: "peony pencil sketch",
    width: 1404,
    height: 1872,
  },
  {
    file: "hummingbird.png",
    label: "hummingbird pencil sketch",
    width: 1404,
    height: 1872,
  },
  {
    file: "howl.png",
    label: "howl's moving castle sketch",
    width: 1389,
    height: 1850,
  },
  {
    file: "hokusai.png",
    label: "hokusai wave ink sketch",
    width: 1404,
    height: 1872,
  },
  { file: "christ.png", label: "christ sketch", width: 1404, height: 1872 },
  { file: "metro.png", label: "metro scene sketch", width: 1872, height: 1404 },
  { file: "wave.png", label: "wave sketch", width: 1282, height: 1518 },
  {
    file: "room.png",
    label: "room interior sketch",
    width: 1872,
    height: 1404,
  },
  { file: "angel.png", label: "angel sketch", width: 951, height: 1827 },
].map((sketch) => ({ ...sketch, src: `${DRAWINGS_URL}/${sketch.file}` }));
