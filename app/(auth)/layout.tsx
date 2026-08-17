import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { APP_NAME, APP_ROUTES } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `Acceso | ${APP_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <header className="absolute inset-x-0 top-0 z-30 border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-end px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={APP_ROUTES.home}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--subtle)] px-3.5 text-sm font-semibold text-[var(--muted)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--subtle-hover)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:px-4"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Volver al inicio</span>
              <span className="sm:hidden">Volver</span>
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
