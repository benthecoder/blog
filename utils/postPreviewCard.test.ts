import { afterEach, describe, expect, it, vi } from "vitest";
import { ANCHOR_TOOLTIP_HIDE_MS } from "./cssAnchor";
import {
  PREVIEW_CLOSE_MS,
  PREVIEW_OPEN_DELAY_MS,
  cancelPostPreviewHide,
  dismissPostPreview,
  getPostPreviewSnapshot,
  hidePostPreview,
  markPostPreviewOpen,
  parsePostPreviewData,
  placePostPreview,
  previewPlacementFromGeometry,
  rememberPostPreview,
  resetPostPreviewCard,
  showPostPreview,
  cachedPostPreview,
} from "./postPreviewCard";

const preview = {
  slug: "ask",
  title: "Ask For What You Want",
  date: "2024-01-10",
  excerpt: "Ask for what you want.",
};

const target = {
  slug: "ask",
  preview,
  anchorName: "--post-preview-ask" as const,
  element: {} as Element,
};

afterEach(() => {
  vi.useRealTimers();
  resetPostPreviewCard();
});

describe("parsePostPreviewData", () => {
  it("accepts a complete preview and rejects missing fields", () => {
    expect(parsePostPreviewData(preview)).toEqual(preview);
    expect(parsePostPreviewData({ ...preview, excerpt: 1 })).toBeNull();
    expect(parsePostPreviewData(null)).toBeNull();
  });
});

describe("placePostPreview", () => {
  const card = { width: 320, height: 120 };

  it("sits above the anchor when there is room, pinned to the start", () => {
    expect(
      placePostPreview({
        anchor: { top: 200, bottom: 220, left: 40 },
        card,
        viewport: { width: 800, height: 600 },
      })
    ).toEqual({ top: 66, left: 40, placement: "top" });
  });

  it("flips below when the top of the viewport is too tight", () => {
    expect(
      placePostPreview({
        anchor: { top: 20, bottom: 40, left: 40 },
        card,
        viewport: { width: 800, height: 600 },
      })
    ).toEqual({ top: 54, left: 40, placement: "bottom" });
  });

  it("keeps the card inside the viewport horizontally", () => {
    expect(
      placePostPreview({
        anchor: { top: 200, bottom: 220, left: 700 },
        card,
        viewport: { width: 800, height: 600 },
      })
    ).toEqual({ top: 66, left: 472, placement: "top" });
  });
});

describe("previewPlacementFromGeometry", () => {
  it("is top when the card sits fully above the anchor", () => {
    expect(previewPlacementFromGeometry({ bottom: 100 }, { top: 120 })).toBe(
      "top"
    );
    expect(previewPlacementFromGeometry({ bottom: 200 }, { top: 120 })).toBe(
      "bottom"
    );
  });
});

describe("showPostPreview", () => {
  it("keeps the first-open delay short enough to feel instant", () => {
    expect(PREVIEW_OPEN_DELAY_MS).toBeLessThanOrEqual(60);
  });

  it("waits to open on a delayed first show, then retargets immediately", () => {
    vi.useFakeTimers();
    showPostPreview(target, true);
    expect(getPostPreviewSnapshot()).toEqual({ kind: "hidden" });
    vi.advanceTimersByTime(PREVIEW_OPEN_DELAY_MS);
    expect(getPostPreviewSnapshot()).toMatchObject({
      kind: "visible",
      status: "initial",
      target,
    });
    markPostPreviewOpen();
    expect(getPostPreviewSnapshot()).toMatchObject({ status: "open" });

    const next = {
      ...target,
      slug: "other",
      anchorName: "--post-preview-other" as const,
    };
    showPostPreview(next, true);
    expect(getPostPreviewSnapshot()).toMatchObject({
      kind: "visible",
      status: "open",
      target: next,
    });
  });

  it("opens immediately when delay is false", () => {
    showPostPreview(target, false);
    expect(getPostPreviewSnapshot()).toMatchObject({
      kind: "visible",
      status: "initial",
    });
  });

  it("keeps the card mounted across a brief hide so the next title can claim it", () => {
    vi.useFakeTimers();
    showPostPreview(target, false);
    markPostPreviewOpen();
    hidePostPreview();
    expect(getPostPreviewSnapshot()).toMatchObject({ status: "open" });
    vi.advanceTimersByTime(ANCHOR_TOOLTIP_HIDE_MS - 1);
    showPostPreview(target, true);
    expect(getPostPreviewSnapshot()).toMatchObject({ status: "open" });
  });

  it("cancelling a close mid-fade restores the open card", () => {
    vi.useFakeTimers();
    showPostPreview(target, false);
    markPostPreviewOpen();
    hidePostPreview();
    vi.advanceTimersByTime(ANCHOR_TOOLTIP_HIDE_MS);
    expect(getPostPreviewSnapshot()).toMatchObject({ status: "close" });
    cancelPostPreviewHide();
    expect(getPostPreviewSnapshot()).toMatchObject({ status: "open" });
  });

  it("dismisses with the close fade, then unmounts", () => {
    vi.useFakeTimers();
    showPostPreview(target, false);
    markPostPreviewOpen();
    dismissPostPreview();
    expect(getPostPreviewSnapshot()).toMatchObject({ status: "close" });
    vi.advanceTimersByTime(PREVIEW_CLOSE_MS);
    expect(getPostPreviewSnapshot()).toEqual({ kind: "hidden" });
  });
});

describe("rememberPostPreview", () => {
  it("stores a preview for later hovers of the same slug", () => {
    rememberPostPreview(preview);
    expect(cachedPostPreview("ask")).toEqual(preview);
  });
});
