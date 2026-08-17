import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { APP_CONFIG, APP_NAME, THEME_STORAGE_KEY } from "@/lib/config";
import "./globals.css";

/* eslint-disable @next/next/no-page-custom-font -- App Router carga este stylesheet una sola vez desde el layout raíz. */

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.baseUrl),
  title: `${APP_NAME} — Todo lo que eres, en un solo link`,
  description: APP_CONFIG.appDescription,
  keywords: ["link in bio", "página personal", "enlaces", "perfil digital", "creadores"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: APP_NAME,
    title: `${APP_NAME} — Todo lo que eres, en un solo link`,
    description: APP_CONFIG.appDescription,
    images: [
      {
        url: "/og.png",
        width: 1792,
        height: 1024,
        alt: `${APP_NAME}: Todo lo que eres, en un solo link`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Todo lo que eres, en un solo link`,
    description: APP_CONFIG.appDescription,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400..700&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Pacifico&family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        />
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"?"dark":"light";document.documentElement.dataset.theme=d;document.documentElement.style.colorScheme=d}catch(e){document.documentElement.dataset.theme="light"}`}
        </Script>
      </head>
      <body className="min-h-full bg-[var(--background)] font-sans text-[var(--foreground)]">{children}</body>
    </html>
  );
}
