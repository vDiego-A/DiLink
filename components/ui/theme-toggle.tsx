"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/lib/config";

export function ThemeToggle() {
  const toggleTheme = () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // El cambio visual sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] text-[var(--foreground)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--subtle-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      aria-label="Cambiar entre tema claro y oscuro"
      title="Cambiar tema"
    >
      <Moon className="theme-icon-light size-[17px]" aria-hidden="true" />
      <Sun className="theme-icon-dark size-[17px]" aria-hidden="true" />
    </button>
  );
}
