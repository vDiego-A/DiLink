export const APP_NAME = "DiLink";
export const LOGO_MARK_NAME = "Vlink";
export const THEME_STORAGE_KEY = "linkbio-theme";

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
  baseUrl: "https://midominio.com",
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
