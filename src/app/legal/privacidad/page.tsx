import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad — Kronos",
  description:
    "Quién es el responsable de tus datos, para qué los usamos y cómo ejercer tus derechos ARCO.",
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
          Aviso de Privacidad
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
          <Section title="1. Responsable de tus datos">
            <p>
              El responsable del tratamiento de tus datos personales es Kronos,
              con domicilio en México y correo de contacto{" "}
              <a href="mailto:hola@kronos-fit.com" className="lp-link-lime">
                hola@kronos-fit.com
              </a>
              . Cuando usas la aplicación a través de un Box, ese Box es
              responsable de los datos de sus atletas y Kronos actúa como
              encargado del tratamiento por cuenta del Box.
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <p>
              <strong>Del dueño o coach del Box:</strong> nombre, correo,
              teléfono, nombre del Box, cantidad de atletas, software actual y
              preferencias de plan. Los recopilamos cuando creas tu Box o
              cuando nos dejas tus datos en el formulario de contacto.
            </p>
            <p>
              <strong>Del atleta:</strong> nombre, correo, teléfono, fecha de
              nacimiento, historial de asistencia, scores de WODs, PRs por
              movimiento, pagos y membresías. El atleta puede darse de alta por
              su cuenta con una cuenta gratuita, o el Box puede darlo de alta e
              invitarlo. En ambos casos, el atleta puede corregir o completar
              sus datos desde su perfil.
            </p>
          </Section>

          <Section title="3. Finalidades del tratamiento">
            <ul
              style={{
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <li>
                Finalidades necesarias: operar la plataforma de gestión del Box,
                dar de alta y autenticar tu cuenta, gestionar reservas,
                asistencia, WODs y PRs, y procesar el cobro de membresías.
              </li>
              <li>
                Finalidades necesarias: enviarte avisos de servicio (tu reserva,
                el WOD del día, un pago vencido).
              </li>
              <li>
                Finalidades no necesarias: contactar al dueño del Box para
                acompañarlo en el alta, darle soporte y ofrecerle mejoras del
                servicio.
              </li>
              <li>
                Finalidades no necesarias: mejorar el producto con análisis de
                uso agregado y anónimo.
              </li>
            </ul>
            <p>
              Puedes negarte a las finalidades no necesarias sin perder el
              servicio: escríbenos al correo de contacto y dejamos de usar tus
              datos para eso.
            </p>
          </Section>

          <Section title="4. No vendemos tus datos">
            <p>
              Nunca vendemos, alquilamos ni compartimos información personal con
              terceros para fines de mercadotecnia. Los únicos terceros con
              acceso limitado son nuestros proveedores de infraestructura
              (alojamiento en la nube, pasarela de pagos) bajo acuerdos de
              confidencialidad.
            </p>
          </Section>

          <Section title="5. Seguridad">
            <ul
              style={{
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <li>Cifrado en reposo en la base de datos PostgreSQL.</li>
              <li>TLS 1.3 en todas las comunicaciones.</li>
              <li>
                Aislamiento por Box: cada Box tiene su propio espacio de datos y
                nadie de otro Box puede verlo.
              </li>
              <li>Respaldos diarios automáticos con retención de 30 días.</li>
              <li>Acceso basado en roles: cada persona ve solo lo suyo.</li>
              <li>
                El acceso a la cuenta es por código de un solo uso enviado a tu
                correo, así que no hay contraseña que se pueda filtrar.
              </li>
            </ul>
          </Section>

          <Section title="6. Tus derechos ARCO">
            <p>
              Tienes derecho a <strong>acceder</strong> a tus datos personales,{" "}
              <strong>rectificar</strong> los que estén incorrectos,{" "}
              <strong>cancelar</strong> tu cuenta para que dejemos de tratarlos
              y <strong>oponerte</strong> a que los usemos para una finalidad no
              necesaria. También puedes revocar tu consentimiento y solicitar
              que limitemos el uso o la divulgación de tus datos.
            </p>
            <p>
              <strong>Cómo ejercerlos:</strong> escríbenos a{" "}
              <a href="mailto:hola@kronos-fit.com" className="lp-link-lime">
                hola@kronos-fit.com
              </a>{" "}
              desde el correo de tu cuenta, diciendo qué derecho quieres ejercer
              y sobre qué datos. Te respondemos por el mismo medio. Si eres
              atleta de un Box, avísanos también a tu Box: la información de tu
              membresía y tus pagos es suya y puede necesitar autorizarlo.
            </p>
            <p>
              Además, en cualquier momento puedes exportar toda tu información
              en formato CSV desde la propia aplicación, sin pedírnoslo.
            </p>
          </Section>

          <Section title="7. Cookies y analítica">
            <p>
              Usamos cookies esenciales para la operación de la plataforma
              (sesión, preferencias). Usamos PostHog para analítica de producto
              de forma anónima. No usamos cookies de terceros para publicidad.
              Puedes desactivar la analítica desde la configuración de tu
              navegador.
            </p>
          </Section>

          <Section title="8. Retención">
            <p>
              Mantenemos la información del Box mientras la cuenta esté activa.
              Si cancelas, te damos 30 días para exportar tu información antes
              de eliminarla permanentemente de nuestros servidores. Los
              respaldos se purgan automáticamente después de 30 días.
            </p>
          </Section>

          <Section title="9. Cambios a este aviso">
            <p>
              Podemos actualizar este aviso ocasionalmente. Los cambios
              importantes se notifican por correo y se reflejan en la fecha de
              última actualización de arriba. El uso continuado del servicio
              después de la actualización constituye aceptación.
            </p>
          </Section>

          <Section title="10. Contacto">
            <p>
              Para preguntas sobre privacidad, escríbenos a{" "}
              <a href="mailto:hola@kronos-fit.com" className="lp-link-lime">
                hola@kronos-fit.com
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
