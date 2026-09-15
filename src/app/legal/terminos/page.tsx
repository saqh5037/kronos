import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio — Kronos",
  description:
    "Términos y condiciones de uso del software Kronos para CrossFit Boxes.",
  robots: { index: true, follow: true },
};

export default function TerminosPage() {
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
          Términos de Servicio
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
          <Section title="1. Definiciones">
            <p>
              <strong>Kronos</strong> (&ldquo;nosotros&rdquo;,
              &ldquo;nuestro&rdquo;) es la plataforma de software para la
              gestión de CrossFit Boxes. <strong>Box</strong>{" "}
              (&ldquo;usted&rdquo;, &ldquo;su&rdquo;) es el gimnasio, centro de
              entrenamiento o establecimiento deportivo que contrata el
              servicio. <strong>Atleta</strong> es la persona que utiliza la
              aplicación del Box para reservar clases, registrar scores y
              realizar pagos.
            </p>
          </Section>

          <Section title="2. Objeto del servicio">
            <p>
              Kronos proporciona una plataforma white-label de gestión para
              Boxes de CrossFit, incluyendo: reservas de clases, control de
              asistencia, programación de WODs, procesamiento de pagos, registro
              de PRs, comunicaciones y panel administrativo.
            </p>
          </Section>

          <Section title="3. Suscripción y pagos">
            <p>
              El servicio se contrata bajo un modelo de suscripción mensual en
              MXN. No hay contratos anuales obligatorios ni costo de
              instalación. Los precios están publicados en la página de Kronos
              para Boxes y pueden actualizarse con previo aviso de 30 días
              calendario.
            </p>
            <p>
              El Box puede cancelar en cualquier momento. No hay penalidad por
              cancelación anticipada. Al cancelar, Kronos exporta la data del
              Box en formato CSV sin costo adicional.
            </p>
          </Section>

          <Section title="4. Marca propia del Box">
            <p>
              En todos los planes, el Box puede personalizar la aplicación del
              atleta con su logo, su nombre y su paleta de colores. En el plan
              Titanio puede además usar su propio dominio y enviar las
              comunicaciones desde su dominio: en ese caso el atleta no verá la
              marca Kronos en la interfaz.
            </p>
          </Section>

          <Section title="5. Procesamiento de pagos">
            <p>
              Kronos integra hoy una sola pasarela de pago de terceros: Mercado
              Pago, para cobros con tarjeta. Los pagos en efectivo se registran
              manualmente en el panel del Box y Kronos no participa en ellos.
              Kronos no cobra comisión sobre las transacciones de los atletas;
              las tarifas de procesamiento son directamente entre el Box y el
              proveedor de pagos.
            </p>
          </Section>

          <Section title="6. Propiedad intelectual">
            <p>
              Kronos retiene todos los derechos de propiedad intelectual sobre
              el software. El Box retiene los derechos sobre su marca, logo,
              contenido y data de atletas. La data del Box siempre es propiedad
              del Box y puede exportarse en cualquier momento.
            </p>
          </Section>

          <Section title="7. Confidencialidad y seguridad">
            <p>
              Cada Box opera como espacio de datos aislado en la base de datos.
              No compartimos información entre Boxes. Implementamos cifrado en
              reposo, respaldos diarios con retención de 30 días y accesos
              controlados por rol.
            </p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>
              Kronos no será responsable por interrupciones del servicio
              causadas por factores fuera de nuestro control razonable,
              incluyendo: fallas de proveedores de infraestructura en la nube,
              problemas de conectividad de internet del Box o sus atletas, o
              modificaciones no autorizadas del código por parte del Box.
            </p>
          </Section>

          <Section title="9. Modificaciones">
            <p>
              Nos reservamos el derecho de modificar estos términos. Los cambios
              materiales se notificarán por email con al menos 15 días de
              anticipación. El uso continuado del servicio después de la fecha
              efectiva constituye aceptación de los nuevos términos.
            </p>
          </Section>

          <Section title="10. Contacto">
            <p>
              Para preguntas sobre estos términos, escríbenos a{" "}
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
