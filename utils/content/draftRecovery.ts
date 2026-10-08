interface DraftBackup {
  markdown: string;
  date: string;
  timestamp: number;
}

// Date-scoped keys keep new entries from replacing another day's recovery copy.
export function draftRecoveryKey(slug: string, dateParam: string | null) {
  return slug === "new" && dateParam
    ? `draft-new-${dateParam}`
    : `draft-${slug}`;
}

export function readDraftBackup(key: string): DraftBackup | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const draft = value as Partial<DraftBackup>;
    if (
      typeof draft.markdown !== "string" ||
      typeof draft.date !== "string" ||
      typeof draft.timestamp !== "number" ||
      !Number.isFinite(draft.timestamp) ||
      draft.timestamp < 0 ||
      draft.timestamp > 8.64e15
    )
      return null;
    return draft as DraftBackup;
  } catch {
    return null;
  }
}

export function writeDraftBackup(key: string, draft: DraftBackup): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function removeDraftBackup(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Browser storage is optional; it must never turn a file save into an error.
  }
}
