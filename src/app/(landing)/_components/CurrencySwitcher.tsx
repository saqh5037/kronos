"use client";

import { CURRENCY_LABELS, FX_RATES, type CurrencyCode } from "../_data/mock";

type Props = {
  value: CurrencyCode;
  onChange: (next: CurrencyCode) => void;
};

const ORDER: CurrencyCode[] = ["MXN", "USD", "COP", "ARS", "PEN"];

export default function CurrencySwitcher({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Cambiar moneda"
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        borderRadius: 999,
        border: "1px solid var(--k-line)",
        background: "var(--k-surface)",
      }}
    >
      {ORDER.map((code) => {
        const active = code === value;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(code)}
            className="lp-mono"
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              background: active ? "var(--k-accent)" : "transparent",
              color: active ? "var(--k-accent-on, #08080A)" : "var(--k-t2)",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
          >
            {CURRENCY_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}

// Helper: convierte un precio MXN string ($2,000) a la moneda destino.
// Devuelve string formateado con el símbolo correcto, sin decimales para MXN/COP/ARS,
// con dos decimales para USD/PEN.
export function convertPriceFromMXN(
  priceMXN: string,
  to: CurrencyCode,
): { value: string; symbol: string } {
  const symbol = {
    MXN: "$",
    USD: "US$",
    COP: "$",
    ARS: "$",
    PEN: "S/",
  }[to];

  if (to === "MXN") {
    return { value: priceMXN.replace(/^\$/, ""), symbol };
  }

  // Parse "$2,000" → 2000
  const numeric = Number(priceMXN.replace(/[$,]/g, ""));
  if (!Number.isFinite(numeric)) {
    return { value: priceMXN, symbol };
  }

  const rate = FX_RATES.rates[to];
  const converted = numeric * rate;

  const decimals = to === "USD" || to === "PEN" ? 0 : 0;
  const formatted = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.round(converted));

  return { value: formatted, symbol };
}
