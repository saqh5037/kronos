"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import {
  createPilotBox,
  type PilotOnboardingResult,
} from "@/server/actions/pilot-onboarding";
import {
  PILOT_DISCIPLINE_SLUGS,
  type PilotDisciplineSlug,
} from "@/lib/validations/pilot-onboarding";
import { formatDateLong } from "@/lib/format";

type DisciplineOption = { slug: string; name: string };

type FormState = {
  email: string;
  ownerName: string;
  boxName: string;
  slug: string;
  disciplineSlug: PilotDisciplineSlug;
  city: string;
  country: string;
  region: string;
  trialDurationDays: number;
  exclusivityDays: number;
  enableHyroxUI: boolean;
  enableMmAthlete: boolean;
  website: string; // honeypot
};

function isPilotDisciplineSlug(v: string): v is PilotDisciplineSlug {
  return (PILOT_DISCIPLINE_SLUGS as readonly string[]).includes(v);
}

const INITIAL: FormState = {
  email: "",
  ownerName: "",
  boxName: "",
  slug: "",
  disciplineSlug: "crossfit",
  city: "",
  country: "MX",
  region: "",
  trialDurationDays: 30,
  exclusivityDays: 60,
  enableHyroxUI: false,
  enableMmAthlete: false,
  website: "",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--k-font-display)",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.08em",
  color: "var(--k-t2)",
  marginBottom: 6,
  textTransform: "uppercase",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontFamily: "var(--k-font-body)",
  fontSize: 15,
  background: "var(--k-elevated)",
  color: "var(--k-t1)",
  border: "1px solid var(--k-line-2)",
  borderRadius: 8,
};

const FIELD_BLOCK: React.CSSProperties = { marginBottom: 18 };

const SECTION_STYLE: React.CSSProperties = {
  padding: "20px 24px",
  background: "var(--k-surface)",
  border: "1px solid var(--k-line)",
  borderRadius: 12,
  marginBottom: 20,
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: "var(--k-accent)",
  marginBottom: 16,
  textTransform: "uppercase",
};

/** Marks a field the form will not submit without. */
function Required() {
  return (
    <span aria-hidden style={{ color: "var(--k-accent)" }}>
      {" *"}
    </span>
  );
}

