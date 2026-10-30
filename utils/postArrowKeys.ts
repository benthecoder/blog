export interface ArrowKeyState {
  key: string;
  defaultPrevented: boolean;
  repeat: boolean;
  modified: boolean;
  blocked: boolean; // typing in a field, overlay open, or horizontal scroller
}

// Left steps to the older post, right to the newer one.
export function arrowDirection(s: ArrowKeyState): "prev" | "next" | null {
  if (s.defaultPrevented || s.repeat || s.modified || s.blocked) return null;
  if (s.key === "ArrowLeft") return "prev";
  if (s.key === "ArrowRight") return "next";
  return null;
}
