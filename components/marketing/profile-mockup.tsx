import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Camera,
  ExternalLink,
  Globe2,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  Share2,
} from "lucide-react";
import type { ThemeId } from "@/lib/themes";
import { APP_NAME } from "@/lib/config";

type ProfileMockupProps = {
  theme?: ThemeId;
  compact?: boolean;
  className?: string;
  showBranding?: boolean;
};

type ProfileData = {
  initials: string;
  name: string;
  handle: string;
  bio: string;
  links: { label: string; icon: LucideIcon }[];
};

const profileData: Record<ThemeId, ProfileData> = {
  neon: {
    initials: "DT",
    name: "Diego Tech",
    handle: "@diegotech",
    bio: "Tecnología simple, ideas grandes.",
    links: [
      { label: "Mi web", icon: Globe2 },
      { label: "Instagram", icon: Camera },
      { label: "WhatsApp", icon: MessageCircle },
      { label: "YouTube", icon: Play },
      { label: "Spotify", icon: Music2 },
    ],
  },
  minimal: {
    initials: "AS",
    name: "Ana Studio",
    handle: "@anastudio",
    bio: "Dirección de arte & fotografía.",
    links: [
      { label: "Portfolio 2026", icon: ExternalLink },
      { label: "Instagram", icon: Camera },
      { label: "Hablemos", icon: MessageCircle },
    ],
  },
  aurora: {
    initials: "LV",
    name: "Luna Vera",
    handle: "@lunavera",
    bio: "Música, procesos y cosas que me inspiran.",
    links: [
      { label: "Nuevo single", icon: Music2 },
      { label: "YouTube", icon: Play },
      { label: "Instagram", icon: Camera },
    ],
  },
  sunset: {
    initials: "MV",
    name: "Mesa Viva",
    handle: "@mesaviva",
    bio: "Sabores honestos. Cocina local.",
    links: [
      { label: "Ver menú", icon: ExternalLink },
      { label: "Reservar", icon: MessageCircle },
      { label: "Instagram", icon: Camera },
    ],
  },
  professional: {
    initials: "CM",
    name: "Carlos Méndez",
    handle: "@carlosmendez",
    bio: "Producto digital, estrategia y crecimiento.",
    links: [
      { label: "Mi experiencia", icon: BriefcaseBusiness },
      { label: "Agenda una llamada", icon: MessageCircle },
      { label: "Casos de estudio", icon: Globe2 },
    ],
  },
  clean: {
    initials: "NR",
    name: "Nora Ríos",
    handle: "@norarios",
    bio: "Diseño espacios serenos y funcionales.",
    links: [
      { label: "Proyectos", icon: ExternalLink },
      { label: "Instagram", icon: Camera },
      { label: "Contacto", icon: MessageCircle },
    ],
  },
};

const themeStyles: Record<
  ThemeId,
  { shell: string; text: string; muted: string; avatar: string; link: string; icon: string }
