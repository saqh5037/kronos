import KronosLogo from "@/components/brand/KronosLogo";
import { FOOTER_LINKS } from "../_data/mock";

export default function Footer() {
  return (
    <>
      <footer className="lp-foot">
        <div className="brand-block">
          <KronosLogo variant="lockup-h" size={36} />
          <p>Software invisible para CrossFit Boxes.</p>
          <p
            className="lp-caption"
            style={{ color: "var(--k-t3)", marginTop: 8 }}
          >
            Operamos detrás de tu marca, en tu dominio, con tu paleta.
          </p>
        </div>

        <div>
          <h4>Producto</h4>
          <ul>
            {FOOTER_LINKS.producto.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Recursos</h4>
          <ul>
            {FOOTER_LINKS.recursos.map((l) => (
              <li key={l.label}>
                {l.comingSoon ? (
                  <span style={{ color: "var(--k-t3)", cursor: "default" }}>
                    {l.label}
                    <span
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginLeft: 8,
                        color: "var(--k-accent)",
                        fontFamily: "var(--k-font-display), monospace",
                        fontWeight: 700,
                      }}
                    >
                      PRÓX.
                    </span>
                  </span>
                ) : (
                  <a href={l.href}>{l.label}</a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Kronos</h4>
          <ul>
            {FOOTER_LINKS.kronos.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Acceso</h4>
          <ul>
            <li>
              <a href="/login">Entrar al box</a>
            </li>
            <li>
              <a href="/admin">Panel admin</a>
            </li>
            <li>
              <a href="/atleta">App atleta</a>
            </li>
            <li>
              <a
                href="/atleta-signup"
                style={{
                  color: "var(--k-accent)",
                  fontWeight: 600,
                }}
              >
                ¿Eres atleta? Empezar gratis →
              </a>
            </li>
          </ul>
        </div>
      </footer>

      <div
        style={{
          borderTop: "1px solid var(--k-line)",
          borderBottom: "1px solid var(--k-line)",
          padding: "20px 32px",
          textAlign: "center",
          background: "var(--k-elevated)",
        }}
      >
        <a
          href="/atleta-signup"
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 15,
            color: "var(--k-t1)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "var(--k-accent-on)",
              background: "var(--k-accent)",
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            GRATIS
          </span>
          ¿Eres atleta? Crea tu cuenta en 30 segundos —{" "}
          <span style={{ color: "var(--k-accent)", fontWeight: 600 }}>
            sin pedirle permiso a tu Box.
          </span>
        </a>
      </div>

      <div className="lp-foot-bottom">
        <span>
          © {new Date().getFullYear()} KRONOS · MÉXICO ·{" "}
          <a href="/legal/terminos">TÉRMINOS</a> ·{" "}
          <a href="/legal/privacidad">PRIVACIDAD</a>
        </span>
        <span>HECHO EN LATAM, PARA BOXES EN LATAM</span>
      </div>
    </>
  );
}
