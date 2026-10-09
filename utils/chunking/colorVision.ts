// Color-vision-deficiency simulation (Machado et al. 2009, severity 1.0) and
// CIE76 color difference, used to check the cluster palette stays separable.

type Matrix = [number[], number[], number[]];

export const CVD_MATRICES: Record<
  "protanopia" | "deuteranopia" | "tritanopia",
  Matrix
> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function simulate(
  rgb: [number, number, number],
  matrix?: Matrix
): [number, number, number] {
  const lin = rgb.map(toLinear);
  if (!matrix) return lin as [number, number, number];
  return matrix.map((row) =>
    clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])
  ) as [number, number, number];
}

/** Linear sRGB to CIE Lab (D65). */
export function linearToLab([r, g, b]: [number, number, number]): [
  number,
  number,
  number,
] {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

export function deltaE(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Smallest pairwise ΔE across a palette as seen through an optional CVD matrix. */
export function minPairwiseDeltaE(
  palette: string[],
  matrix?: Matrix
): { min: number; pair: [string, string] } {
  const labs = palette.map((h) => linearToLab(simulate(hexToRgb(h), matrix)));
  let min = Infinity;
  let pair: [string, string] = [palette[0], palette[1]];
  for (let i = 0; i < labs.length; i++) {
    for (let j = i + 1; j < labs.length; j++) {
      const d = deltaE(labs[i], labs[j]);
      if (d < min) {
        min = d;
        pair = [palette[i], palette[j]];
      }
    }
  }
  return { min, pair };
}
