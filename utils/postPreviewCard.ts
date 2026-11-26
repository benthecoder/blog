import { ANCHOR_TOOLTIP_HIDE_MS } from "./cssAnchor";
import type { PostPreviewData } from "@/utils/content/preview";

/** Matches the previous Floating UI open delay so skimming a list does not flash cards. */
export const PREVIEW_OPEN_DELAY_MS = 150;

/** Matches the CSS close fade on `.post-link-preview`. */
export const PREVIEW_CLOSE_MS = 100;

const PREVIEW_GAP_PX = 14;
const PREVIEW_VIEWPORT_PAD_PX = 8;

export const POST_PREVIEW_TOOLTIP_ID = "post-preview-tooltip";

export type PreviewPlacement = "top" | "bottom";

export type PreviewAnchor = {
  slug: string;
  preview: PostPreviewData;
  anchorName: `--${string}`;
  element: Element;
};

export type PreviewSnapshot =
  | { kind: "hidden" }
  | {
      kind: "visible";
      status: "initial" | "open" | "close";
      target: PreviewAnchor;
    };

const cache = new Map<string, PostPreviewData>();
const inflight = new Map<string, Promise<PostPreviewData | null>>();

export function parsePostPreviewData(value: unknown): PostPreviewData | null {
  if (typeof value !== "object" || value === null) return null;
  if (!("slug" in value) || typeof value.slug !== "string") return null;
  if (!("title" in value) || typeof value.title !== "string") return null;
  if (!("date" in value) || typeof value.date !== "string") return null;
  if (!("excerpt" in value) || typeof value.excerpt !== "string") return null;
  return {
    slug: value.slug,
    title: value.title,
    date: value.date,
    excerpt: value.excerpt,
  };
}

export function rememberPostPreview(preview: PostPreviewData): PostPreviewData {
  cache.set(preview.slug, preview);
  return preview;
}

export function cachedPostPreview(slug: string): PostPreviewData | undefined {
  return cache.get(slug);
}

export function fetchPostPreview(
  slug: string
): Promise<PostPreviewData | null> {
  const cached = cache.get(slug);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(slug);
  if (existing) return existing;
  const request = fetch(`/api/post-preview/${slug}`)
    .then(async (res) =>
      res.ok ? parsePostPreviewData(await res.json()) : null
    )
    .then((data) => (data ? rememberPostPreview(data) : null))
    .catch(() => null)
    .finally(() => {
      inflight.delete(slug);
    });
  inflight.set(slug, request);
  return request;
}

export function placePostPreview({
  anchor,
  card,
  viewport,
  gap = PREVIEW_GAP_PX,
  padding = PREVIEW_VIEWPORT_PAD_PX,
}: {
  anchor: Pick<DOMRect, "top" | "bottom" | "left">;
  card: Pick<DOMRect, "width" | "height">;
  viewport: { width: number; height: number };
  gap?: number;
  padding?: number;
}): { top: number; left: number; placement: PreviewPlacement } {
  const above = anchor.top - gap - card.height;
  const placement: PreviewPlacement = above < padding ? "bottom" : "top";
  const top = placement === "top" ? above : anchor.bottom + gap;
  const left = Math.min(
    Math.max(anchor.left, padding),
    Math.max(padding, viewport.width - card.width - padding)
  );
  return { top, left, placement };
}

/** Used placement after CSS `position-try` has run. */
export function previewPlacementFromGeometry(
  card: Pick<DOMRect, "bottom">,
  anchor: Pick<DOMRect, "top">
): PreviewPlacement {
  return card.bottom <= anchor.top + 1 ? "top" : "bottom";
}

let snapshot: PreviewSnapshot = { kind: "hidden" };
const listeners = new Set<() => void>();

function emit(next: PreviewSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function getPostPreviewSnapshot(): PreviewSnapshot {
  return snapshot;
}

export function subscribePostPreview(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;
let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let pending: PreviewAnchor | null = null;

function clearTimer(timer: ReturnType<typeof setTimeout> | null) {
  if (timer) clearTimeout(timer);
  return null;
}

function clearTimers() {
  openTimer = clearTimer(openTimer);
  hideTimer = clearTimer(hideTimer);
  closeTimer = clearTimer(closeTimer);
}

export function showPostPreview(target: PreviewAnchor, delay: boolean) {
  pending = target;
  hideTimer = clearTimer(hideTimer);
  closeTimer = clearTimer(closeTimer);

  const reveal = () => {
    if (pending !== target) return;
    openTimer = null;
    if (snapshot.kind === "visible") {
      emit({ kind: "visible", status: "open", target });
      return;
    }
    emit({ kind: "visible", status: "initial", target });
  };

  openTimer = clearTimer(openTimer);
  if (delay && snapshot.kind === "hidden") {
    openTimer = setTimeout(reveal, PREVIEW_OPEN_DELAY_MS);
    return;
  }
  reveal();
}

export function hidePostPreview() {
  pending = null;
  openTimer = clearTimer(openTimer);
  hideTimer = clearTimer(hideTimer);
  hideTimer = setTimeout(() => {
    hideTimer = null;
    if (snapshot.kind !== "visible") return;
    emit({ ...snapshot, status: "close" });
    closeTimer = setTimeout(() => {
      closeTimer = null;
      emit({ kind: "hidden" });
    }, PREVIEW_CLOSE_MS);
  }, ANCHOR_TOOLTIP_HIDE_MS);
}

export function cancelPostPreviewHide() {
  hideTimer = clearTimer(hideTimer);
  closeTimer = clearTimer(closeTimer);
  if (snapshot.kind === "visible" && snapshot.status === "close") {
    emit({ ...snapshot, status: "open" });
  }
}

export function dismissPostPreview() {
  pending = null;
  clearTimers();
  if (snapshot.kind !== "visible") return;
  emit({ ...snapshot, status: "close" });
  closeTimer = setTimeout(() => {
    closeTimer = null;
    emit({ kind: "hidden" });
  }, PREVIEW_CLOSE_MS);
}

export function markPostPreviewOpen() {
  if (snapshot.kind === "visible" && snapshot.status === "initial") {
    emit({ ...snapshot, status: "open" });
  }
}

/** Test-only: drop cached previews and reset the shared card. */
export function resetPostPreviewCard() {
  clearTimers();
  pending = null;
  cache.clear();
  inflight.clear();
  snapshot = { kind: "hidden" };
}
