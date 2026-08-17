import { ArrowRight, Check, Palette, Share2, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ProfileMockup } from "@/components/marketing/profile-mockup";
import { APP_ROUTES } from "@/lib/config";

const benefits = ["Gratis para comenzar", "Personalizable", "Publica en minutos"];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pb-28 sm:pt-40 lg:min-h-[860px] lg:pb-32 lg:pt-44">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-[-22rem] h-[50rem] w-[75rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18),transparent_64%)]" />
        <div className="hero-grid absolute inset-x-0 top-0 h-[760px] opacity-40" />
        <div className="absolute left-[8%] top-[30%] size-72 rounded-full bg-blue-600/[0.08] blur-[100px]" />
        <div className="absolute right-[5%] top-[18%] size-80 rounded-full bg-violet-500/[0.12] blur-[110px]" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="relative z-10 text-center lg:text-left">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-3.5 py-2 text-xs font-semibold text-[var(--accent-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Tu espacio digital, con tu propio estilo
            </div>
            <h1 className="mx-auto max-w-3xl text-balance text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.06em] text-[var(--foreground)] sm:text-6xl lg:mx-0 lg:text-[4.6rem]">
              Todo lo que eres, en un solo{" "}
              <span className="gradient-text">link.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-[610px] text-pretty text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8 lg:mx-0">
              Reúne tus redes, contenido, contacto y proyectos en una página que se siente realmente tuya. Diseña, publica y comparte en minutos.
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Button href={APP_ROUTES.createPageEntry} size="lg">
                Crear mi página gratis
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button href="#disenos" variant="secondary" size="lg">
                Ver diseños
              </Button>
            </div>
            <p className="mt-4 text-xs text-[var(--muted-soft)]">No necesitas conocimientos de programación.</p>

            <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-3 lg:justify-start" aria-label="Beneficios principales">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)] sm:text-sm">
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-400/10 text-[var(--success-text)]">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[570px] lg:ml-auto lg:mr-0">
            <div className="absolute inset-8 rounded-[4rem] bg-violet-600/20 blur-[80px]" aria-hidden="true" />
            <div className="hero-preview-halo absolute inset-x-[8%] inset-y-[3%] rounded-[3rem] border" aria-hidden="true" />
            <div className="relative mx-auto w-[77%] max-w-[340px] rotate-[1.5deg] transition-transform duration-500 hover:rotate-0 sm:w-[64%] lg:w-[60%] lg:-translate-x-6">
              <ProfileMockup theme="neon" className="hero-profile" />
            </div>

            <FloatingCard
              className="-left-1 top-[14%] hidden sm:flex"
              icon={Palette}
              label="Personaliza colores"
              accent="violet"
            />
            <FloatingCard
              className="-right-1 top-[27%] flex"
              icon={TrendingUp}
              label="+2.4K visitas"
              accent="cyan"
            />
            <FloatingCard
              className="-left-3 bottom-[21%] flex"
              icon={Sparkles}
              label="Agrega tus redes"
              accent="blue"
            />
            <FloatingCard
              className="right-0 bottom-[8%] hidden sm:flex"
              icon={Share2}
              label="Comparte tu link"
              accent="violet"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

type FloatingCardProps = {
  icon: typeof Palette;
  label: string;
  className: string;
  accent: "violet" | "cyan" | "blue";
};

function FloatingCard({ icon: Icon, label, className, accent }: FloatingCardProps) {
  const accentClasses = {
    violet: "bg-violet-400/15 text-violet-500",
    cyan: "bg-cyan-400/15 text-cyan-500",
    blue: "bg-blue-400/15 text-blue-500",
  };

  return (
    <div
      className={`absolute z-20 items-center gap-2.5 rounded-2xl border border-[var(--hero-float-border)] bg-[var(--hero-float-bg)] px-3.5 py-3 text-xs font-semibold text-[var(--hero-float-text)] shadow-[var(--hero-float-shadow)] backdrop-blur-xl ${className}`}
    >
      <span className={`grid size-7 place-items-center rounded-lg ${accentClasses[accent]}`}>
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      {label}
    </div>
  );
}
