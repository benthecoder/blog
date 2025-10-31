// ThemeSwitcher.jsx
"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Toggles the theme between 'light' and 'dark'
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // Emoji to display based on the theme
  const emoji = theme === "light" ? "🌑" : "☀️";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="w-fit h-fit p-0 m-0 bg-transparent border-none cursor-pointer"
    >
      {emoji}
    </button>
  );
};

export default ThemeSwitcher;
