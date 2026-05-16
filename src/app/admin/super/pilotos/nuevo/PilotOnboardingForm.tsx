"use client";

import { useState, useTransition } from "react";
import {
  createPilotBox,
  type PilotOnboardingResult,
} from "@/server/actions/pilot-onboarding";
import {
  PILOT_DISCIPLINE_SLUGS,
  type PilotDisciplineSlug,
} from "@/lib/validations/pilot-onboarding";

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

export function PilotOnboardingForm({
  disciplines,
}: {
  disciplines: DisciplineOption[];
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PilotOnboardingResult | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createPilotBox({
        ...form,
        trialDurationDays: Number(form.trialDurationDays),
        exclusivityDays: Number(form.exclusivityDays),
      });
      setResult(res);
      if (res.ok) {
        setForm(INITIAL);
      }
    });
  }

  const fieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  return (
    <form onSubmit={handleSubmit} aria-labelledby="form-title">
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

      {/* Owner */}
      <section style={SECTION_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Owner del Box</h2>
        <div style={FIELD_BLOCK}>
          <label htmlFor="email" style={LABEL_STYLE}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            style={INPUT_STYLE}
            placeholder="owner@boxhyrox.mx"
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
          </label>
          <input
            id="ownerName"
            type="text"
            required
            value={form.ownerName}
            onChange={(e) => update("ownerName", e.target.value)}
            style={INPUT_STYLE}
            placeholder="María Pérez"
          />
        </div>
      </section>

      {/* Box */}
      <section style={SECTION_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Box</h2>
        <div style={FIELD_BLOCK}>
          <label htmlFor="boxName" style={LABEL_STYLE}>
            Nombre del Box
          </label>
          <input
            id="boxName"
            type="text"
            required
            value={form.boxName}
            onChange={(e) => update("boxName", e.target.value)}
            style={INPUT_STYLE}
            placeholder="Hyrox Studio Polanco"
          />
        </div>
        <div style={FIELD_BLOCK}>
          <label htmlFor="slug" style={LABEL_STYLE}>
            Slug (URL — solo minúsculas, números, guiones)
          </label>
          <input
            id="slug"
            type="text"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            style={INPUT_STYLE}
            placeholder="hyrox-polanco"
          />
          {fieldErrors.slug && (
            <p style={{ color: "var(--k-danger)", fontSize: 13, marginTop: 6 }}>
              {fieldErrors.slug}
            </p>
          )}
        </div>
      </section>

      {/* Disciplina + Geo */}
      <section style={SECTION_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Disciplina + Geo</h2>
        <div style={FIELD_BLOCK}>
          <label htmlFor="disciplineSlug" style={LABEL_STYLE}>
            Disciplina
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
                {d.name} ({d.slug})
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
            </label>
            <input
              id="city"
              type="text"
              required
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              style={INPUT_STYLE}
              placeholder="Ciudad de México"
            />
          </div>
          <div>
            <label htmlFor="country" style={LABEL_STYLE}>
              País (ISO)
            </label>
            <input
              id="country"
              type="text"
              required
              maxLength={2}
              value={form.country}
              onChange={(e) => update("country", e.target.value.toUpperCase())}
              style={INPUT_STYLE}
              placeholder="MX"
            />
          </div>
        </div>
        <div style={FIELD_BLOCK}>
          <label htmlFor="region" style={LABEL_STYLE}>
            Región / Estado (opcional)
          </label>
          <input
            id="region"
            type="text"
            value={form.region}
            onChange={(e) => update("region", e.target.value)}
            style={INPUT_STYLE}
            placeholder="CDMX"
          />
        </div>
      </section>

      {/* Configuración piloto */}
      <section style={SECTION_STYLE}>
        <h2 style={SECTION_TITLE_STYLE}>Configuración piloto</h2>
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
              Trial (días)
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
              Exclusividad geográfica (días)
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
            Feature flags
          </legend>
          <label
            style={{
              display: "flex",
              alignItems: "center",
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
            />
            <span>
              <strong>hyrox</strong> — UI de stations + race format (auto-on si
              disciplina=hyrox)
            </span>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
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
            />
            <span>
              <strong>mm_athlete</strong> — atletas pueden tener múltiples
              memberships (F2)
            </span>
          </label>
        </fieldset>
      </section>

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          padding: "14px 24px",
          fontFamily: "var(--k-font-display)",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.04em",
          background: pending ? "var(--k-line-2)" : "var(--k-accent)",
          color: "var(--k-accent-on)",
          border: "none",
          borderRadius: 10,
          cursor: pending ? "wait" : "pointer",
          marginTop: 8,
        }}
      >
        {pending ? "Creando piloto…" : "Crear Box piloto"}
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
                }}
              >
                ✓ Box piloto creado
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
                    Slug:
                  </dt>{" "}
                  <dd
                    style={{
                      display: "inline",
                      margin: 0,
                      fontFamily: "var(--k-font-display)",
                    }}
                  >
                    {result.slug}
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
                    Trial termina:
                  </dt>{" "}
                  <dd style={{ display: "inline", margin: 0 }}>
                    {result.trialEndsAt.toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                {result.pilotExclusivityExpiresAt && (
                  <div>
                    <dt style={{ display: "inline", color: "var(--k-t2)" }}>
                      Exclusividad expira:
                    </dt>{" "}
                    <dd style={{ display: "inline", margin: 0 }}>
                      {result.pilotExclusivityExpiresAt.toLocaleDateString(
                        "es-MX",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </dd>
                  </div>
                )}
                <div>
                  <dt style={{ display: "inline", color: "var(--k-t2)" }}>
                    Owner email:
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
                Próximo paso: enviar magic link al owner desde{" "}
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
                con su email, o crear AthleteInvitation masiva para sus atletas.
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
                }}
              >
                ✘ {result.error}
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