export function PilotOnboardingForm({
  disciplines,
}: {
  disciplines: DisciplineOption[];
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PilotOnboardingResult | null>(null);
  /** Creating a tenant and emailing its owner deserves a confirmation step. */
  const [reviewing, setReviewing] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setReviewing(true);
  }

  function handleCreate() {
    startTransition(async () => {
      const res = await createPilotBox({
        ...form,
        trialDurationDays: Number(form.trialDurationDays),
        exclusivityDays: Number(form.exclusivityDays),
      });
      setResult(res);
      setReviewing(false);
      if (res.ok) {
        setForm(INITIAL);
      }
    });
  }

  const fieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
  const disciplineName =
    disciplines.find((d) => d.slug === form.disciplineSlug)?.name ??
    form.disciplineSlug;

  if (reviewing) {
    return (
      <div className="k-card" style={{ padding: "24px" }}>
        <h2
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 18,
            fontWeight: 700,
            margin: "0 0 4px",
          }}
        >
          Revisa antes de crear
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--k-t2)",
            margin: "0 0 18px",
            lineHeight: 1.5,
          }}
        >
          Al confirmar se crea el box y le llega al dueño un enlace de acceso a
          su correo. Esto no se deshace solo.
        </p>

        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 10,
            margin: "0 0 22px",
            fontSize: 14,
          }}
        >
          <SummaryRow label="Box" value={form.boxName} />
          <SummaryRow label="Dirección pública" value={`/${form.slug}`} />
          <SummaryRow label="Disciplina" value={disciplineName} />
          <SummaryRow
            label="Ubicación"
            value={[form.city, form.region, form.country]
              .filter(Boolean)
              .join(", ")}
          />
          <SummaryRow label="Dueño" value={form.ownerName} />
          <SummaryRow label="Correo del dueño" value={form.email} />
          <SummaryRow label="Prueba" value={`${form.trialDurationDays} días`} />
          <SummaryRow
            label="Exclusividad"
            value={
              form.exclusivityDays > 0
                ? `${form.exclusivityDays} días`
                : "Sin exclusividad"
            }
          />
          <SummaryRow
            label="Funciones encendidas"
            value={
              [
                form.enableHyroxUI ? "Formato Hyrox" : null,
                form.enableMmAthlete ? "Varias membresías por atleta" : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Ninguna extra"
            }
          />
        </dl>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button
            type="button"
            onClick={handleCreate}
            disabled={pending}
            className="k-btn-grad"
            style={{
              padding: "12px 22px",
              fontSize: 14,
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            {pending ? "Creando…" : "Confirmar y crear box"}
          </button>
          <button
            type="button"
            onClick={() => setReviewing(false)}
            disabled={pending}
            className="k-btn-ghost"
            style={{ padding: "12px 22px", fontSize: 14, borderRadius: 10 }}
          >
            Seguir editando
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleReview} aria-labelledby="form-title">
      {/* Honeypot — oculto visualmente, accesible para bots */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label htmlFor="website">Sitio web (no llenar):</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <p style={{ fontSize: 12, color: "var(--k-t3)", margin: "0 0 16px" }}>
        Los campos marcados con{" "}
        <span style={{ color: "var(--k-accent)" }}>*</span> son obligatorios.
      </p>

      {/* Owner */}
      <section style={SECTION_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Dueño del box</h2>
        <div style={FIELD_BLOCK}>
          <label htmlFor="email" style={LABEL_STYLE}>
            Correo
            <Required />
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            style={INPUT_STYLE}
            placeholder="correo@ejemplo.com"
          />
          {fieldErrors.email && (
            <p style={{ color: "var(--k-danger)", fontSize: 13, marginTop: 6 }}>
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div style={FIELD_BLOCK}>
          <label htmlFor="ownerName" style={LABEL_STYLE}>
            Nombre completo
            <Required />
          </label>
          <input
            id="ownerName"
            type="text"
            required
            value={form.ownerName}
            onChange={(e) => update("ownerName", e.target.value)}
            style={INPUT_STYLE}
            placeholder="Nombre y apellido"
          />
        </div>
      </section>

      {/* Box */}
      <section style={SECTION_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Box</h2>
        <div style={FIELD_BLOCK}>
          <label htmlFor="boxName" style={LABEL_STYLE}>
            Nombre del box
            <Required />
          </label>
          <input
            id="boxName"
            type="text"
            required
            value={form.boxName}
            onChange={(e) => update("boxName", e.target.value)}
            style={INPUT_STYLE}
            placeholder="Nombre del box"
          />
        </div>
        <div style={FIELD_BLOCK}>
          <label htmlFor="slug" style={LABEL_STYLE}>
            Dirección pública
            <Required />
          </label>
          <input
            id="slug"
            type="text"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            style={INPUT_STYLE}
            placeholder="nombre-del-box"
          />
          <p style={{ fontSize: 12, color: "var(--k-t3)", marginTop: 6 }}>
            Así se verá en la URL. Solo minúsculas, números y guiones.
          </p>
          {fieldErrors.slug && (
            <p style={{ color: "var(--k-danger)", fontSize: 13, marginTop: 6 }}>
              {fieldErrors.slug}
            </p>
          )}
        </div>
      </section>

      {/* Disciplina + Geo */}
      <section style={SECTION_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Disciplina y ubicación</h2>
        <div style={FIELD_BLOCK}>
          <label htmlFor="disciplineSlug" style={LABEL_STYLE}>
            Disciplina
            <Required />
          </label>
          <select
            id="disciplineSlug"
            required
            value={form.disciplineSlug}
            onChange={(e) => {
              const v = e.target.value;
              if (isPilotDisciplineSlug(v)) update("disciplineSlug", v);
            }}
            style={INPUT_STYLE}
          >
            {disciplines.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <label htmlFor="city" style={LABEL_STYLE}>
              Ciudad
              <Required />
            </label>
            <input
              id="city"
              type="text"
              required
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              style={INPUT_STYLE}
              placeholder="Ciudad"
            />
          </div>
          <div>
            <label htmlFor="country" style={LABEL_STYLE}>
              País
              <Required />
            </label>
            <input
              id="country"
              type="text"
              required
              maxLength={2}
              value={form.country}
              onChange={(e) => update("country", e.target.value.toUpperCase())}
              style={INPUT_STYLE}
            />
            <p style={{ fontSize: 12, color: "var(--k-t3)", marginTop: 6 }}>
              Dos letras
            </p>
          </div>
        </div>
        <div style={FIELD_BLOCK}>
          <label htmlFor="region" style={LABEL_STYLE}>
            Estado o región (opcional)
          </label>
          <input
            id="region"
            type="text"
            value={form.region}
            onChange={(e) => update("region", e.target.value)}
            style={INPUT_STYLE}
            placeholder="Estado o región"
          />
        </div>
      </section>

      {/* Configuración piloto */}
      <section style={SECTION_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Condiciones del piloto</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <label htmlFor="trialDurationDays" style={LABEL_STYLE}>
              Prueba (días)
              <Required />
            </label>
            <input
              id="trialDurationDays"
              type="number"
              min={7}
              max={180}
              required
              value={form.trialDurationDays}
              onChange={(e) =>
                update("trialDurationDays", Number(e.target.value))
              }
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label htmlFor="exclusivityDays" style={LABEL_STYLE}>
              Exclusividad (días)
              <Required />
            </label>
            <input
              id="exclusivityDays"
              type="number"
              min={0}
              max={365}
              required
              value={form.exclusivityDays}
              onChange={(e) =>
                update("exclusivityDays", Number(e.target.value))
              }
              style={INPUT_STYLE}
            />
            <p style={{ fontSize: 12, color: "var(--k-t3)", marginTop: 6 }}>
              Días sin otro box de la misma disciplina en su ciudad. 0 = sin
              exclusividad.
            </p>
          </div>
        </div>
        <fieldset
          style={{
            border: "1px solid var(--k-line-2)",
            borderRadius: 8,
            padding: 14,
            margin: 0,
          }}
        >
          <legend
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--k-t2)",
              padding: "0 8px",
              textTransform: "uppercase",
            }}
          >
            Funciones opcionales
          </legend>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "6px 0",
              cursor: "pointer",
              fontFamily: "var(--k-font-body)",
              fontSize: 14,
              color: "var(--k-t1)",
            }}
          >
            <input
              type="checkbox"
              checked={form.enableHyroxUI}
              onChange={(e) => update("enableHyroxUI", e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong>Formato Hyrox</strong> — pantallas por estación y modo
              carrera. Se enciende solo cuando la disciplina es Hyrox.
            </span>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "6px 0",
              cursor: "pointer",
              fontFamily: "var(--k-font-body)",
              fontSize: 14,
              color: "var(--k-t1)",
            }}
          >
            <input
              type="checkbox"
              checked={form.enableMmAthlete}
              onChange={(e) => update("enableMmAthlete", e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong>Varias membresías por atleta</strong> — permite que un
              atleta tenga más de una membresía activa a la vez.
            </span>
          </label>
        </fieldset>
      </section>

      <button
        type="submit"
        className="k-btn-grad"
        style={{
          width: "100%",
          padding: "14px 24px",
          fontSize: 15,
          borderRadius: 10,
          marginTop: 8,
        }}
      >
        Revisar y crear
      </button>

      {/* Result */}
      {result && (
        <div
          style={{
            marginTop: 24,
            padding: "20px 24px",
            background: result.ok ? "var(--k-accent-soft)" : "var(--k-surface)",
            border: `1px solid ${result.ok ? "var(--k-accent-line)" : "var(--k-danger)"}`,
            borderRadius: 12,
            color: "var(--k-t1)",
          }}
          role="status"
          aria-live="polite"
        >
          {result.ok ? (
            <>
              <h3
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 16,
                  fontWeight: 700,
                  margin: "0 0 12px",
                  color: "var(--k-accent)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Check size={18} strokeWidth={2.6} aria-hidden />
                Box piloto creado
              </h3>
              <dl
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                <div>
                  <dt style={{ display: "inline", color: "var(--k-t2)" }}>
                    Dirección pública:
                  </dt>{" "}
                  <dd
                    style={{
                      display: "inline",
                      margin: 0,
                      fontFamily: "var(--k-font-display)",
                    }}
                  >
                    /{result.slug}
                  </dd>
                </div>
                <div>
                  <dt style={{ display: "inline", color: "var(--k-t2)" }}>
                    Disciplina:
                  </dt>{" "}
                  <dd style={{ display: "inline", margin: 0 }}>
                    {result.disciplineSlug}
                  </dd>
                </div>
                <div>
                  <dt style={{ display: "inline", color: "var(--k-t2)" }}>
                    La prueba termina:
                  </dt>{" "}
                  <dd style={{ display: "inline", margin: 0 }}>
                    {formatDateLong(result.trialEndsAt)}
                  </dd>
                </div>
                {result.pilotExclusivityExpiresAt && (
                  <div>
                    <dt style={{ display: "inline", color: "var(--k-t2)" }}>
                      Exclusividad hasta:
                    </dt>{" "}
                    <dd style={{ display: "inline", margin: 0 }}>
                      {formatDateLong(result.pilotExclusivityExpiresAt)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt style={{ display: "inline", color: "var(--k-t2)" }}>
                    Correo del dueño:
                  </dt>{" "}
                  <dd style={{ display: "inline", margin: 0 }}>
                    {result.ownerEmail}
                  </dd>
                </div>
              </dl>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--k-t2)",
                  margin: "16px 0 0",
                  lineHeight: 1.5,
                }}
              >
                Siguiente paso: mándale el enlace de acceso desde{" "}
                <code
                  style={{
                    fontFamily: "var(--k-font-display)",
                    background: "var(--k-elevated)",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  /login
                </code>{" "}
                con su correo, o invita en bloque a sus atletas.
              </p>
            </>
          ) : (
            <>
              <h3
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 15,
                  fontWeight: 700,
                  margin: "0 0 8px",
                  color: "var(--k-danger)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <X size={17} strokeWidth={2.6} aria-hidden />
                {result.error}
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--k-t1)" }}>
                {result.message}
              </p>
            </>
          )}
        </div>
      )}
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        borderBottom: "1px solid var(--k-line)",
        paddingBottom: 8,
      }}
    >
      <dt style={{ color: "var(--k-t3)", fontSize: 13 }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          textAlign: "right",
          color: "var(--k-t1)",
          fontWeight: 600,
        }}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
