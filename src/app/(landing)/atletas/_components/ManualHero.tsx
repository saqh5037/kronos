import Link from "next/link";

export default function ManualHero() {
  return (
    <section
      className="lp-hero"
      style={{ paddingTop: 48, paddingBottom: 40 }}
      id="manual-hero"
    >
      <div className="lp-hero-bg" aria-hidden="true" />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
        <Link
          href="/atletas"
          className="lp-caption"
          style={{
            color: "var(--k-t3)",
            letterSpacing: "0.18em",
            display: "flex",
            width: "fit-content",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
          }}
        >
          ← VOLVER A KRONOS ATLETAS
        </Link>
        <div className="lp-eyebrow">
          <span className="lp-dot" />
          MANUAL · KRONOS ATLETAS
        </div>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: "clamp(34px, 7.5vw, 64px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            margin: "20px 0 0",
            color: "var(--k-t1)",
            textWrap: "balance",
          }}
        >
          Cada pantalla,
          <br />
          <span className="lp-tag-lime">qué hace</span>, cómo se usa.
        </h1>
        <p className="lp-lead" style={{ marginTop: 24 }}>
          Las 9 pantallas del atleta documentadas paso a paso. Quien la lea,
          entiende toda la app. Linkeable por sección — copia la URL y
          compártela.
        </p>
      </div>
    </section>
  );
}
