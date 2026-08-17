export type PlanId = "free" | "pro";

export type PlanLimits = {
  maxLinks: number | null;
  customColors: boolean;
  imageBackground: boolean;
  videoBackground: boolean;
  premiumFonts: boolean;
  advancedAnalytics: boolean;
  removeBranding: boolean;
  premiumThemes: boolean;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxLinks: 3,
    customColors: false,
    imageBackground: true,
    videoBackground: false,
    premiumFonts: false,
    advancedAnalytics: false,
    removeBranding: false,
    premiumThemes: false,
  },
  pro: {
    maxLinks: null,
    customColors: true,
    imageBackground: true,
    videoBackground: true,
    premiumFonts: true,
    advancedAnalytics: true,
    removeBranding: true,
    premiumThemes: true,
  },
};

export const PLAN_CONTENT = {
  free: {
    name: "Free",
    description: "Lo esencial para lanzar tu primera página.",
    features: [
      "Página pública y URL personalizada",
      "Foto, nombre y bio",
      "Hasta 3 enlaces",
      "Temas y paletas básicas",
      "Tipografías básicas",
      "Imagen de fondo personalizada",
      "Preview en tiempo real",
    ],
  },
  pro: {
    name: "Pro",
    description: "Control total para destacar y crecer.",
    features: [
      "Enlaces ilimitados",
      "Sin branding de la plataforma",
      "Todos los temas y tipografías",
      "Colores y videos de fondo",
      "Analytics avanzados",
      "QR avanzado y nuevas funciones",
    ],
  },
} as const;