> = {
  neon: {
    shell:
      "border-violet-300/15 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.38),transparent_38%),radial-gradient(circle_at_90%_35%,rgba(37,99,235,0.24),transparent_34%),#090713] shadow-[0_30px_90px_rgba(35,17,92,0.46)]",
    text: "text-white",
    muted: "text-violet-100/80",
    avatar: "from-violet-500 via-fuchsia-500 to-blue-500 ring-violet-300/30",
    link:
      "border-violet-200/25 bg-white/[0.13] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
    icon: "text-violet-200",
  },
  minimal: {
    shell: "border-white/15 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.55)]",
    text: "text-white",
    muted: "text-zinc-500",
    avatar: "from-zinc-200 to-white text-black ring-white/30",
    link: "border-white/20 bg-white text-black",
    icon: "text-black",
  },
  aurora: {
    shell:
      "border-cyan-200/20 bg-[radial-gradient(circle_at_75%_8%,rgba(34,211,238,0.30),transparent_37%),radial-gradient(circle_at_10%_65%,rgba(168,85,247,0.35),transparent_42%),#0b1024] shadow-[0_30px_90px_rgba(15,90,120,0.32)]",
    text: "text-white",
    muted: "text-cyan-100/65",
    avatar: "from-cyan-300 via-blue-400 to-violet-500 ring-cyan-200/35",
    link: "border-cyan-100/20 bg-[#d8fbff]/90 text-[#07151d]",
    icon: "text-[#07151d]",
  },
  sunset: {
    shell:
      "border-orange-200/20 bg-[radial-gradient(circle_at_20%_10%,rgba(251,146,60,0.38),transparent_38%),radial-gradient(circle_at_90%_80%,rgba(236,72,153,0.34),transparent_42%),#24101f] shadow-[0_30px_90px_rgba(100,30,40,0.34)]",
    text: "text-white",
    muted: "text-orange-50/65",
    avatar: "from-orange-400 to-pink-500 ring-orange-200/35",
    link: "border-orange-100/20 bg-[#fff2df]/95 text-[#30131c]",
    icon: "text-pink-700",
  },
  professional: {
    shell:
      "border-blue-200/15 bg-[linear-gradient(160deg,#0f243d_0%,#07101e_68%)] shadow-[0_30px_90px_rgba(0,20,55,0.45)]",
    text: "text-white",
    muted: "text-blue-100/55",
    avatar: "from-blue-500 to-cyan-400 ring-blue-200/25",
    link: "border-blue-200/15 bg-blue-100/[0.08] text-white",
    icon: "text-cyan-300",
  },
  clean: {
    shell: "border-zinc-200 bg-[#f5f5f4] shadow-[0_30px_90px_rgba(0,0,0,0.18)]",
    text: "text-zinc-950",
    muted: "text-zinc-500",
    avatar: "from-zinc-700 to-zinc-950 ring-zinc-300 text-white",
    link: "border-zinc-300 bg-white text-zinc-900 shadow-sm",
    icon: "text-zinc-700",
  },
};

export function ProfileMockup({
  theme = "neon",
  compact = false,
  className = "",
  showBranding = true,
}: ProfileMockupProps) {
  const data = profileData[theme];
  const styles = themeStyles[theme];
  const visibleLinks = compact ? data.links.slice(0, 3) : data.links;

  return (
    <article
      data-profile-theme={theme}
      className={`relative w-full overflow-hidden border ${styles.shell} ${
        compact ? "rounded-[1.5rem] p-4" : "rounded-[2.25rem] p-5 sm:p-6"
      } ${className}`}
      aria-label={`Vista previa del perfil de ${data.name}`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className={`profile-muted text-[10px] font-semibold ${styles.muted}`}>{data.handle}</span>
          <div className="flex gap-1.5">
            <span className={`profile-control profile-muted grid size-7 place-items-center rounded-full border border-current/10 ${styles.muted}`}>
              <Share2 className="size-3" aria-hidden="true" />
            </span>
            {!compact && (
              <span className={`profile-control profile-muted grid size-7 place-items-center rounded-full border border-current/10 ${styles.muted}`}>
                <MoreHorizontal className="size-3.5" aria-hidden="true" />
              </span>
            )}
          </div>
        </div>

        <div className={`text-center ${compact ? "mt-3" : "mt-4"}`}>
          <div
            className={`profile-avatar mx-auto grid place-items-center rounded-full bg-gradient-to-br font-bold ring-4 ${styles.avatar} ${
              compact ? "size-12 text-xs" : "size-[72px] text-base"
            }`}
          >
            {data.initials}
          </div>
          <h3 className={`profile-title ${styles.text} ${compact ? "mt-3 text-sm" : "mt-4 text-lg"} font-bold tracking-tight`}>
            {data.name}
          </h3>
          <p className={`profile-muted ${styles.muted} ${compact ? "mt-1 text-[9px]" : "mt-1.5 text-xs"}`}>
            {data.bio}
          </p>
        </div>

        <div className={`${compact ? "mt-4 space-y-2" : "mt-6 space-y-2.5"}`}>
          {visibleLinks.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className={`profile-link flex items-center rounded-xl border font-semibold ${styles.link} ${
                compact ? "h-9 px-3 text-[10px]" : "h-11 px-3.5 text-xs"
              }`}
            >
              <Icon className={`profile-link-icon ${styles.icon} ${compact ? "size-3" : "size-3.5"}`} aria-hidden="true" />
              <span className="flex-1 text-center">{label}</span>
              <ExternalLink className="size-3 opacity-35" aria-hidden="true" />
            </div>
          ))}
        </div>

        {showBranding && !compact && (
          <p className={`profile-muted mt-5 text-center text-[9px] font-medium ${styles.muted}`}>
            Creado con {APP_NAME}
          </p>
        )}
      </div>
    </article>
  );
}
