import { useEffect, useRef, useState } from "react";
import type { StreamPhoto } from "@/types/photostream";

const permalink = (photo: StreamPhoto) =>
  `/photo/${encodeURIComponent(photo.id)}`;

// Gives the lightbox a history entry so back closes it and the address bar
// shows the photo's permalink. Stepping replaces; only opening pushes.
export function useLightboxHistory(photos: StreamPhoto[]) {
  const [selected, setSelected] = useState<number | null>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const onPop = () => {
      const id = window.history.state?.lightbox;
      const index = photos.findIndex((photo) => photo.id === id);
      pushed.current = index !== -1;
      setSelected(index === -1 ? null : index);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [photos]);

  const onIndex = (next: number | null) => {
    if (next === null) {
      // back() fires popstate, which closes; clearing first guards a double call
      if (pushed.current) {
        pushed.current = false;
        window.history.back();
      } else setSelected(null);
      return;
    }
    const photo = photos[next];
    if (photo) {
      const state = { lightbox: photo.id };
      if (selected === null && !pushed.current) {
        window.history.pushState(state, "", permalink(photo));
        pushed.current = true;
      } else window.history.replaceState(state, "", permalink(photo));
    }
    setSelected(next);
  };

  return [selected, onIndex] as const;
}
