"use client";

import { motion, useReducedMotion } from "framer-motion";
import { WHITE_LABEL_PALETTES } from "../_data/mock";

const fadeUp = {
  hidden: { y: 14 },
  show: { y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function SectionWhiteLabel() {
  const reduce = useReducedMotion();
  const v = reduce ? undefined : fadeUp;

  return (
    <section className="lp-section lp-wl-section" id="white-label">
      <motion.div
        className="lp-wl-head"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.08 } } }
        }
      >
        <motion.div className="lp-eyebrow" variants={v}>
          <span className="lp-dot" />
          /03 · WHITE-LABEL ARCHITECTURE
        </motion.div>
        <motion.h2 variants={v}>
          Tu marca. <br />
          No la <span className="lp-tag-lime">nuestra</span>.
        </motion.h2>
        <motion.p variants={v}>
          Cada Box define <strong>un solo color</strong>: el de su marca. Es la
          única variable visual del sistema — toca 4 superficies (CTA, hero, tab
          activo, dot de estado). El resto vive en negros estratificados:
          agnóstico, atemporal, brutalmente consistente.
        </motion.p>
      </motion.div>

      <motion.div
        className="lp-palette-row"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        variants={
          reduce
            ? undefined
            : { show: { transition: { staggerChildren: 0.06 } } }
        }
        style={{ padding: "0 48px", maxWidth: 1320, margin: "32px auto 0" }}
      >
        {WHITE_LABEL_PALETTES.map((p) => (
          <motion.div key={p.name} className="lp-palette-card" variants={v}>
            <div
              className="swatch"
              style={{
                background: p.hex,
                boxShadow: p.glow ? `0 0 20px ${p.hex}55` : undefined,
              }}
            />
            <div>
              <div className="nm">{p.name}</div>
              <div className="hex">{p.hex}</div>
            </div>
            <div className="who">{p.caption}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="lp-wl-note"
        initial={reduce ? false : { y: 12 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <span className="lp-dot" />
        <div className="text">
          Pegás el <code>#hex</code> de tu marca, nosotros calculamos contraste
          automático sobre cada superficie.{" "}
          <span className="em">Lima → texto negro. Brasa → texto blanco.</span>{" "}
          Cero ajuste manual. Cualquier hex válido funciona.
        </div>
      </motion.div>
    </section>
  );
}
