"use client";

import { useState, useTransition } from "react";
import { updateBox, type BoxSettings } from "@/server/actions/box";
import {
  SUPPORTED_LOCALES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_TIMEZONES,
} from "@/lib/validations/box";
import { LogoUpload } from "@/components/admin/LogoUpload";

type Props = {
  box: BoxSettings;
  canEdit: boolean;
};

export default function BoxSettingsForm({ box, canEdit }: Props) {
  const [name, setName] = useState(box.name);
  const [locale, setLocale] = useState(box.locale);
  const [currency, setCurrency] = useState(box.currency);
  const [timezone, setTimezone] = useState(box.timezone);
  const [defaultClassCapacity, setDefaultClassCapacity] = useState(
    String(box.defaultClassCapacity),
  );
  const [brandColor, setBrandColor] = useState(box.brandColor ?? "#4a7c59");
  const [logoUrl, setLogoUrl] = useState(box.logoUrl ?? "");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateBox({
          name,
          locale,
          currency,
          timezone,
          defaultClassCapacity,
          brandColor,
          logoUrl,
        });
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Identidad */}
      <section className="k-card p-5">
        <p className="k-eyebrow mb-4">Identidad del box</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
              disabled={!canEdit}
              className={inputClass}
            />
          </Field>

          <Field label="Slug (URL pública)">
            <input
              type="text"
              value={box.slug}
              readOnly
              className={`${inputClass} opacity-60 cursor-not-allowed`}
            />
          </Field>

          <Field label="Color de marca">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={!canEdit}
                className="w-12 h-10 rounded-lg border cursor-pointer disabled:cursor-not-allowed"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--card)",
                }}
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#4a7c59"
                disabled={!canEdit}
                pattern="^#[0-9a-fA-F]{6}$"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
          </Field>

          <Field label="Logo">
            {canEdit ? (
              <LogoUpload
                currentUrl={logoUrl || null}
                onUploaded={(url) => setLogoUrl(url)}
              />
            ) : logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="w-20 h-20 rounded-xl object-contain"
                style={{ background: "var(--k-surface)" }}
              />
            ) : (
              <span className="text-xs" style={{ color: "var(--k-t3)" }}>
                Sin logo configurado
              </span>
            )}
          </Field>
        </div>
      </section>

      {/* Operación */}
      <section className="k-card p-5">
        <p className="k-eyebrow mb-4">Operación</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Idioma">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
            >
              {SUPPORTED_LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Moneda">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Zona horaria">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
            >
              {SUPPORTED_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Capacidad default por clase">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={200}
              value={defaultClassCapacity}
              onChange={(e) => setDefaultClassCapacity(e.target.value)}
              disabled={!canEdit}
              required
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {error && (
        <p className="text-sm" style={{ color: "var(--k-danger)" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm" style={{ color: "var(--k-accent)" }}>
          Ajustes guardados correctamente.
        </p>
      )}

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="k-btn-grad px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}
      {!canEdit && (
        <p className="text-xs" style={{ color: "var(--k-t2)" }}>
          Solo el OWNER del box puede modificar estos ajustes.
        </p>
      )}
    </form>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg text-sm border bg-transparent text-text focus:outline-none focus:border-recovery/50 disabled:opacity-60";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-xs uppercase tracking-wider"
        style={{ color: "var(--k-t2)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
