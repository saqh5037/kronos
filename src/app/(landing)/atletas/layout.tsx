import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kronos Atletas — La app de CrossFit que entrena contigo",
  description:
    "Anota PRs, reserva clases, mejora skills con coach IA. Foto del pizarrón → score automático. Para atletas que toman su entrenamiento en serio.",
  keywords: [
    "app atleta CrossFit",
    "tracker PR CrossFit",
    "skills CrossFit IA",
    "WOD del día app",
    "app reservar clase CrossFit",
  ],
  openGraph: {
    title: "Kronos Atletas — La app que entrena contigo",
    description:
      "Tu progreso es el producto. WODs, PRs, skills, reservas. Anti-cringe, anti-spam, datos duros.",
    type: "website",
    locale: "es_MX",
    siteName: "Kronos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronos Atletas — La app que entrena contigo",
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
