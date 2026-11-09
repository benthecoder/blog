"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavLink } from "./NavLink";

// Inline links on wide screens; a menu button on phones.
export function PhotoNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState(pathname);
  // Close the menu after navigating.
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }
  return (
    <>
      <button
        className="focus-ring photo-menu-button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="photo-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      <nav
        id="photo-nav"
        aria-label="Photos"
        className={open ? "is-open" : undefined}
      >
        <NavLink href="/" exact>
          All
        </NavLink>
        <NavLink href="/places" also="/sets">
          Places
        </NavLink>
        <a href="https://bneo.xyz">
          Blog{" "}
          <span className="photo-out" aria-hidden>
            ↗
          </span>
        </a>
      </nav>
    </>
  );
}
