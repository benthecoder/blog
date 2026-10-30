// Pure math for the 3D knowledge map: orbit rotation, perspective projection,
// hit-testing and cluster centroids. No DOM, so it can be unit-tested.

export const CAMERA_DISTANCE = 2.2;
export const MIN_ZOOM = 0.6;
export const MAX_ZOOM = 4;
export const MAX_PITCH = Math.PI / 2 - 0.05;

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export interface View {
  yaw: number;
  pitch: number;
  // pixels per unit at depth 0 (cloud radius is ~1)
  radius: number;
  distance?: number;
}

// Per point: screen x offset, screen y offset (from view center), rotated
// depth (+ toward the camera), perspective scale.
export const STRIDE = 4;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export const clampZoom = (z: number) => clamp(z, MIN_ZOOM, MAX_ZOOM);
export const clampPitch = (p: number) => clamp(p, -MAX_PITCH, MAX_PITCH);

/** Yaw about the vertical axis, then pitch about the horizontal one. */
export function rotate(p: Point3, yaw: number, pitch: number): Point3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return { x: x1, y: p.y * cp - z1 * sp, z: p.y * sp + z1 * cp };
}

/**
 * Rotate and perspective-project flat xyz coordinates into `out`
 * (STRIDE floats per point). Screen y grows downward.
 */
export function projectAll(
  xyz: ArrayLike<number>,
  view: View,
  out: Float32Array
): void {
  const d = view.distance ?? CAMERA_DISTANCE;
  const cy = Math.cos(view.yaw);
  const sy = Math.sin(view.yaw);
  const cp = Math.cos(view.pitch);
  const sp = Math.sin(view.pitch);
  const n = xyz.length / 3;
  for (let i = 0; i < n; i++) {
    const x = xyz[i * 3];
    const y = xyz[i * 3 + 1];
    const z = xyz[i * 3 + 2];
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    const s = d / (d - z2);
    const o = i * STRIDE;
    out[o] = x1 * s * view.radius;
    out[o + 1] = -y2 * s * view.radius;
    out[o + 2] = z2;
    out[o + 3] = s;
  }
}

/** Indices ordered far to near, so nearer points paint over farther ones. */
export function backToFront(
  projected: Float32Array,
  count: number,
  order: Uint32Array = new Uint32Array(count)
): Uint32Array {
  for (let i = 0; i < count; i++) order[i] = i;
  order.sort((a, b) => projected[a * STRIDE + 2] - projected[b * STRIDE + 2]);
  return order;
}

/**
 * Nearest point to (px, py), measured from the view center, within
 * `maxDist` screen pixels; closer-to-camera wins near-ties.
 */
export function nearestPoint(
  projected: Float32Array,
  count: number,
  px: number,
  py: number,
  maxDist: number
): number {
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < count; i++) {
    const o = i * STRIDE;
    const dist = Math.hypot(projected[o] - px, projected[o + 1] - py);
    if (dist > maxDist) continue;
    // depth is in cloud units (~[-1, 1]); a small bias favors the front
    const score = dist - projected[o + 2] * 3;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/** Mean position of the points belonging to each group id. */
export function centroids(
  points: Point3[],
  groups: number[]
): Map<number, Point3 & { count: number }> {
  const sums = new Map<number, Point3 & { count: number }>();
  points.forEach((p, i) => {
    const g = groups[i];
    const s = sums.get(g) ?? { x: 0, y: 0, z: 0, count: 0 };
    s.x += p.x;
    s.y += p.y;
    s.z += p.z;
    s.count += 1;
    sums.set(g, s);
  });
  sums.forEach((s) => {
    s.x /= s.count;
    s.y /= s.count;
    s.z /= s.count;
  });
  return sums;
}

/** 0 (far side) to 1 (near side) for a depth in cloud units. */
export function depthFactor(z: number): number {
  return clamp((z + 1) / 2, 0, 1);
}
