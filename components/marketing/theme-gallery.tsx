import { ArrowRight, LockKeyhole } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ProfileMockup } from "@/components/marketing/profile-mockup";
import { THEMES } from "@/lib/themes";

export function ThemeGallery() {
  return (
    <section id="disenos" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="pointer-events-none absolute right-0 top-1/4 size-96 rounded-full bg-cyan-500/[0.05] blur-[120px]" />
      <Container className="relative">
        <SectionHeader
          eyebrow="Una base. Infinitas versiones."
          title="Encuentra tu estilo"
          description="Diseños pensados para distintos tipos de personas, proyectos y marcas. Elige uno y conviértelo en algo completamente tuyo."
        />

        <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {THEMES.map((theme) => (
            <article
              key={theme.id}
              className="group overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-[var(--card-shadow)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] sm:rounded-[1.75rem] sm:p-3"
            >
              <div className={`relative overflow-hidden rounded-[1.1rem] bg-gradient-to-br ${theme.background} px-[18%] pb-0 pt-5 sm:rounded-[1.35rem] sm:px-[22%] sm:pt-7`}>
                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.06),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {theme.isPro && (
                  <span className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[8px] font-bold tracking-[0.14em] text-white backdrop-blur-md sm:right-3 sm:top-3">
                    <LockKeyhole className="size-2.5" aria-hidden="true" /> PRO
                  </span>
                )}
                <ProfileMockup
                  theme={theme.id}
                  compact
                  showBranding={false}
                  className="relative translate-y-6 transition-transform duration-500 group-hover:translate-y-4"
                />
              </div>
              <div className="flex items-center justify-between px-2 pb-1 pt-4 sm:px-3 sm:pt-5">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--accent-text)] sm:text-base">{theme.name}</h3>
                  <p className="mt-1 text-[10px] text-[var(--muted)] sm:text-xs">{theme.description}</p>
                </div>
                <span className={`grid size-8 place-items-center rounded-full border border-white/10 bg-gradient-to-br ${theme.accent} text-white opacity-80 transition-transform group-hover:translate-x-0.5`}>
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
