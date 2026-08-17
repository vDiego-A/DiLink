import {
  BarChart3,
  Eye,
  Infinity as InfinityIcon,
  LayoutTemplate,
  Palette,
  QrCode,
  Share2,
  Smartphone,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";

const features = [
  {
    title: "Enlaces que crecen contigo",
    description: "Organiza tus redes, contenido y sitios favoritos en el orden que quieras.",
    icon: InfinityIcon,
    size: "large",
    pro: false,
  },
  {
    title: "Temas con intención",
    description: "Empieza con una base profesional y hazla tuya.",
    icon: LayoutTemplate,
    size: "small",
    pro: false,
  },
  {
    title: "Personalización real",
    description: "Ajusta colores, fondos, bordes y tipografías sin tocar código.",
    icon: Palette,
    size: "small",
    pro: false,
  },
  {
    title: "Tus redes, conectadas",
    description: "Instagram, TikTok, YouTube, WhatsApp, X y mucho más.",
    icon: Share2,
    size: "small",
    pro: false,
  },
  {
    title: "Preview en tiempo real",
    description: "Cada cambio aparece al instante. Diseña con confianza antes de publicar.",
    icon: Eye,
    size: "large",
    pro: false,
  },
  {
    title: "QR listo para compartir",
    description: "Lleva tu perfil del mundo físico al digital.",
    icon: QrCode,
    size: "small",
    pro: true,
  },
  {
    title: "Datos que sí sirven",
    description: "Entiende tus visitas y descubre cuáles enlaces conectan mejor.",
    icon: BarChart3,
    size: "small",
    pro: true,
  },
  {
    title: "Perfecta en cada pantalla",
    description: "Tu página se adapta a móvil, tablet y desktop automáticamente.",
    icon: Smartphone,
    size: "small",
    pro: false,
  },
] as const;

export function Features() {
  return (
    <section id="funciones" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="pointer-events-none absolute left-0 top-1/3 size-80 rounded-full bg-violet-600/[0.06] blur-[110px]" />
      <Container className="relative">
        <SectionHeader
          eyebrow="Todo en un solo lugar"
          title="Mucho más que una lista de enlaces"
          description="Las herramientas esenciales para construir una presencia digital que se vea bien y trabaje para ti."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, description, icon: Icon, size, pro }, index) => (
            <article
              key={title}
              className={`feature-card group relative min-h-56 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/25 ${
                size === "large" ? "lg:col-span-2" : ""
              }`}
            >
              <div
                className={`absolute -right-10 -top-14 size-40 rounded-full blur-3xl ${
                  index % 3 === 1 ? "bg-blue-500/10" : index % 3 === 2 ? "bg-cyan-400/[0.08]" : "bg-violet-500/10"
                }`}
              />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl border border-[var(--border)] bg-violet-500/[0.08] text-violet-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                    <Icon className="size-[19px]" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  {pro && (
                    <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[9px] font-bold tracking-[0.16em] text-[var(--accent-text)]">
                      PRO
                    </span>
                  )}
                </div>
                <div className="mt-auto pt-10">
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent-text)]">{title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
