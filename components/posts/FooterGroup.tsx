import type { ReactNode } from "react";

/** One labelled group at the foot of a post: similar posts, on this day,
    previous and next. Every group shares this label so the footer reads as
    one list of ways onward. */
export const footerLink =
  "text-primary hover:text-accent transition-colors duration-150";

export function FooterGroup({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}
