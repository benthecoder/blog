"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

async function goRandom(router: ReturnType<typeof useRouter>) {
  window.dispatchEvent(new CustomEvent("random-spin"));
  const res = await fetch("/api/random", { cache: "no-store" });
  const data = await res.json();
  router.push(`/posts/${data.slug}`);
}

export function useRandomPost() {
  const router = useRouter();
  const navigating = useRef(false);

  useEffect(() => {
    function trigger() {
      if (navigating.current) return false;
      navigating.current = true;
      goRandom(router).finally(() => {
        navigating.current = false;
      });
      return true;
    }

    // 'R' key on desktop
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "r" || e.metaKey || e.ctrlKey || e.altKey)
        return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      trigger();
    }

    // shake on mobile
    const SHAKE_THRESHOLD = 18; // m/s² delta sum
    const SHAKE_COOLDOWN = 1500; // ms between shakes
    let lastX = 0,
      lastY = 0,
      lastZ = 0;
    let lastMotionTime = 0;
    let lastShakeTime = 0;

    function onMotion(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const now = Date.now();
      if (now - lastMotionTime < 100) return; // throttle to 10 fps
      lastMotionTime = now;

      const dx = Math.abs((acc.x ?? 0) - lastX);
      const dy = Math.abs((acc.y ?? 0) - lastY);
      const dz = Math.abs((acc.z ?? 0) - lastZ);
      lastX = acc.x ?? 0;
      lastY = acc.y ?? 0;
      lastZ = acc.z ?? 0;

      if (dx + dy + dz > SHAKE_THRESHOLD) {
        if (now - lastShakeTime < SHAKE_COOLDOWN) return;
        if (trigger()) lastShakeTime = now;
      }
    }

    function registerMotion() {
      window.addEventListener("devicemotion", onMotion);
    }

    // iOS 13+ requires explicit permission for DeviceMotionEvent
    function requestMotionPermission() {
      type DME = typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
      const DME = DeviceMotionEvent as DME;
      if (typeof DME.requestPermission === "function") {
        DME.requestPermission()
          .then((state) => {
            if (state === "granted") registerMotion();
          })
          .catch(() => {});
      } else {
        registerMotion();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    if (typeof DeviceMotionEvent !== "undefined") {
      // Request permission on first touch so the prompt is user-gesture gated
      window.addEventListener("touchstart", requestMotionPermission, {
        once: true,
      });
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("touchstart", requestMotionPermission);
    };
  }, [router]);
}
