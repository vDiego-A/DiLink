import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { APP_ROUTES } from "@/lib/config";

export function FinalCta() {
  return (
    <section className="pb-24 pt-8 sm:pb-32">
      <Container>
        <div className="final-cta-card relative mx-auto max-w-[1080px] overflow-hidden rounded-[2.25rem] border px-6 py-16 text-center sm:px-12 sm:py-20 lg:py-24">
          <div className="final-cta-grid pointer-events-none absolute inset-0 opacity-80" aria-hidden="true" />
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-40 w-3/4 -translate-x-1/2 rounded-full bg-violet-400/10 blur-[70px]"
            aria-hidden="true"
          />

          <div className="relative mx-auto flex max-w-[720px] flex-col items-center">
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--cta-icon-border)] bg-[var(--cta-icon-bg)] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-text)]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Empieza hoy
            </span>

            <h2 className="max-w-[680px] text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.05em] text-[var(--cta-heading)] sm:text-5xl lg:text-[3.5rem]">
              Tu identidad digital empieza con un link.
            </h2>
            <p className="mt-6 max-w-[560px] text-pretty text-base leading-7 text-[var(--cta-copy)] sm:text-lg">
              Crea tu página, personalízala y compártela con el mundo.
            </p>

            <Button href={APP_ROUTES.createPageEntry} size="lg" className="mt-9">
              Crear mi página gratis
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>

            <p className="mt-5 inline-flex items-center justify-center gap-2 text-center text-xs text-[var(--cta-meta)]">
              <Check className="size-3.5 text-[var(--success-text)]" aria-hidden="true" />
              Sin tarjeta · Configuración en minutos
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
