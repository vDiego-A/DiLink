import { PLAN_LIMITS, type PlanId } from "@/lib/plans";
import {
  PROFILE_BUTTON_STYLES,
  PROFILE_COLOR_PRESETS,
  PROFILE_FONTS,
  PROFILE_THEMES,
  isAvailableForPlan,
  isGradientValue,
  isHexColor,
} from "@/lib/profile-design";

export type ProfileEditorLinkInput = {
  id: string;
  title: string;
  url: string;
  icon: string;
  isActive: boolean;
};

export type ProfileEditorSaveInput = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  buttonStyle: string;
  backgroundType: string;
  backgroundValue: string;
  links: ProfileEditorLinkInput[];
};

export type SaveProfileResult =
  | { ok: true; username: string; isPublished: true }
  | { ok: false; code: "validation" | "authentication" | "setup" | "username" | "unexpected"; message: string };

export function isProfileEditorSaveInput(value: unknown): value is ProfileEditorSaveInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  const stringFields = [
    "username",
    "displayName",
    "bio",
    "theme",
    "primaryColor",
    "secondaryColor",
    "font",
    "buttonStyle",
    "backgroundType",
    "backgroundValue",
  ];

  if (stringFields.some((field) => typeof input[field] !== "string")) return false;
  if (input.avatarUrl !== null && typeof input.avatarUrl !== "string") return false;
  if (!Array.isArray(input.links)) return false;

  return input.links.every((value) => {
    if (!value || typeof value !== "object") return false;
    const link = value as Record<string, unknown>;
    return (
      typeof link.id === "string" &&
      typeof link.title === "string" &&
      typeof link.url === "string" &&
      typeof link.icon === "string" &&
      typeof link.isActive === "boolean"
    );
  });
}

export function validateProfileEditorInput(input: ProfileEditorSaveInput, plan: PlanId) {
  if (input.displayName.trim().length < 2 || input.displayName.trim().length > 60) {
    return "El nombre público debe tener entre 2 y 60 caracteres.";
  }

  const username = normalizeUsername(input.username);
  if (
    username.length < 3 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(username) ||
    RESERVED_USERNAMES.has(username)
  ) {
    return "El nombre de página no es válido o está reservado.";
  }

  if (input.bio.trim().length > 160) return "La bio no puede superar 160 caracteres.";
  const theme = PROFILE_THEMES.find((option) => option.id === input.theme);
  if (!theme || !isAvailableForPlan(theme.minimumPlan, plan)) return "El tema seleccionado no está disponible en tu plan.";

  const buttonStyle = PROFILE_BUTTON_STYLES.find((option) => option.id === input.buttonStyle);
  if (!buttonStyle || !isAvailableForPlan(buttonStyle.minimumPlan, plan)) return "El estilo de botón no está disponible en tu plan.";

  const font = PROFILE_FONTS.find((option) => option.id === input.font);
  if (!font || !isAvailableForPlan(font.minimumPlan, plan)) return "La tipografía seleccionada no está disponible en tu plan.";

  if (!isHexColor(input.primaryColor) || !isHexColor(input.secondaryColor)) {
    return "La paleta seleccionada contiene un color no válido.";
  }

  if (
    plan === "free" &&
    !PROFILE_COLOR_PRESETS.some(
      (preset) => preset.minimumPlan === "free" &&
        preset.primary === input.primaryColor.toUpperCase() &&
        preset.secondary === input.secondaryColor.toUpperCase(),
    )
  ) {
    return "Elige una de las paletas disponibles en Free o mejora a Pro para usar colores personalizados.";
  }

  if (!isValidBackground(input.backgroundType, input.backgroundValue)) {
    return "El fondo seleccionado no es válido.";
  }

  if (plan === "free" && input.backgroundType === "video") {
    return "Los fondos con video están disponibles con Pro.";
  }

  const maxLinks = PLAN_LIMITS[plan].maxLinks;
  if (maxLinks !== null && input.links.length > maxLinks) {
    return `El plan Free permite un máximo de ${maxLinks} enlaces.`;
  }

  const linkIds = new Set<string>();
  for (const link of input.links) {
    if (!UUID_PATTERN.test(link.id) || linkIds.has(link.id)) return "Encontramos un identificador de enlace no válido.";
    linkIds.add(link.id);
    if (!link.title.trim() || link.title.trim().length > 80) return "Todos los enlaces necesitan un nombre válido.";
    if (!isSafeWebUrl(link.url)) return `La URL de “${link.title}” no es válida.`;
    if (!ALLOWED_LINK_ICONS.has(link.icon)) return `No pudimos reconocer el tipo de enlace de “${link.title}”.`;
  }

  return "";
}

export function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function detectLinkIcon(value: string) {
  const url = value.toLowerCase();
  if (url.includes("instagram")) return "instagram";
  if (url.includes("tiktok")) return "tiktok";
  if (url.includes("youtube") || url.includes("youtu.be")) return "youtube";
  if (url.includes("wa.me") || url.includes("whatsapp")) return "whatsapp";
  if (url.includes("facebook")) return "facebook";
  if (url.includes("linkedin")) return "linkedin";
  if (url.includes("spotify")) return "spotify";
  return "link";
}

function isSafeWebUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isValidBackground(type: string, value: string) {
  if (type === "theme") return value === "";
  if (type === "solid") return isHexColor(value);
  if (type === "gradient") return isGradientValue(value);
  if (type === "image" || type === "video") return isSafeWebUrl(value);
  return false;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_LINK_ICONS = new Set([
  "link",
  "website",
  "instagram",
  "tiktok",
  "youtube",
  "whatsapp",
  "facebook",
  "x",
  "linkedin",
  "spotify",
  "email",
]);
const RESERVED_USERNAMES = new Set([
  "login",
  "signup",
  "dashboard",
  "onboarding",
  "checkout",
  "pricing",
  "auth",
  "api",
  "admin",
  "settings",
  "forgot-password",
  "reset-password",
]);
