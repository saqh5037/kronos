"use client";

import Link from "next/link";
// House rule (CLAUDE.md, design system): icons come from lucide-react. This
// header shipped the arrow as a hand-rolled inline <svg> duplicated twice.
import { ArrowRight } from "lucide-react";
import KronosLogo from "@/components/brand/KronosLogo";
import { CTA_TRIAL_HREF, CTA_TRIAL_LABEL } from "../_data/cta";
import { track } from "../_lib/track";

const NAV_LINKS = [
  { label: "Para tu box", href: "#section-owner" },
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
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </a>
        ) : (
          <>
            <Link href="/login" className="lp-btn-ghost">
              Entrar
            </Link>
            <a
              href={CTA_TRIAL_HREF}
              className="lp-btn-lime"
              onClick={() => track("cta_clicked", { location: "nav" })}
            >
              {CTA_TRIAL_LABEL}
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </a>
          </>
        )}
      </div>
    </header>
  );
}
