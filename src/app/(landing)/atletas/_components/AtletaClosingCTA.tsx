"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { track } from "../../_lib/track";

export default function AtletaClosingCTA({
  boxHref,
}: {
  boxHref: string | null;
}) {
  const reduce = useReducedMotion();

  return (
    <section className="lp-cta-tail-shell">
      <motion.div
        className="lp-cta-tail lp-grain"
        initial={reduce ? false : { y: 14 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div
          style={{ flex: 1, minWidth: 320, position: "relative", zIndex: 1 }}
        >
          <div className="lp-eyebrow">
            <span className="lp-dot" />
            EMPEZÁ HOY · SIN TARJETA · SIN LETRA CHICA
          </div>
          <h2>
            Tu próxima
            <br />
            <span className="lp-tag-lime">victoria</span> ya está cargada.
          </h2>
          <p>
            Si entrenás solo, abrís cuenta y empezás. Si tu box todavía no usa
            Kronos, mandale el link a tu coach — la decisión es de él, pero ya
            tenés argumentos.
          </p>
        </div>
        <div
          className="lp-cta-stack"
          style={{ position: "relative", zIndex: 1 }}
        >
          {boxHref ? (
            <a
              href={boxHref}
              className="lp-btn-lime lp-btn-lg"
              style={{ justifyContent: "center" }}
              onClick={() =>
                track("cta_clicked", {
                  location: "atletas_closing_to_box",
                })
              }
            >
              Abrir mi app →
            </a>
          ) : (
            <a
              href="/atleta-signup?from=atletas-closing"
              className="lp-btn-lime lp-btn-lg"
              style={{ justifyContent: "center" }}
              onClick={() =>
                track("cta_clicked", { location: "atletas_closing_signup" })
              }
            >
              Empezar gratis (Box Personal) →
            </a>
          )}
          <Link
            href={{
              pathname: "/",
              query: { audience: "athlete-referral" },
              hash: "section-form",
            }}
            className="lp-btn-ghost lp-btn-lg"
            style={{ justifyContent: "center" }}
            onClick={() =>
              track("cta_clicked", {
                location: "atletas_closing_referral",
              })
            }
          >
            Pídele Kronos a tu coach
          </Link>
          <span
            className="lp-caption"
            style={{
              color: "var(--k-t3)",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            TU DATA ES TUYA · SIN ANUNCIANTES
          </span>
        </div>
      </motion.div>
    </section>
  );
}
