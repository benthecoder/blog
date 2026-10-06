type StorageKind = "local" | "session";

function storage(kind: StorageKind) {
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

/** Preferences and caches are optional; blocked storage must not break a page. */
export function readStoredString(
  key: string,
  kind: StorageKind = "local"
): string | null {
  try {
    return storage(kind).getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredString(
  key: string,
  value: string,
  kind: StorageKind = "local"
): boolean {
  try {
    storage(kind).setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
