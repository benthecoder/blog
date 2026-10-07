// Local authoring runs in one Node process. Reject overlapping publish and
// unpublish requests for a slug until its asset cleanup has completed.
// Next may load each route in a separate bundle; share the guard across them.
const processState = globalThis as typeof globalThis & {
  __blogPostTransitions?: Set<string>;
};
const active = (processState.__blogPostTransitions ??= new Set<string>());

export function acquirePostTransition(slug: string): (() => void) | null {
  if (active.has(slug)) return null;
  active.add(slug);
  return () => active.delete(slug);
}
