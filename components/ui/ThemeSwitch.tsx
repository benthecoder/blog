"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const icon = theme === "light" ? "dark.svg" : "light.svg";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="w-fit h-fit p-0 m-0 bg-transparent border-none cursor-pointer"
    >
      <Image
        src={`/icons/${icon}`}
        alt={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        width={10}
        height={10}
        className="inline-block w-6 h-6 md:w-12 md:h-12 dark:invert"
      />
    </button>
  );
};

export default ThemeSwitcher;
