import KronosLogo from "@/components/brand/KronosLogo";
import { FOOTER_LINKS } from "../_data/mock";

export default function Footer() {
  return (
    <>
      <footer className="lp-foot">
        <div className="brand-block">
          <KronosLogo variant="lockup-h" size={36} />
          <p>
            Software para CrossFit Boxes en LATAM. Operamos detrás de tu marca,
            con tu logo y tu color de acento. Tu Box es tuyo. Tu data también.
          </p>
          <div
            className="lp-caption"
            style={{
              color: "var(--k-accent)",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span className="lp-dot" />
            v1.0 · piloto privado · MX · CO · PE
          </div>
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
          <h4>Empresa</h4>
          <ul>
            {FOOTER_LINKS.empresa.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Legal</h4>
          <ul>
            {FOOTER_LINKS.legal.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </footer>

      <div className="lp-foot-bottom">
        <span>© {new Date().getFullYear()} KRONOS · CDMX</span>
        <span>Hecho en LATAM, para Boxes en LATAM.</span>
      </div>
    </>
  );
}
