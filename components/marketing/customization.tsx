import { Check, Crown, Image as ImageIcon, Palette, Sparkles, Type } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";

const presets = [
  { name: "Purple Glow", colors: ["#7C3AED", "#2563EB", "#22D3EE"] },
  { name: "Ocean", colors: ["#1D4ED8", "#0891B2", "#67E8F9"] },
  { name: "Emerald", colors: ["#047857", "#10B981", "#A7F3D0"] },
  { name: "Sunset", colors: ["#EA580C", "#EC4899", "#F9A8D4"] },
  { name: "Midnight", colors: ["#18181B", "#312E81", "#6366F1"] },
  { name: "Monochrome", colors: ["#09090B", "#71717A", "#F4F4F5"] },
] as const;

const fonts = [
  { name: "Inter", access: "Free", style: "font-sans" },
  { name: "Poppins", access: "Free", style: "font-sans tracking-tight" },
  { name: "Roboto", access: "Free", style: "font-sans" },
  { name: "Space Grotesk", access: "Pro", style: "font-sans tracking-[-0.04em]" },
  { name: "Manrope", access: "Pro", style: "font-sans tracking-tight" },
  { name: "Outfit", access: "Pro", style: "font-sans tracking-wide" },
] as const;

export function Customization() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionHeader
          eyebrow="Hecha para expresarte"
          title="Cada detalle habla de ti"
          description="Combina color, tipografía, botones y fondos para crear una página coherente con tu identidad, no con la nuestra."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <article className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-violet-400/10 text-violet-500">
                  <Palette className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Tu paleta, tu energía</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Empieza con un preset equilibrado y ajusta el resultado a tu estilo.</p>
              </div>
              <ProTag />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {presets.map((preset, index) => (
                <div
                  key={preset.name}
                  className={`relative rounded-2xl border p-3 transition-colors ${
                    index === 0 ? "border-violet-400/30 bg-violet-400/[0.07]" : "border-[var(--border)] bg-[var(--surface-soft)]"
                  }`}
                >
                  {index === 0 && (
                    <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-violet-500 text-white">
                      <Check className="size-2.5" aria-hidden="true" />
                    </span>
                  )}
                  <div className="flex -space-x-1.5">
                    {preset.colors.map((color) => (
                      <span key={color} className="size-7 rounded-full border-2 border-[#0f0f1c]" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] font-medium text-[var(--foreground)]">{preset.name}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-blue-400/10 text-blue-500">
                  <Type className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Una voz que también se ve</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Tipografías claras y modernas para darle el tono correcto a tu mensaje.</p>
              </div>
              <ProTag />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {fonts.map((font, index) => (
                <div
                  key={font.name}
                  className={`rounded-2xl border p-3.5 ${
                    index === 0 ? "border-blue-400/25 bg-blue-400/[0.06]" : "border-[var(--border)] bg-[var(--surface-soft)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xl text-[var(--foreground)] ${font.style}`}>Aa</span>
                    {font.access === "Pro" && <Crown className="size-3 text-[var(--pro-text)]" aria-label="Pro" />}
                  </div>
                  <p className="mt-3 truncate text-[11px] font-medium text-[var(--muted)]">{font.name}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] sm:p-8 lg:col-span-2">
            <div className="grid items-center gap-8 lg:grid-cols-[0.65fr_1.35fr]">
              <div>
                <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-500">
                  <Sparkles className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Botones con personalidad</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Redondeados, pill, cuadrados, glass, outline o glow. Elige cómo invitas a hacer clic.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <ButtonSample label="Rounded" className="rounded-xl bg-white text-zinc-950" />
                <ButtonSample label="Pill" className="rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white" />
                <ButtonSample label="Outline" className="rounded-xl border border-cyan-300/50 text-cyan-100" />
                <ButtonSample label="Glass" className="rounded-xl border border-white/15 bg-white/[0.07] text-white backdrop-blur-xl" />
                <ButtonSample label="Square" className="rounded-none bg-zinc-100 text-zinc-950" />
                <ButtonSample label="Glow · Pro" className="rounded-xl bg-violet-500 text-white shadow-[0_0_25px_rgba(124,58,237,0.45)]" />
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(135deg,#0d0b1e,#0a1422)] p-6 sm:p-8 lg:col-span-2">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_65%_30%,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_35%_80%,rgba(124,58,237,0.25),transparent_48%)]" />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div>
                <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-white/[0.06] text-violet-200">
                  <ImageIcon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white">Fondos que crean atmósfera</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">Colores, gradientes e imágenes para todos. Videos, blur y efectos premium cuando quieras ir más lejos.</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <BackgroundSample className="bg-[#09090b]" label="Sólido" />
                <BackgroundSample className="bg-gradient-to-br from-violet-700 to-blue-600" label="Glow" />
                <BackgroundSample className="bg-[radial-gradient(circle_at_top,#22d3ee,#312e81_65%,#09090b)]" label="Aurora" />
                <BackgroundSample className="bg-gradient-to-br from-orange-500 via-pink-500 to-violet-700" label="Sunset" />
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}

function ProTag() {
  return (
    <span className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-300/[0.07] px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-[var(--pro-text)]">
      <Crown className="size-2.5" aria-hidden="true" /> PRO
    </span>
  );
}

function ButtonSample({ label, className }: { label: string; className: string }) {
  return <div className={`grid h-12 place-items-center text-[11px] font-semibold ${className}`}>{label}</div>;
}

function BackgroundSample({ className, label }: { className: string; label: string }) {
  return (
    <div className={`relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 ${className}`}>
      <span className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-black/45 px-1 py-1 text-center text-[8px] font-medium text-white backdrop-blur-sm">{label}</span>
    </div>
  );
}
