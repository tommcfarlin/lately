"use client";

import { useEffect, useRef } from "react";

function getInitialDark(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("theme");
  if (stored) return stored === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function ThemeToggle() {
  const darkRef = useRef<boolean>(false);

  useEffect(() => {
    const isDark = getInitialDark();
    darkRef.current = isDark;
    document.documentElement.classList.toggle("dark", isDark);
    // Force a re-render so the button label reflects actual state
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) btn.textContent = isDark ? "Light" : "Dark";
  }, []);

  function toggle() {
    const next = !darkRef.current;
    darkRef.current = next;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) btn.textContent = next ? "Light" : "Dark";
  }

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggle}
      aria-label="Toggle color scheme"
      className="rounded p-1 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      Dark
    </button>
  );
}
