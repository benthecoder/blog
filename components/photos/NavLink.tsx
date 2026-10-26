"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  exact,
  also,
  children,
}: {
  href: string;
  exact?: boolean;
  // Another section that counts as this link.
  also?: string;
  children: ReactNode;
}) {
  // photos.bneo.xyz serves /photos at "/": the server renders /photos while
  // the browser reports "/", so treat them alike or hydration disagrees.
  const raw = usePathname();
  const pathname = raw === "/" ? "/photos" : raw;
  const within = (base: string) =>
    pathname === base || (!exact && pathname.startsWith(`${base}/`));
  const active = within(href) || (also !== undefined && within(also));
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
