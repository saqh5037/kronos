"use client";

import Link from "next/link";
import KronosLogo from "@/components/brand/KronosLogo";
import { track } from "../../_lib/track";
import { CTA_LABEL } from "../_data/copy";

const NAV_LINKS = [
  { label: "Skills", href: "#skills" },
  { label: "WOD", href: "#wod" },
  { label: "Por qué", href: "#por-que" },
];

export default function NavAtletas({ boxHref }: { boxHref: string | null }) {
  return (
    <header className="lp-nav">
      <Link
        href="/atletas"
        className="lp-nav-logo"
        aria-label="Kronos · Atletas"
      >
        <KronosLogo variant="lockup-h" size={38} tagline="ATLETAS" />
      </Link>
      <nav className="lp-nav-links" aria-label="Principal">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="lp-nav-cta">
        {boxHref ? (
          <a
            href={boxHref}
            className="lp-btn-lime"
            onClick={() =>
              track("cta_clicked", { location: "atletas_nav_to_box" })
            }
          >
            Ir a mi box
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        ) : (
          <Link
            href="/login"
            className="lp-btn-lime"
            onClick={() =>
              track("cta_clicked", { location: "atletas_nav_login" })
            }
          >
            {CTA_LABEL}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
