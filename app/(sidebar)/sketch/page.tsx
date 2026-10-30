"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SKETCHES } from "@/config/sketches";

export default function SketchPage() {
  const [selected, setSelected] = useState<(typeof SKETCHES)[number] | null>(
    null
  );

  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => {
    dialogRef.current?.close();
    setSelected(null);
  };

  useEffect(() => {
    if (!selected) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const padding = parseFloat(getComputedStyle(document.body).paddingRight);
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${padding + gutter}px`;
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [selected]);

  return (
    <div>
      <h1 className="font-bold text-left mb-10 text-2xl">Sketches</h1>
      <p className="mb-5">Drawn with reMarkable 2</p>

      <div className="columns-1 md:columns-2 space-y-1 rounded-md">
        {SKETCHES.map((sketch) => (
          <button
            key={sketch.src}
            className="break-inside-avoid mb-0 cursor-crosshair w-full text-left"
            onClick={() => setSelected(sketch)}
          >
            <Image
              src={sketch.src}
              alt={sketch.label}
              width={1000}
              height={200}
            />
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={selected?.label ?? "Sketch viewer"}
        className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 p-0 bg-black/75 hidden open:flex justify-center items-center z-50 backdrop:bg-transparent"
        onClick={close}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        {selected && (
          <>
            <div className="relative w-full h-full max-w-4xl max-h-[90vh] m-4">
              <Image
                src={selected.src}
                alt={selected.label}
                fill
                className="object-contain"
              />
            </div>
            <button
              type="button"
              autoFocus
              aria-label="Close sketch"
              onClick={close}
              className="absolute top-5 right-5 px-2 py-1 text-xs text-chalk-soft hover:text-chalk-strong focus-visible:outline-2 focus-visible:outline-chalk focus-visible:outline-offset-2"
            >
              esc
            </button>
          </>
        )}
      </dialog>
    </div>
  );
}
