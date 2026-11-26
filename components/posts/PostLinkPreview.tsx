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
  PREVIEW_LAYOUTS,
  cachedPostPreview,
  cancelPostPreviewHide,
  dismissPostPreview,
  fetchPostPreview,
  getPostPreviewSnapshot,
  hidePostPreview,
  isPreviewLayout,
  markPostPreviewOpen,
  placePostPreview,
  previewPlacementFromGeometry,
  rememberPostPreview,
  resolvePreviewLayout,
  showPostPreview,
  subscribePostPreview,
  type PreviewLayout,
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

const PREVIEW_PLACE_EVENT = "preview-place-change";

function readRequestedLayout(): PreviewLayout | "auto" {
  if (typeof window === "undefined") return "auto";
  const value = new URLSearchParams(window.location.search).get(
    "preview-place"
  );
  return isPreviewLayout(value) ? value : "auto";
}

function subscribePreviewPlace(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(PREVIEW_PLACE_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(PREVIEW_PLACE_EVENT, listener);
  };
}

function useRequestedPreviewLayout() {
  return useSyncExternalStore(
    subscribePreviewPlace,
    readRequestedLayout,
    () => "auto" as const
  );
}

function setRequestedPreviewLayout(layout: PreviewLayout) {
  const url = new URL(window.location.href);
  url.searchParams.set("preview-place", layout);
  history.replaceState(null, "", url);
  window.dispatchEvent(new Event(PREVIEW_PLACE_EVENT));
}

function resolveLayoutFor(
  requested: PreviewLayout | "auto",
  element: Element
): PreviewLayout {
  const contentRight =
    document.getElementById("content")?.getBoundingClientRect().right ??
    window.innerWidth;
  return resolvePreviewLayout({
    requested,
    isRow: element.getAttribute("data-preview-context") === "row",
    contentRight,
    viewportWidth: window.innerWidth,
  });
}

function showPlacementSwitcher() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host !== "localhost" && !host.endsWith("vercel.app")) return false;
  return window.matchMedia("(pointer: fine) and (min-width: 768px)").matches;
}

function subscribeSwitcher(listener: () => void) {
  window.addEventListener("resize", listener);
  return () => window.removeEventListener("resize", listener);
}

function PreviewPlacementSwitcher() {
  const requested = useRequestedPreviewLayout();
  const visible = useSyncExternalStore(
    subscribeSwitcher,
    showPlacementSwitcher,
    () => false
  );
  if (!visible) return null;
  const active = requested === "auto" ? null : requested;
  return (
    <p className="fixed bottom-3 right-4 z-50 text-caption text-muted">
      placement{" "}
      {PREVIEW_LAYOUTS.map((id, index) => (
        <span key={id}>
          {index > 0 ? " · " : null}
          <a
            href={`?preview-place=${id}`}
            className={id === active ? "text-accent" : "hover:text-accent"}
            onClick={(event) => {
              event.preventDefault();
              setRequestedPreviewLayout(id);
            }}
          >
            {id}
          </a>
        </span>
      ))}
    </p>
  );
}

function isStillTargeted(el: HTMLAnchorElement | null) {
  return Boolean(el && (el.matches(":hover") || el === document.activeElement));
}

// Hover card for internal post links. List rows and markdown links pass
// `preview` resolved on the server so the card can open without a fetch.
// A slug-only trigger (the design-page specimen) still fetches once on first
// hover and caches the result. One shared card (PostPreviewHost) stays mounted
// so moving between titles can glide, the same way the site-nav label does.
const PostLinkPreview = ({
  slug,
  preview: initialPreview,
  context = "inline",
  className,
  children,
}: {
  slug: string;
  preview?: PostPreviewData;
  context?: "row" | "inline";
  className?: string;
  children: ReactNode;
}) => {
  const anchorName = postPreviewAnchorName(useId());
  const ref = useRef<HTMLAnchorElement>(null);
  // Subscribe to a boolean, not the whole snapshot, so the other titles in a
  // long archive do not re-render when the card moves.
  const described = useSyncExternalStore(
    subscribePostPreview,
    () => {
      const snapshot = getPostPreviewSnapshot();
      return (
        snapshot.kind === "visible" && snapshot.target.anchorName === anchorName
      );
    },
    () => false
  );

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
      data-preview-context={context}
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
  const pathnameAtMount = useRef(pathname);
  const requested = useRequestedPreviewLayout();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mode = useAnchorMode();
  const [placement, setPlacement] = useState<PreviewPlacement>("top");
  const [jsPos, setJsPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const layout =
    snapshot.kind === "visible" && typeof document !== "undefined"
      ? resolveLayoutFor(requested, snapshot.target.element)
      : "float";

  useEffect(() => {
    if (pathnameAtMount.current === pathname) return;
    pathnameAtMount.current = pathname;
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
      const anchor = snapshot.target.element.getBoundingClientRect();
      if (mode === "css") {
        setPlacement(
          layout === "float"
            ? previewPlacementFromGeometry(rect, anchor)
            : "right"
        );
        return;
      }
      const contentRight =
        document.getElementById("content")?.getBoundingClientRect().right ??
        window.innerWidth;
      const next = placePostPreview({
        layout,
        anchor,
        card: rect,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        contentRight,
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
  }, [snapshot, mode, layout]);

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

  const card = snapshot.kind === "visible" && mode && (
    <div
      ref={tooltipRef}
      id={POST_PREVIEW_TOOLTIP_ID}
      className={`post-preview-tooltip z-50${mode === "js" ? " post-preview-tooltip--js" : ""}`}
      style={
        mode === "css"
          ? ({
              "--post-preview-anchor": snapshot.target.anchorName,
            } as CSSProperties)
          : jsPos
            ? { top: jsPos.top, left: jsPos.left }
            : { visibility: "hidden" }
      }
      role="tooltip"
      data-placement={placement}
      data-layout={layout}
      onPointerEnter={layout === "rail" ? undefined : cancelPostPreviewHide}
      onPointerLeave={layout === "rail" ? undefined : hidePostPreview}
    >
      <div
        data-status={snapshot.status}
        className={
          layout === "rail"
            ? "post-link-preview"
            : "post-link-preview max-w-xs p-3 rounded-md shadow-md border border-line bg-raised"
        }
      >
        <p className="text-xs font-bold text-primary mb-0.5">
          {snapshot.target.preview.title}
        </p>
        <p className="text-2xs text-secondary mb-1.5">
          {new Date(snapshot.target.preview.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <p className="text-caption leading-relaxed text-muted">
          {snapshot.target.preview.excerpt}
        </p>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {card}
      <PreviewPlacementSwitcher />
    </>,
    document.body
  );
}

export default PostLinkPreview;
