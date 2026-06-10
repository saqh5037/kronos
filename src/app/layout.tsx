import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalEffects from "@/components/GlobalEffects";
import { KronosToaster } from "@/components/kronos/KronosToaster";
import { ConfirmProvider } from "@/lib/use-confirm";
import { MotionProvider } from "@/components/providers/MotionProvider";

// TODO: Fix canvas-confetti webpack bundling issue
// const AchievementToastHost = dynamic(() =>
//   import("@/components/atleta/AchievementToast").then(
//     (m) => m.AchievementToastHost,
//   ),
// );

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
      <body className="font-sans bg-bg text-text antialiased min-h-screen">
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
              {/* TODO: Fix canvas-confetti webpack bundling issue */}
              {/* <AchievementToastHost /> */}
            </ConfirmProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
