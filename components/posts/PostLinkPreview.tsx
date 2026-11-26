"use client";

import {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  postPreviewAnchorName,
  supportsCssAnchorPositioning,
} from "@/utils/cssAnchor";
import {
  POST_PREVIEW_TOOLTIP_ID,
  cachedPostPreview,
  cancelPostPreviewHide,
  dismissPostPreview,
  fetchPostPreview,
  getPostPreviewSnapshot,
  hidePostPreview,
  markPostPreviewOpen,
  placePostPreview,
  previewPlacementFromGeometry,
  rememberPostPreview,
  showPostPreview,
  subscribePostPreview,
  type PreviewPlacement,
} from "@/utils/postPreviewCard";
import type { PostPreviewData } from "@/utils/content/preview";

function usePostPreviewSnapshot() {
  return useSyncExternalStore(
    subscribePostPreview,
    getPostPreviewSnapshot,
    getPostPreviewSnapshot
  );
}

function getAnchorMode(): "css" | "js" {
  return supportsCssAnchorPositioning() ? "css" : "js";
}

function useAnchorMode(): "css" | "js" | null {
  return useSyncExternalStore(subscribeNever, getAnchorMode, () => null);
}

function subscribeNever() {
  return () => {};
}

function isStillTargeted(el: HTMLAnchorElement | null) {
  return Boolean(el && (el.matches(":hover") || el === document.activeElement));
}

// Hover card for internal post links. Markdown links pass `preview` resolved
// on the server; list contexts with too many posts to inline (e.g. the
// archive) pass only `slug` and the data is fetched once on first hover.
// One shared card (PostPreviewHost) stays mounted so moving between titles
// can glide, the same way the site-nav label does.
const PostLinkPreview = ({
  slug,
  preview: initialPreview,
  className,
  children,
}: {
  slug: string;
  preview?: PostPreviewData;
  className?: string;
  children: ReactNode;
}) => {
  const anchorName = postPreviewAnchorName(useId());
  const ref = useRef<HTMLAnchorElement>(null);
  const snapshot = usePostPreviewSnapshot();
  const described =
    snapshot.kind === "visible" && snapshot.target.anchorName === anchorName;

  const loadAndShow = (delay: boolean) => {
    const el = ref.current;
    if (!el) return;
    cancelPostPreviewHide();
    const reveal = (preview: PostPreviewData) => {
      rememberPostPreview(preview);
      showPostPreview({ slug, preview, anchorName, element: el }, delay);
    };
    const cached = initialPreview ?? cachedPostPreview(slug);
    if (cached) {
      reveal(cached);
      return;
    }
    void fetchPostPreview(slug).then((data) => {
      if (!data || !isStillTargeted(ref.current)) return;
      reveal(data);
    });
  };

  return (
    <Link
      href={`/posts/${slug}`}
      prefetch={described ? null : false}
      ref={ref}
      className={["post-preview-link", className].filter(Boolean).join(" ")}
      style={{ "--post-preview-name": anchorName } as CSSProperties}
      aria-describedby={described ? POST_PREVIEW_TOOLTIP_ID : undefined}
      onMouseEnter={() => loadAndShow(true)}
      onFocus={() => loadAndShow(false)}
      onMouseLeave={hidePostPreview}
      onBlur={hidePostPreview}
    >
      {children}
    </Link>
  );
};

export function PostPreviewHost() {
  const snapshot = usePostPreviewSnapshot();
  const pathname = usePathname();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mode = useAnchorMode();
  const [placement, setPlacement] = useState<PreviewPlacement>("top");
  const [jsPos, setJsPos] = useState<{ top: number; left: number } | null>(
    null
  );

  useEffect(() => {
    dismissPostPreview();
  }, [pathname]);

  useEffect(() => {
    if (snapshot.kind === "visible" && snapshot.status === "initial") {
      const frame = requestAnimationFrame(() => markPostPreviewOpen());
      return () => cancelAnimationFrame(frame);
    }
  }, [snapshot]);

  useLayoutEffect(() => {
    if (snapshot.kind !== "visible" || !mode) return;
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const update = () => {
      const rect = tooltip.getBoundingClientRect();
      if (mode === "css") {
        setPlacement(
          previewPlacementFromGeometry(
            rect,
            snapshot.target.element.getBoundingClientRect()
          )
        );
        return;
      }
      const next = placePostPreview({
        anchor: snapshot.target.element.getBoundingClientRect(),
        card: rect,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      });
      setPlacement(next.placement);
      setJsPos({ top: next.top, left: next.left });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [snapshot, mode]);

  useEffect(() => {
    if (snapshot.kind !== "visible") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissPostPreview();
    };
    const onPointerDown = (event: PointerEvent) => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof Node)) return;
      if (snapshot.target.element.contains(eventTarget)) return;
      if (tooltipRef.current?.contains(eventTarget)) return;
      dismissPostPreview();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [snapshot]);

  if (snapshot.kind !== "visible" || !mode) return null;

  const { preview, anchorName } = snapshot.target;
  const style: CSSProperties =
    mode === "css"
      ? ({ "--post-preview-anchor": anchorName } as CSSProperties)
      : jsPos
        ? { top: jsPos.top, left: jsPos.left }
        : { visibility: "hidden" };

  return createPortal(
    <div
      ref={tooltipRef}
      id={POST_PREVIEW_TOOLTIP_ID}
      className={`post-preview-tooltip z-50${mode === "js" ? " post-preview-tooltip--js" : ""}`}
      style={style}
      role="tooltip"
      data-placement={placement}
      onPointerEnter={cancelPostPreviewHide}
      onPointerLeave={hidePostPreview}
    >
      <div
        data-status={snapshot.status}
        className="post-link-preview max-w-xs p-3 rounded-md shadow-md border border-line bg-raised"
      >
        <p className="text-xs font-bold text-primary mb-0.5">{preview.title}</p>
        <p className="text-2xs text-secondary mb-1.5">
          {new Date(preview.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="text-caption leading-relaxed text-muted">
          {preview.excerpt}
        </p>
      </div>
    </div>,
    document.body
  );
}

export default PostLinkPreview;
