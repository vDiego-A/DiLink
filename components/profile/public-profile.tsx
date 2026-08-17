import type { CSSProperties } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  AtSign,
  BriefcaseBusiness,
  Camera,
  Globe2,
  Link2,
  Mail,
  MessageCircle,
  Music2,
  Play,
  Users,
  Video,
} from "lucide-react";
import { AnalyticsPageView, TrackedPublicLink } from "@/components/analytics/public-analytics";
import { AvatarMedia } from "@/components/profile/avatar-media";
import { BackgroundVideo } from "@/components/profile/background-video";
import { APP_NAME } from "@/lib/config";
import type { ProfileLinkRow, ProfileRow } from "@/types/database";

type PublicProfileProps = {
  profile: ProfileRow;
  links: ProfileLinkRow[];
  preview?: boolean;
};

export function PublicProfile({ profile, links, preview = false }: PublicProfileProps) {
  const activeLinks = links.filter((link) => link.is_active);
  const themeAppearance = getThemeAppearance(profile.theme, profile.primary_color, profile.secondary_color);
  const appearance = applyCustomBackground(themeAppearance, profile.background_type, profile.background_value);
  const initials = getInitials(profile.display_name || profile.username);

  return (
    <article
      className={`relative isolate flex min-h-[650px] w-full flex-col overflow-hidden text-center ${preview ? "rounded-[2.25rem] border border-white/10" : "min-h-screen"}`}
      style={
        {
          background: appearance.background,
          color: appearance.text,
          fontFamily: `"${profile.font}", Inter, ui-sans-serif, system-ui, sans-serif`,
          "--profile-primary": profile.primary_color,
          "--profile-secondary": profile.secondary_color,
        } as CSSProperties
      }
    >
      {!preview && <AnalyticsPageView profileId={profile.id} />}
      <BackgroundMedia type={profile.background_type} value={profile.background_value} preview={preview} />
      <div className="pointer-events-none absolute -left-24 -top-24 z-[1] size-72 rounded-full bg-[var(--profile-primary)] opacity-20 blur-[90px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 z-[1] size-72 rounded-full bg-[var(--profile-secondary)] opacity-20 blur-[90px]" aria-hidden="true" />

      <div className={`relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-5 ${preview ? "pb-7 pt-12" : "pb-12 pt-16 sm:pt-20"}`}>
        <div
          className="relative mx-auto grid size-24 place-items-center overflow-hidden rounded-full border border-white/20 text-2xl font-bold shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
          style={{ background: `linear-gradient(135deg, ${profile.primary_color}, ${profile.secondary_color})` }}
          aria-label={`Avatar de ${profile.display_name || profile.username}`}
        >
          {profile.avatar_url ? (
            <AvatarMedia
              src={profile.avatar_url}
              alt={`Foto de perfil de ${profile.display_name || profile.username}`}
              sizes="96px"
              className="object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <h1 className={`${preview ? "mt-5 text-2xl" : "mt-6 text-3xl"} font-bold tracking-[-0.045em]`}>
          {profile.display_name || `@${profile.username}`}
        </h1>
        {profile.bio && (
          <p className={`mx-auto mt-3 max-w-sm leading-6 ${preview ? "text-sm" : "text-base"}`} style={{ color: appearance.muted }}>
            {profile.bio}
          </p>
        )}

        <div className="mt-8 grid gap-3">
          {activeLinks.length > 0 ? (
            activeLinks.map((link) => {
              const Icon = getLinkIcon(link.icon);
              const linkClasses = getButtonClasses(profile.button_style);

              return preview ? (
                <div key={link.id} className={linkClasses} style={getButtonStyle(profile.button_style, appearance, profile.primary_color, profile.secondary_color)}>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{link.title}</span>
                  <ArrowUpRight className="size-4 shrink-0 opacity-65" aria-hidden="true" />
                </div>
              ) : (
                <TrackedPublicLink
                  key={link.id}
                  profileId={profile.id}
                  linkId={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClasses} transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
                  style={getButtonStyle(profile.button_style, appearance, profile.primary_color, profile.secondary_color)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{link.title}</span>
                  <ArrowUpRight className="size-4 shrink-0 opacity-65" aria-hidden="true" />
                </TrackedPublicLink>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-current/20 px-5 py-7 text-sm" style={{ color: appearance.muted }}>
              Tus enlaces aparecerán aquí.
            </div>
          )}
        </div>

        {profile.show_branding && (
          <div className="mt-auto pt-10 text-xs font-semibold" style={{ color: appearance.muted }}>
            Creado con {APP_NAME}
          </div>
        )}
      </div>
    </article>
  );
}

function BackgroundMedia({ type, value, preview }: { type: string; value: string; preview: boolean }) {
  if ((type !== "image" && type !== "video") || !value) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {type === "image" ? (
        <Image
          src={value}
          alt=""
          fill
          sizes={preview ? "430px" : "100vw"}
          unoptimized={value.startsWith("blob:")}
          className="object-cover opacity-65"
        />
      ) : (
        <BackgroundVideo
          src={value}
          className="size-full object-cover opacity-60"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.28),rgba(3,7,18,0.52))]" />
    </div>
  );
}

function getThemeAppearance(theme: string, primary: string, secondary: string) {
  if (theme === "minimal") {
    return {
      background: "linear-gradient(160deg, #ffffff 0%, #f4f4f5 100%)",
      text: "#18181b",
      muted: "#52525b",
      buttonBackground: "#18181b",
      buttonText: "#ffffff",
      buttonBorder: "rgba(24,24,27,0.16)",
    };
  }

  if (theme === "aurora") {
    return {
      background: `radial-gradient(circle at 15% 10%, ${primary}55, transparent 38%), radial-gradient(circle at 90% 80%, ${secondary}44, transparent 42%), #07111f`,
      text: "#ffffff",
      muted: "#cbd5e1",
      buttonBackground: "rgba(255,255,255,0.11)",
      buttonText: "#ffffff",
      buttonBorder: "rgba(255,255,255,0.17)",
    };
  }

  if (theme === "sunset") {
    return {
      background: `radial-gradient(circle at 15% 10%, ${primary}88, transparent 42%), radial-gradient(circle at 90% 80%, ${secondary}77, transparent 45%), #2b1237`,
      text: "#ffffff",
      muted: "#fce7f3",
      buttonBackground: "rgba(255,255,255,0.13)",
      buttonText: "#ffffff",
      buttonBorder: "rgba(255,255,255,0.20)",
    };
  }

  if (theme === "professional") {
    return {
      background: `radial-gradient(circle at 85% 0%, ${secondary}55, transparent 42%), linear-gradient(155deg, #0F172A, #071427)`,
      text: "#f8fafc",
      muted: "#cbd5e1",
      buttonBackground: "rgba(15,23,42,0.72)",
      buttonText: "#f8fafc",
      buttonBorder: "rgba(148,163,184,0.24)",
    };
  }

  if (theme === "clean") {
    return {
      background: `radial-gradient(circle at 15% 0%, ${primary}20, transparent 36%), linear-gradient(160deg, #ffffff, #f1f5f9)`,
      text: "#0f172a",
      muted: "#475569",
      buttonBackground: "rgba(255,255,255,0.82)",
      buttonText: "#0f172a",
      buttonBorder: "rgba(15,23,42,0.13)",
    };
  }

  return {
    background: `radial-gradient(circle at 20% 0%, ${primary}66, transparent 40%), radial-gradient(circle at 90% 65%, ${secondary}55, transparent 42%), linear-gradient(150deg, #160b2d, #071426)`,
    text: "#ffffff",
    muted: "#d4d4d8",
    buttonBackground: "rgba(255,255,255,0.10)",
    buttonText: "#ffffff",
    buttonBorder: "rgba(255,255,255,0.16)",
  };
}

function applyCustomBackground(
  appearance: ReturnType<typeof getThemeAppearance>,
  backgroundType: string,
  backgroundValue: string,
) {
  if (backgroundType === "solid" && isHexColor(backgroundValue)) {
    return withBackgroundContrast(appearance, backgroundValue, [backgroundValue]);
  }

  if (backgroundType === "gradient" && /^#[0-9a-f]{6},#[0-9a-f]{6}$/i.test(backgroundValue)) {
    const colors = backgroundValue.split(",");
    const background = `linear-gradient(145deg, ${colors[0]}, ${colors[1]})`;
    return withBackgroundContrast(appearance, background, colors);
  }

  if (backgroundType === "image" || backgroundType === "video") {
    return {
      ...appearance,
      background: "#07111f",
      text: "#ffffff",
      muted: "#e2e8f0",
      buttonBackground: "rgba(15,23,42,0.48)",
      buttonText: "#ffffff",
      buttonBorder: "rgba(255,255,255,0.24)",
    };
  }

  return appearance;
}

function withBackgroundContrast(
  appearance: ReturnType<typeof getThemeAppearance>,
  background: string,
  colors: string[],
) {
  const lightBackground = colors.every((color) => isLightColor(color));

  return {
    ...appearance,
    background,
    text: lightBackground ? "#18181b" : "#ffffff",
    muted: lightBackground ? "#52525b" : "#d4d4d8",
    buttonBackground: lightBackground ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.11)",
    buttonText: lightBackground ? "#18181b" : "#ffffff",
    buttonBorder: lightBackground ? "rgba(24,24,27,0.16)" : "rgba(255,255,255,0.18)",
  };
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function isLightColor(value: string) {
  if (!isHexColor(value)) return false;
  const red = Number.parseInt(value.slice(1, 3), 16);
  const green = Number.parseInt(value.slice(3, 5), 16);
  const blue = Number.parseInt(value.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 155;
}

function getButtonClasses(buttonStyle: string) {
  const shape = buttonStyle === "pill" ? "rounded-full" : buttonStyle === "square" ? "rounded-md" : "rounded-2xl";
  const variant = buttonStyle === "outline" || buttonStyle === "neon-outline" ? "bg-transparent" : buttonStyle === "glass" || buttonStyle === "liquid-glass" ? "backdrop-blur-xl" : "backdrop-blur-md";

  return `${shape} ${variant} flex min-h-14 items-center gap-3 border px-4 text-left text-sm font-semibold ${buttonStyle === "soft-3d" ? "translate-y-[-2px]" : ""}`;
}

function getButtonStyle(
  buttonStyle: string,
  appearance: ReturnType<typeof getThemeAppearance>,
  primary: string,
  secondary: string,
): CSSProperties {
  if (buttonStyle === "liquid-glass") {
    return {
      background: "linear-gradient(135deg,rgba(255,255,255,0.26),rgba(255,255,255,0.07))",
      borderColor: "rgba(255,255,255,0.42)",
      color: appearance.buttonText,
      backdropFilter: "blur(18px) saturate(150%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55),0 16px 38px rgba(2,6,23,0.22)",
    };
  }

  if (buttonStyle === "neon-outline") {
    return {
      background: "transparent",
      borderColor: primary,
      color: "#ffffff",
      boxShadow: `0 0 8px ${primary},inset 0 0 14px ${primary}33`,
    };
  }

  if (buttonStyle === "soft-3d") {
    return {
      background: appearance.buttonBackground,
      borderColor: appearance.buttonBorder,
      color: appearance.buttonText,
      boxShadow: `0 7px 0 ${secondary}99,0 14px 28px rgba(2,6,23,0.24)`,
    };
  }

  if (buttonStyle === "gradient") {
    return {
      background: `linear-gradient(135deg,${primary},${secondary})`,
      borderColor: "rgba(255,255,255,0.22)",
      color: "#ffffff",
      boxShadow: `0 14px 34px ${primary}55`,
    };
  }

  return {
    background: buttonStyle === "outline" ? "transparent" : buttonStyle === "glass" ? "rgba(255,255,255,0.08)" : appearance.buttonBackground,
    borderColor: appearance.buttonBorder,
    color: appearance.buttonText,
    backdropFilter: buttonStyle === "glass" ? "blur(14px)" : undefined,
    boxShadow: buttonStyle === "glow" ? `0 0 28px ${primary}88,0 12px 32px rgba(2,6,23,0.18)` : "0 12px 35px rgba(0,0,0,0.14)",
  };
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "D";
}

function getLinkIcon(icon: string) {
  const icons = {
    instagram: Camera,
    tiktok: Music2,
    youtube: Video,
    whatsapp: MessageCircle,
    facebook: Users,
    x: AtSign,
    linkedin: BriefcaseBusiness,
    spotify: Play,
    email: Mail,
    website: Globe2,
    link: Link2,
  };

  return icons[icon as keyof typeof icons] ?? Link2;
}
