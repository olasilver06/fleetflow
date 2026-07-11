"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "fleetflow-theme";

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // Must run post-hydration, not as a lazy useState initializer: the
    // beforeInteractive script in layout.tsx sets the "light" class on
    // <html> before hydration but after the server render, so reading it
    // during the initial render (server or lazy-init) would mismatch what
    // actually ends up in the DOM.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    } catch {
      // Best-effort persistence — theme still applies for this session
      // even if localStorage is unavailable (e.g. private browsing).
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="text-text-secondary hover:text-text-primary transition-colors"
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
