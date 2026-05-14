import Link from "next/link";
import KronosLogo from "@/components/brand/KronosLogo";
import { FOOTER } from "../_data/copy";

export default function FooterMinimal() {
  return (
    <footer
      style={{
        padding: "48px 24px 56px",
        borderTop: "1px solid var(--k-line)",
        background: "var(--k-bg)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <KronosLogo variant="lockup-h" size={36} tagline="ATLETAS" />

        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            justifyContent: "center",
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
          }}
        >
          {FOOTER.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: "var(--k-t2)",
                textDecoration: "none",
                transition: "color 120ms ease",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <p
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.22em",
            color: "var(--k-t3)",
            margin: 0,
          }}
        >
          {FOOTER.copy}
        </p>

        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 12,
            color: "var(--k-t3)",
            margin: 0,
            maxWidth: 480,
          }}
        >
          {FOOTER.coachLine}
        </p>
      </div>
    </footer>
  );
}
