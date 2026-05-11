"use client";

import Link from "next/link";
import KronosLogo from "@/components/brand/KronosLogo";
import { track } from "../_lib/track";

const NAV_LINKS = [
  { label: "Para el atleta", href: "#section-atleta" },
  { label: "Para el owner", href: "#section-owner" },
  { label: "White-label", href: "#section-whitelabel" },
  { label: "Precios", href: "#section-pricing" },
];

export default function Nav({ boxHref }: { boxHref: string | null }) {
  return (
    <header className="lp-nav">
      <Link href="/" className="lp-nav-logo" aria-label="Kronos — Inicio">
        <KronosLogo variant="lockup-h" size={38} />
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
            onClick={() => track("cta_clicked", { location: "nav_to_box" })}
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
          <>
            <Link href="/login" className="lp-btn-ghost">
              Entrar
            </Link>
            <a
              href="#section-form"
              className="lp-btn-lime"
              onClick={() => track("cta_clicked", { location: "nav" })}
            >
              Reservar lugar
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
          </>
        )}
      </div>
    </header>
  );
}
