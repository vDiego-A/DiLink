import {
  Camera,
  ChevronDown,
  Eye,
  GripVertical,
  Image as ImageIcon,
  MessageCircle,
  Palette,
  Play,
  Plus,
  Settings2,
  Type,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ProfileMockup } from "@/components/marketing/profile-mockup";

const editorLinks = [
  { label: "Instagram", icon: Camera, color: "text-pink-300" },
  { label: "WhatsApp", icon: MessageCircle, color: "text-emerald-300" },
  { label: "YouTube", icon: Play, color: "text-red-300" },
] as const;

export function EditorShowcase() {
  return (
    <section className="relative py-24 sm:py-32">
      <Container>
        <SectionHeader
          eyebrow="Tu espacio creativo"
          title="Edita a tu ritmo. Mira el resultado al instante."
          description="Un editor claro a la izquierda y tu página viva a la derecha. Cada decisión se refleja en tiempo real."
        />

        <div className="editor-shell relative mt-14 overflow-hidden rounded-[2rem] border border-white/[0.1] bg-[#090913] shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
          <div className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-white/[0.025] px-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#ff6b68]" />
              <span className="size-2.5 rounded-full bg-[#f8c34b]" />
              <span className="size-2.5 rounded-full bg-[#50c878]" />
            </div>
            <div className="hidden rounded-lg border border-white/[0.08] bg-black/25 px-4 py-1.5 text-[10px] text-zinc-500 sm:block">
              midominio.com/diegotech
            </div>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
              Guardado ✓
            </span>
          </div>

          <div className="grid min-h-[650px] lg:grid-cols-[1.08fr_0.92fr]">
            <div className="border-b border-white/[0.08] p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
              <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
                <button type="button" className="flex-1 rounded-lg bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white">
                  Contenido
                </button>
                <button type="button" className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500">
                  Diseño
                </button>
                <button type="button" className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500">
                  Configuración
                </button>
              </div>

              <EditorGroup icon={ImageIcon} title="Perfil" subtitle="Tu identidad">
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
                  <div className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-bold text-white">
                    DT
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-2 w-24 rounded-full bg-white/70" />
                    <div className="mt-2 h-1.5 w-36 rounded-full bg-white/15" />
                  </div>
                  <button type="button" className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-zinc-300">
                    Editar
                  </button>
                </div>
              </EditorGroup>

              <EditorGroup icon={Settings2} title="Enlaces" subtitle="3 activos">
                <div className="space-y-2">
                  {editorLinks.map(({ label, icon: Icon, color }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
                      <GripVertical className="size-3.5 text-zinc-600" aria-hidden="true" />
                      <span className="grid size-8 place-items-center rounded-lg bg-white/[0.05]">
                        <Icon className={`size-3.5 ${color}`} aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-xs font-medium text-zinc-200">{label}</span>
                      <span className="h-4 w-7 rounded-full bg-violet-500 p-0.5">
                        <span className="block size-3 translate-x-3 rounded-full bg-white" />
                      </span>
                    </div>
                  ))}
                  <button type="button" className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300/25 bg-violet-400/[0.05] text-xs font-semibold text-violet-200">
                    <Plus className="size-3.5" aria-hidden="true" />
                    Agregar enlace
                  </button>
                </div>
              </EditorGroup>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Temas", icon: Palette },
                  { label: "Colores", icon: Eye },
                  { label: "Tipografía", icon: Type },
                  { label: "Fondo", icon: ImageIcon },
                ].map(({ label, icon: Icon }) => (
                  <button key={label} type="button" className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-[10px] font-medium text-zinc-400">
                    <span className="flex items-center gap-2">
                      <Icon className="size-3.5 text-violet-300" aria-hidden="true" />
                      {label}
                    </span>
                    <ChevronDown className="size-3 text-zinc-600" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,rgba(124,58,237,0.15),transparent_44%),#07070e] p-8 sm:p-12">
              <div className="hero-grid absolute inset-0 opacity-25" />
              <div className="relative w-full max-w-[285px]">
                <div className="mb-4 flex justify-center gap-1 rounded-full border border-white/[0.08] bg-black/30 p-1 text-[10px] text-zinc-500">
                  <span className="rounded-full bg-white/[0.08] px-4 py-1.5 font-semibold text-white">Móvil</span>
                  <span className="px-4 py-1.5">Desktop</span>
                </div>
                <ProfileMockup theme="neon" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function EditorGroup({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof ImageIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-3.5 text-zinc-500" aria-hidden="true" />
        <h3 className="text-xs font-bold text-zinc-200">{title}</h3>
        <span className="ml-auto text-[10px] text-zinc-600">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}
