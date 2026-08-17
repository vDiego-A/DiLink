import type { PlanId } from "@/lib/plans";

export const PROFILE_THEMES = [
  { id: "neon", name: "Neon", description: "Púrpura y azul", swatch: "linear-gradient(135deg,#7C3AED,#2563EB,#22D3EE)", minimumPlan: "free" },
  { id: "minimal", name: "Minimal", description: "Blanco y negro", swatch: "linear-gradient(135deg,#FFFFFF,#D4D4D8,#18181B)", minimumPlan: "free" },
  { id: "aurora", name: "Aurora", description: "Cyan profundo", swatch: "linear-gradient(135deg,#8B5CF6,#22D3EE,#07111F)", minimumPlan: "free" },
  { id: "sunset", name: "Sunset", description: "Naranja y rosa", swatch: "linear-gradient(135deg,#F97316,#EC4899,#4C1D95)", minimumPlan: "pro" },
  { id: "professional", name: "Professional", description: "Azul ejecutivo", swatch: "linear-gradient(135deg,#0F172A,#1E3A8A,#0EA5E9)", minimumPlan: "pro" },
  { id: "clean", name: "Clean", description: "Claro y editorial", swatch: "linear-gradient(135deg,#FFFFFF,#F4F4F5,#CBD5E1)", minimumPlan: "pro" },
] as const;

export const PROFILE_COLOR_PRESETS = [
  { name: "Purple Glow", primary: "#7C3AED", secondary: "#2563EB", minimumPlan: "free" },
  { name: "Ocean", primary: "#0369A1", secondary: "#22D3EE", minimumPlan: "free" },
  { name: "Emerald", primary: "#059669", secondary: "#22D3EE", minimumPlan: "free" },
  { name: "Sunset", primary: "#F97316", secondary: "#EC4899", minimumPlan: "free" },
  { name: "Midnight", primary: "#312E81", secondary: "#0F172A", minimumPlan: "pro" },
  { name: "Monochrome", primary: "#27272A", secondary: "#71717A", minimumPlan: "pro" },
] as const;

export const PROFILE_FONTS = [
  { id: "Inter", label: "Inter", minimumPlan: "free" },
  { id: "Poppins", label: "Poppins", minimumPlan: "free" },
  { id: "Roboto", label: "Roboto", minimumPlan: "free" },
  { id: "Space Grotesk", label: "Space Grotesk", minimumPlan: "pro" },
  { id: "Manrope", label: "Manrope", minimumPlan: "pro" },
  { id: "DM Sans", label: "DM Sans", minimumPlan: "pro" },
  { id: "Plus Jakarta Sans", label: "Plus Jakarta Sans", minimumPlan: "pro" },
  { id: "Outfit", label: "Outfit", minimumPlan: "pro" },
  { id: "Playfair Display", label: "Playfair Display", minimumPlan: "pro" },
  { id: "Caveat", label: "Caveat", minimumPlan: "pro" },
  { id: "Bebas Neue", label: "Bebas Neue", minimumPlan: "pro" },
  { id: "Pacifico", label: "Pacifico", minimumPlan: "pro" },
] as const;

export const PROFILE_BUTTON_STYLES = [
  { id: "rounded", name: "Rounded", minimumPlan: "free" },
  { id: "pill", name: "Pill", minimumPlan: "free" },
  { id: "square", name: "Square", minimumPlan: "free" },
  { id: "outline", name: "Outline", minimumPlan: "free" },
  { id: "glass", name: "Glass", minimumPlan: "pro" },
  { id: "glow", name: "Glow", minimumPlan: "pro" },
  { id: "liquid-glass", name: "Liquid Glass", minimumPlan: "pro" },
  { id: "neon-outline", name: "Neon Outline", minimumPlan: "pro" },
  { id: "soft-3d", name: "Soft 3D", minimumPlan: "pro" },
  { id: "gradient", name: "Gradient", minimumPlan: "pro" },
] as const;

export type ProfileBackgroundType = "theme" | "gradient" | "solid" | "image" | "video";

export function isAvailableForPlan(minimumPlan: PlanId, plan: PlanId) {
  return minimumPlan === "free" || plan === "pro";
}

export function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function isGradientValue(value: string) {
  return /^#[0-9a-f]{6},#[0-9a-f]{6}$/i.test(value);
}

export function usesProDesignFeatures(selection: {
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  buttonStyle: string;
  backgroundType: string;
  backgroundValue: string;
}) {
  const theme = PROFILE_THEMES.find((option) => option.id === selection.theme);
  const font = PROFILE_FONTS.find((option) => option.id === selection.font);
  const button = PROFILE_BUTTON_STYLES.find((option) => option.id === selection.buttonStyle);
  const usesFreePalette = PROFILE_COLOR_PRESETS.some(
    (preset) =>
      preset.minimumPlan === "free" &&
      preset.primary === selection.primaryColor.toUpperCase() &&
      preset.secondary === selection.secondaryColor.toUpperCase(),
  );

  return (
    theme?.minimumPlan === "pro" ||
    font?.minimumPlan === "pro" ||
    button?.minimumPlan === "pro" ||
    !usesFreePalette ||
    selection.backgroundType === "video"
  );
}
