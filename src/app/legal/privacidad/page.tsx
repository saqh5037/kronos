import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — Kronos",
  description:
    "Cómo Kronos recopila, usa y protege la información personal de Boxes y atletas.",
  robots: { index: true, follow: true },
};

export default function PrivacidadPage() {
  return (
    <div
      className="lp-root lp-grain"
      style={{ minHeight: "100vh", padding: "64px 24px" }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--k-font-display), monospace",
            fontSize: 12,
            letterSpacing: "0.14em",
            color: "var(--k-accent)",
            textTransform: "uppercase",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← VOLVER A KRONOS
        </Link>
        <h1
          style={{
            fontFamily: "var(--k-font-display), monospace",
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "var(--k-t1)",
            marginTop: 32,
            lineHeight: 1.05,
          }}
        >
          Política de Privacidad
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-body), Inter",
            fontSize: 15,
            color: "var(--k-t2)",
            marginTop: 16,
            lineHeight: 1.6,
          }}
        >
          Última actualización: 8 de mayo de 2026
        </p>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            flexDirection: "column",
            gap: 40,
          }}
        >
          <Section title="1. Información que recopilamos">
            <p>
              <strong>Del Box (owner):</strong> nombre, email, teléfono, nombre
              del Box, cantidad de atletas, software actual y preferencias de
              plan. Estos datos se recopilan a través del formulario de contacto
              en la landing page.
            </p>
            <p>
              <strong>De los atletas:</strong> nombre, email, teléfono, fecha de
              nacimiento, historial de asistencia, scores de WODs, PRs por
              movimiento, pagos y membresías. Estos datos los ingresa el Box al
              dar de alta a sus atletas en la plataforma.
            </p>
          </Section>

          <Section title="2. Cómo usamos la información">
            <ul
              style={{
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <li>Operar y mantener la plataforma de gestión del Box.</li>
              <li>Procesar pagos y facturación.</li>
              <li>
                Enviar notificaciones relevantes (reservas, WODs, pagos
                vencidos).
              </li>
              <li>
                Contactar al Box para onboarding, soporte y follow-up comercial.
              </li>
              <li>
                Mejorar el producto a través de análisis de uso agregado y
                anónimo.
              </li>
            </ul>
          </Section>

          <Section title="3. No vendemos tu data">
            <p>
              Nunca vendemos, alquilamos ni compartimos información personal con
              terceros para fines de marketing. Los únicos terceros con acceso
              limitado son nuestros proveedores de infraestructura (hosting
              cloud, pasarelas de pago) bajo acuerdos de confidencialidad.
            </p>
          </Section>

          <Section title="4. Seguridad">
            <ul
              style={{
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <li>Encryption at rest en la base de datos PostgreSQL.</li>
              <li>TLS 1.3 en todas las comunicaciones.</li>
              <li>
                Aislamiento por tenant: cada Box tiene su propio espacio de
                datos.
              </li>
              <li>Backups diarios automáticos con retención de 30 días.</li>
              <li>
                Acceso basado en roles con autenticación de dos factores
                disponible.
              </li>
            </ul>
          </Section>

          <Section title="5. Tus derechos">
            <p>
              Como Box o atleta, tenés derecho a: acceder a tu información,
              corregir datos inexactos, solicitar la eliminación de tu cuenta, y
              exportar tu data en formato CSV. Para ejercer estos derechos,
              escribinos a{" "}
              <a href="mailto:hola@kronos.app" className="lp-link-lime">
                hola@kronos.app
              </a>
              .
            </p>
          </Section>

          <Section title="6. Cookies y tracking">
            <p>
              Usamos cookies esenciales para la operación de la plataforma
              (sesión, preferencias). Usamos PostHog para analytics de producto
              de forma anónima. No usamos cookies de terceros para publicidad.
              Podés desactivar analytics desde la configuración de tu navegador.
            </p>
          </Section>

          <Section title="7. Retención">
            <p>
              Mantenemos la información del Box mientras la cuenta esté activa.
              Si cancelás, te damos 30 días para exportar tu data antes de
              eliminarla permanentemente de nuestros servidores. Los backups se
              purgan automáticamente después de 30 días.
            </p>
          </Section>

          <Section title="8. Cambios a esta política">
            <p>
              Podemos actualizar esta política ocasionalmente. Los cambios
              materiales se notificarán por email. El uso continuado del
              servicio después de la actualización constituye aceptación.
            </p>
          </Section>

          <Section title="9. Contacto">
            <p>
              Para preguntas sobre privacidad, escribinos a{" "}
              <a href="mailto:hola@kronos.app" className="lp-link-lime">
                hola@kronos.app
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--k-font-display), monospace",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.04em",
          color: "var(--k-t1)",
          marginBottom: 16,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontFamily: "var(--k-font-body), Inter",
          fontSize: 15,
          lineHeight: 1.7,
          color: "var(--k-t2)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {children}
      </div>
    </section>
  );
}
