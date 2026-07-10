"use client";

import { useRandomPost } from "./useRandomPost";

// Mounts the global "r" keyboard shortcut / dice-click handler.
export function RandomPostListener() {
  useRandomPost();
  return null;
}
