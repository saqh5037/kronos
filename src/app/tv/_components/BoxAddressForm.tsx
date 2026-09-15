"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { slugify } from "@/lib/slug";

/**
 * Campo para entrar a la pantalla del Box (audit 2026-09-15).
 *
 * El índice de /tv solo decía "/tv/<slug-del-box>" y esperaba que el dueño
 * supiera qué es un slug. Aquí escribe la dirección tal como la ve en su panel
 * y lo llevamos a su pantalla; normalizamos por si pega la URL completa.
 */
export default function BoxAddressForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const address = slugify(value.trim().replace(/^.*\/tv\//, ""));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    router.push(`/tv/${address}` as Route);
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm flex flex-col gap-3">
      <label
        htmlFor="box-address"
        className="k-eyebrow text-left"
        style={{ color: "var(--k-t3)" }}
      >
        Dirección de tu box
      </label>
      <div className="flex items-stretch gap-2">
        <input
          id="box-address"
          name="box"
          type="text"
          inputMode="url"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="iron-hands-polanco"
          className="flex-1 px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
          style={{
            background: "var(--k-surface)",
            borderColor: "var(--k-line-2)",
            color: "var(--k-t1)",
          }}
        />
        <button type="submit" disabled={!address} className="k-btn-grad px-5">
          Abrir
        </button>
      </div>
      <p className="text-xs text-left" style={{ color: "var(--k-t3)" }}>
        Es la misma que aparece en tu panel, en Ajustes del Box.
      </p>
    </form>
  );
}
