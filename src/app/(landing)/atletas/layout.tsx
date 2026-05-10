import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kronos Atletas — La app de CrossFit que entrena con vos",
  description:
    "Trackeá PRs, reservá clases, mejorá skills con coach IA. Foto del whiteboard → score auto-detectado. Para atletas que toman su entrenamiento en serio.",
  keywords: [
    "app atleta CrossFit",
    "tracker PR CrossFit",
    "skills CrossFit IA",
    "WOD del día app",
    "app reservar clase CrossFit",
  ],
  openGraph: {
    title: "Kronos Atletas — La app que entrena con vos",
    description:
      "Tu progreso es el producto. WODs, PRs, skills, reservas. Anti-cringe, anti-spam, datos duros.",
    type: "website",
    locale: "es_MX",
    siteName: "Kronos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronos Atletas — La app que entrena con vos",
    description:
      "Tu progreso es el producto. WODs, PRs, skills, reservas. Anti-cringe, anti-spam, datos duros.",
  },
  alternates: { canonical: "/atletas" },
  robots: { index: true, follow: true },
};

export default function AtletasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
