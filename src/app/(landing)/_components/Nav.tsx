import Link from "next/link";
import KronosLogo from "@/components/brand/KronosLogo";

const NAV_LINKS = [
  { label: "Producto", href: "#producto" },
  { label: "Para Boxes", href: "#owner" },
  { label: "Para atletas", href: "#atleta" },
  { label: "Precios", href: "#pricing" },
];

export default function Nav() {
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
        <Link href="/login" className="lp-btn-ghost">
          Entrar
        </Link>
        <Link href="/signup" className="lp-btn-lime">
          Registrate gratis
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
      </div>
    </header>
  );
}
