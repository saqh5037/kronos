import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import {
  Inter,
  Playfair_Display,
  Dancing_Script,
  JetBrains_Mono,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalEffects from "@/components/GlobalEffects";
import { KronosToaster } from "@/components/kronos/KronosToaster";
import { ConfirmProvider } from "@/lib/use-confirm";

const AchievementToastHost = dynamic(() =>
  import("@/components/atleta/AchievementToast").then(
    (m) => m.AchievementToastHost,
  ),
);

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
  display: "swap",
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
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
      className={`${inter.variable} ${playfair.variable} ${dancing.variable} ${jetbrainsMono.variable} ${plexMono.variable}`}
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
          <ConfirmProvider>
            {children}
            <KronosToaster />
            <AchievementToastHost />
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
