"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import {
  ATHLETES_OPTIONS,
  SOFTWARE_OPTIONS,
  PLAN_OPTIONS,
} from "../_data/mock";
import { track } from "../_lib/track";

const leadSchema = z.object({
  ownerName: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(8, "Formato internacional requerido"),
  boxName: z.string().min(1, "Requerido"),
  athletes: z.string().min(1, "Selecciona una opción"),
  currentSw: z.string().optional(),
  planInterest: z.string().optional(),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Tienes que aceptar para continuar" }),
  }),
  website: z.string().optional(), // honeypot
});

type LeadFormData = z.infer<typeof leadSchema>;

function LeadForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: LeadFormData) => {
    // Honeypot check
    if (data.website && data.website.length > 0) {
      return;
    }

    track("lead_form_submitted", {
      athletes: data.athletes,
      current_sw: data.currentSw ?? "none",
      plan_interest: data.planInterest ?? "unsure",
    });

    setServerError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok) {
        track("lead_form_succeeded");
        onSuccess();
      } else {
        track("lead_form_failed", { error: json.error ?? "unknown" });
        setServerError(
          json.error ?? "No pudimos enviar el formulario. Inténtalo de nuevo.",
        );
      }
    } catch {
      track("lead_form_failed", { error: "network" });
      setServerError("No pudimos enviar el formulario. Inténtalo de nuevo.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="lp-lead-form" noValidate>
      {/* Honeypot */}
      <div className="lp-honeypot" aria-hidden="true">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="lp-form-field">
        <label htmlFor="ownerName">Nombre del owner *</label>
        <input
          id="ownerName"
          type="text"
          placeholder="Tu nombre"
          {...register("ownerName")}
          onFocus={() => track("lead_form_started")}
          aria-invalid={errors.ownerName ? "true" : "false"}
          aria-describedby={errors.ownerName ? "ownerName-error" : undefined}
        />
        {errors.ownerName && (
          <span id="ownerName-error" className="lp-form-error">
            {errors.ownerName.message}
          </span>
        )}
      </div>

      <div className="lp-form-field">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          placeholder="tu@email.com"
          {...register("email")}
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <span id="email-error" className="lp-form-error">
            {errors.email.message}
          </span>
        )}
      </div>

      <div className="lp-form-field">
        <label htmlFor="whatsapp">WhatsApp *</label>
        <input
          id="whatsapp"
          type="tel"
          placeholder="+52 55 0000 0000"
          {...register("whatsapp")}
          aria-invalid={errors.whatsapp ? "true" : "false"}
          aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
        />
        {errors.whatsapp && (
          <span id="whatsapp-error" className="lp-form-error">
            {errors.whatsapp.message}
          </span>
        )}
        <span className="lp-form-hint">
          Te escribimos por WhatsApp, no spammeamos.
        </span>
      </div>

      <div className="lp-form-field">
        <label htmlFor="boxName">Nombre del Box *</label>
        <input
          id="boxName"
          type="text"
          placeholder="Iron Hands CrossFit"
          {...register("boxName")}
          aria-invalid={errors.boxName ? "true" : "false"}
          aria-describedby={errors.boxName ? "boxName-error" : undefined}
        />
        {errors.boxName && (
          <span id="boxName-error" className="lp-form-error">
            {errors.boxName.message}
          </span>
        )}
      </div>

      <div className="lp-form-field">
        <label htmlFor="athletes">Cantidad de atletas activos *</label>
        <select
          id="athletes"
          {...register("athletes")}
          aria-invalid={errors.athletes ? "true" : "false"}
          aria-describedby={errors.athletes ? "athletes-error" : undefined}
        >
          <option value="">Selecciona...</option>
          {ATHLETES_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.athletes && (
          <span id="athletes-error" className="lp-form-error">
            {errors.athletes.message}
          </span>
        )}
      </div>

      <div className="lp-form-field">
        <label htmlFor="currentSw">Software actual (opcional)</label>
        <select id="currentSw" {...register("currentSw")}>
          <option value="">Selecciona...</option>
          {SOFTWARE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="lp-form-field">
        <span className="lp-form-label">Plan que te interesa (opcional)</span>
        <div className="lp-radio-group">
          {PLAN_OPTIONS.map((o) => (
            <label key={o.value} className="lp-radio-label">
              <input
                type="radio"
                value={o.value}
                {...register("planInterest")}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="lp-form-field">
        <label htmlFor="notes">Algo que quieres contarnos (opcional)</label>
        <textarea
          id="notes"
          placeholder="Si quieres agregar contexto..."
          rows={3}
          maxLength={500}
          {...register("notes")}
        />
      </div>

      <div className="lp-form-field">
        <label className="lp-checkbox-label">
          <input
            type="checkbox"
            {...register("consent")}
            aria-invalid={errors.consent ? "true" : "false"}
            aria-describedby={errors.consent ? "consent-error" : undefined}
          />
          <span>
            Acepto que Kronos me contacte por email y WhatsApp para coordinar
            una demo. Puedo bajarme cuando quiera.
          </span>
        </label>
        {errors.consent && (
          <span id="consent-error" className="lp-form-error">
            {errors.consent.message}
          </span>
        )}
      </div>

      {serverError && (
        <div className="lp-form-error" role="alert">
          {serverError}
          <br />
          <span style={{ fontSize: 13 }}>Escríbenos a hola@kronos.app</span>
        </div>
      )}

      <button
        type="submit"
        className="lp-btn-lime lp-btn-lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "RESERVAR MI LUGAR →"}
      </button>
    </form>
  );
}

function LeadFormSuccess() {
  return (
    <motion.div
      className="lp-lead-success"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--k-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#08080A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2>Listo. Te escribimos hoy.</h2>
      <p>
        Recibimos tus datos. En menos de 24 horas hábiles te contacta el equipo
        de Kronos por WhatsApp para entender tu Box y agendar una llamada de 20
        minutos.
      </p>
      <p style={{ marginTop: 16 }}>
        En el primer mensaje te compartimos el link de la demo grabada y
        coordinamos la llamada.
      </p>
    </motion.div>
  );
}

export default function SectionLeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const reduce = useReducedMotion();

  return (
    <section
      className="lp-section lp-lead-section"
      id="section-form"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Atmospheric backdrop — gym vacío con luces ambient verde/amarillo.
          Comunica "tu box, tu espacio". Opacidad media (0.15) con mask radial
          que ilumina el centro donde está el form. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          maskImage:
            "radial-gradient(ellipse at 50% 70%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 70%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 75%)",
        }}
      >
        <Image
          src="/images/landing/box-testimonial-bg.webp"
          alt=""
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
            objectPosition: "center 60%",
            opacity: 0.15,
            filter: "contrast(1.1) brightness(0.7) saturate(0.6)",
          }}
        />
      </div>
      <motion.div
        className="lp-lead-head"
        style={{ position: "relative", zIndex: 1 }}
        initial={reduce ? false : { y: 14 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="lp-eyebrow">
          <span className="lp-dot" />
          /06 · RESERVAR MI LUGAR
        </div>
        <h2>Prueba Kronos en tu Box.</h2>
        <p>
          30 días sin cargo. Sin tarjeta. Sin contrato anual. Te llamamos en
          menos de 24 horas hábiles para entender tu Box y armar el setup. Si no
          funciona, exportamos tu data en CSV y cancelas cuando quieras.
        </p>
      </motion.div>

      <div
        className="lp-lead-form-shell"
        style={{ position: "relative", zIndex: 1 }}
      >
        {submitted ? (
          <LeadFormSuccess />
        ) : (
          <>
            <div className="lp-eyebrow" style={{ marginBottom: 24 }}>
              <span className="lp-dot" />
              DÉJANOS TUS DATOS · TE CONTACTAMOS HOY
            </div>
            <LeadForm onSuccess={() => setSubmitted(true)} />
            <p
              className="lp-caption"
              style={{
                color: "var(--k-t3)",
                textAlign: "center",
                marginTop: 20,
                lineHeight: 1.6,
              }}
            >
              Te respondemos en menos de 24 horas hábiles.
              <br />
              Sin spam. Sin scripts de venta agresivos. Sin promesas vacías.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
