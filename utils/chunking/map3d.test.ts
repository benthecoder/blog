import { describe, expect, it } from "vitest";
import {
  STRIDE,
  backToFront,
  centroids,
  clampPitch,
  clampZoom,
  depthFactor,
  MAX_PITCH,
  MAX_ZOOM,
  MIN_ZOOM,
  nearestPoint,
  projectAll,
  rotate,
} from "./map3d";

describe("rotate", () => {
  it("is the identity at zero angles", () => {
    const p = rotate({ x: 0.3, y: -0.2, z: 0.5 }, 0, 0);
    expect(p.x).toBeCloseTo(0.3);
    expect(p.y).toBeCloseTo(-0.2);
    expect(p.z).toBeCloseTo(0.5);
  });

  it("a quarter yaw swings z into x", () => {
    const p = rotate({ x: 0, y: 0, z: 1 }, Math.PI / 2, 0);
    expect(p.x).toBeCloseTo(1);
    expect(p.z).toBeCloseTo(0);
  });

  it("preserves length", () => {
    const p = rotate({ x: 0.4, y: 0.7, z: -0.2 }, 1.1, -0.6);
    expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(Math.hypot(0.4, 0.7, 0.2));
  });
});

describe("projectAll", () => {
  const view = { yaw: 0, pitch: 0, radius: 100 };

  it("puts the origin at the view center", () => {
    const out = new Float32Array(STRIDE);
    projectAll([0, 0, 0], view, out);
    expect(out[0]).toBeCloseTo(0);
    expect(out[1]).toBeCloseTo(0);
    expect(out[3]).toBeCloseTo(1);
  });

  it("magnifies points nearer the camera", () => {
    const out = new Float32Array(STRIDE * 2);
    projectAll([0.5, 0, 0.8, 0.5, 0, -0.8], view, out);
    expect(out[0]).toBeGreaterThan(out[STRIDE]);
    expect(out[2]).toBeGreaterThan(out[STRIDE + 2]);
  });

  it("flips y so up is negative screen y", () => {
    const out = new Float32Array(STRIDE);
    projectAll([0, 1, 0], view, out);
    expect(out[1]).toBeLessThan(0);
  });
});

describe("backToFront", () => {
  it("orders far to near", () => {
    const out = new Float32Array(STRIDE * 3);
    projectAll(
      [0, 0, 0.5, 0, 0, -0.5, 0, 0, 0],
      { yaw: 0, pitch: 0, radius: 1 },
      out
    );
    expect(Array.from(backToFront(out, 3))).toEqual([1, 2, 0]);
  });
});

describe("nearestPoint", () => {
  const out = new Float32Array(STRIDE * 2);
  projectAll([0, 0, 0, 0.5, 0, 0], { yaw: 0, pitch: 0, radius: 100 }, out);

  it("finds the point under the cursor", () => {
    expect(nearestPoint(out, 2, 49, 1, 10)).toBe(1);
  });

  it("returns -1 when nothing is in range", () => {
    expect(nearestPoint(out, 2, 300, 300, 10)).toBe(-1);
  });
});

describe("centroids", () => {
  it("averages per group", () => {
    const c = centroids(
      [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 4, z: 6 },
        { x: 10, y: 10, z: 10 },
      ],
      [1, 1, 2]
    );
    expect(c.get(1)).toEqual({ x: 1, y: 2, z: 3, count: 2 });
    expect(c.get(2)?.count).toBe(1);
  });
});

describe("clamps", () => {
  it("bounds zoom and pitch", () => {
    expect(clampZoom(100)).toBe(MAX_ZOOM);
    expect(clampZoom(0)).toBe(MIN_ZOOM);
    expect(clampPitch(5)).toBe(MAX_PITCH);
    expect(clampPitch(-5)).toBe(-MAX_PITCH);
  });

  it("maps depth to 0..1", () => {
    expect(depthFactor(-2)).toBe(0);
    expect(depthFactor(0)).toBeCloseTo(0.5);
    expect(depthFactor(3)).toBe(1);
  });
});
