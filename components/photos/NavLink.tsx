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
  // photos.bneo.xyz rewrites "/places" to "/photos/places": the server sees
  // the rewritten path and the browser the short one, so compare short paths
  // or hydration disagrees.
  const pathname = usePathname().replace(/^\/photos(?=\/|$)/, "") || "/";
  const within = (base: string) =>
    pathname === base || (!exact && pathname.startsWith(`${base}/`));
  const active = within(href) || (also !== undefined && within(also));
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
