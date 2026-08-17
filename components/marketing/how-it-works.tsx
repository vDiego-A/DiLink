import { Palette, Rocket, UserRoundPlus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";

const steps = [
  {
    number: "01",
    title: "Crea tu perfil",
    description: "Regístrate, elige tu nombre de usuario y crea tu identidad.",
    icon: UserRoundPlus,
    color: "bg-violet-400/10 text-violet-500",
  },
  {
    number: "02",
    title: "Personaliza",
    description: "Selecciona colores, tipografías, fondos, estilos y enlaces.",
    icon: Palette,
    color: "bg-blue-400/10 text-blue-500",
  },
  {
    number: "03",
    title: "Comparte",
    description: "Publica tu página y comparte tu único link donde quieras.",
    icon: Rocket,
    color: "bg-cyan-400/10 text-cyan-500",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 py-24 sm:py-32">
      <Container>
        <SectionHeader
          eyebrow="Así de simple"
          title="Tu página lista en minutos"
          description="De una idea a una presencia digital lista para compartir. Sin código, sin fricción y con control sobre cada detalle."
        />

        <div className="relative mt-14 grid gap-4 lg:grid-cols-3">
          {steps.map(({ number, title, description, icon: Icon, color }) => (
            <article
              key={number}
              className="group relative rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)] sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`grid size-12 place-items-center rounded-2xl border border-[var(--border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${color}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <span className="font-mono text-sm font-semibold text-[var(--muted-soft)]">{number}</span>
              </div>
              <h3 className="mt-8 text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)] transition-colors group-hover:text-[var(--accent-text)]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
