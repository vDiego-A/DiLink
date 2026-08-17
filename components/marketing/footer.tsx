import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { APP_CONFIG, APP_NAME } from "@/lib/config";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

const footerGroups = [
  {
    title: "Producto",
    links: [
      { label: "Funciones", href: "#funciones" },
      { label: "Diseños", href: "#disenos" },
      { label: "Precios", href: "#precios" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { label: "Acerca de", href: "/about" },
      { label: "Contacto", href: "#contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "/privacy" },
      { label: "Términos", href: "/terms" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface-soft)] py-12 sm:py-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--muted)]">{APP_CONFIG.appDescription}</p>
            <p className="mt-5 text-xs text-[var(--muted-soft)]">Un link. Todo tu mundo.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold text-[var(--foreground)]">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((item) => (
                    <li key={item.label}>
                      <Link className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]" href={item.href}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground)]">Social</h3>
              <ul className="mt-4 space-y-3">
                {APP_CONFIG.socialLinks.map((item) => (
                  <li key={item.label}>
                    <Link className="inline-flex items-center gap-1 text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]" href={item.href}>
                      {item.label}
                      <ArrowUpRight className="size-3" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</p>
          <p>Diseñado para conectar lo que haces con quien quieres llegar.</p>
        </div>
      </Container>
    </footer>
  );
}
