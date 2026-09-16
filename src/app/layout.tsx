import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalEffects from "@/components/GlobalEffects";
import { KronosToaster } from "@/components/kronos/KronosToaster";
import { ConfirmProvider } from "@/lib/use-confirm";
import { MotionProvider } from "@/components/providers/MotionProvider";
// P1-6: five call sites fire `fireAchievementToast` (ScoreForm,
// AthleteScoreForm, QuickWodForm, PhotoWodFlow) and nothing rendered the
// listener, so every PR and badge unlock dispatched an event into the void.
// The host is a `"use client"` component with no static `canvas-confetti`
// import — it reads `window.confetti` and degrades silently when absent — so
// the old dynamic() wrapper (and the bundling TODO it carried) is not needed.
import { AchievementToastHost } from "@/components/atleta/AchievementToast";

// V3 "Cuarto Oscuro" canoniza a 2 fonts: Inter (body) + IBM Plex Mono
// (display + monoespaciado). Playfair/Dancing/JetBrains_Mono fueron eliminados
// en F1.6 para mejorar LCP — sus referencias residuales en globals.css
// caen al fallback system monospace cuando aplica.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kronos-fit.com";

export const viewport: Viewport = {
  themeColor: "#08080A",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Kronos",
  description: "El sistema operativo de tu box.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kronos",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no, date=no, address=no, email=no",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/icons/icon-192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/icons/icon-512.png"
        />
      </head>
      {/* `bg-bg`/`text-text` were Tailwind aliases onto the globals.css
          compat block. `text` lost its mapping in the batch-3 sweep, so the
          document had no declared text colour at all and relied on the
          `html, body` rule in globals.css. The V3 tokens directly. */}
      <body className="font-sans bg-[var(--k-bg)] text-[var(--k-t1)] antialiased min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
          forcedTheme="dark"
        >
          <GlobalEffects />
          <MotionProvider>
            <ConfirmProvider>
              {children}
              <KronosToaster />
              <AchievementToastHost />
            </ConfirmProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
