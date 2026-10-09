import { describe, expect, it } from "vitest";
import { CVD_MATRICES, minPairwiseDeltaE } from "./colorVision";
import { CLUSTER_COLORS_DARK, CLUSTER_COLORS_LIGHT } from "./mapPalette";

const MIN_DELTA_E = 12;

describe("cluster palette", () => {
  for (const [name, palette] of [
    ["light", CLUSTER_COLORS_LIGHT],
    ["dark", CLUSTER_COLORS_DARK],
  ] as const) {
    it(`${name}: no two hues collapse under normal vision`, () => {
      expect(minPairwiseDeltaE(palette).min).toBeGreaterThanOrEqual(
        MIN_DELTA_E
      );
    });

    for (const [vision, matrix] of Object.entries(CVD_MATRICES)) {
      it(`${name}: stays separable under ${vision}`, () => {
        const { min, pair } = minPairwiseDeltaE(palette, matrix);
        expect(min, `closest pair ${pair.join(" / ")}`).toBeGreaterThanOrEqual(
          MIN_DELTA_E
        );
      });
    }
  }
});
