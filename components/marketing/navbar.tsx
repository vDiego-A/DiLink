"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { APP_CONFIG, APP_ROUTES } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        isScrolled || isOpen
          ? "border-[var(--border)] bg-[var(--surface-glass)] shadow-[var(--nav-shadow)] backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <Container>
        <nav className="flex h-[72px] items-center justify-between" aria-label="Navegación principal">
          <Logo />

          <div className="hidden items-center gap-7 lg:flex">
            {APP_CONFIG.navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <Button href={APP_ROUTES.login} variant="ghost" size="sm">
                Iniciar sesión
              </Button>
              <Button href={APP_ROUTES.createPageEntry} size="sm">
                Crear mi página
              </Button>
            </div>

            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] text-[var(--foreground)] transition-colors hover:bg-[var(--subtle-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:hidden"
              onClick={() => setIsOpen((current) => !current)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        <div
          id="mobile-menu"
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 sm:hidden ${
            isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-2xl">
              {APP_CONFIG.navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--subtle-hover)] hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
                <Button href={APP_ROUTES.login} variant="secondary" size="sm">
                  Iniciar sesión
                </Button>
                <Button href={APP_ROUTES.createPageEntry} size="sm">
                  Crear página
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
