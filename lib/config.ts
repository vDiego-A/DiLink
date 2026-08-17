export const APP_NAME = "DiLink";
export const LOGO_MARK_NAME = "Vlink";
export const THEME_STORAGE_KEY = "linkbio-theme";

const DEFAULT_APP_URL = "http://localhost:3000";

function resolveAppUrl(value: string | undefined) {
  const candidate = value?.trim() || DEFAULT_APP_URL;

  try {
    return new URL(candidate).origin;
  } catch {
    throw new Error(
      "NEXT_PUBLIC_APP_URL debe ser una URL absoluta válida, por ejemplo https://dilink.vercel.app.",
    );
  }
}

export const APP_ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  onboarding: "/onboarding",
  checkout: "/checkout",
  dashboard: "/dashboard",
  editor: "/dashboard/editor",
  analytics: "/dashboard/analytics",
  adminPayments: "/admin/payments",
  authCallback: "/auth/callback",
  authConfirm: "/auth/confirm",
  createPageEntry: "/signup?fresh=1",
} as const;

export const APP_CONFIG = {
  appName: APP_NAME,
  appDescription:
    "Crea una página personal para reunir tus enlaces, contenido y proyectos en un solo lugar.",
  baseUrl: resolveAppUrl(process.env.NEXT_PUBLIC_APP_URL),
  contactEmail: "vabraham1555@gmail.com",
  navLinks: [
    { label: "Funciones", href: "#funciones" },
    { label: "Diseños", href: "#disenos" },
    { label: "Precios", href: "#precios" },
    { label: "Cómo funciona", href: "#como-funciona" },
  ],
  socialLinks: [
    { label: "Instagram", href: "#" },
    { label: "TikTok", href: "#" },
    { label: "YouTube", href: "#" },
  ],
  pricing: {
    proMonthlyLabel: "$1.99",
    proBolivarsLabel: "1,500 Bs",
    proPeriod: "/ mes",
  },
} as const;
