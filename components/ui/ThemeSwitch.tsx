"use client";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { SketchIcon } from "./SketchIcon";

// Hydration-safe mounted flag: false during SSR/hydration, true after.
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

const ThemeSwitcher = () => {
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () =>
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  const icon = resolvedTheme === "light" ? "dark.svg" : "light.svg";

  if (!mounted)
    return <div className="w-6 h-6 md:w-12 md:h-12" aria-hidden="true" />;

  return (
    <button
      onClick={toggleTheme}
      className="w-fit h-fit p-0 m-0 bg-transparent border-none cursor-pointer"
    >
      <SketchIcon
        src={`/icons/${icon}`}
        label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
        className="w-6 h-6 md:w-12 md:h-12 transition-opacity duration-200 opacity-80 hover:opacity-100"
      />
    </button>
  );
};

export default ThemeSwitcher;
