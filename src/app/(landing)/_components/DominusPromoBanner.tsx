import Link from "next/link";
import {
  isDominusPromoActive,
  promoDaysLeft,
  PROMO_EVENT_DATE,
} from "@/lib/dominus-promo";

export default function DominusPromoBanner() {
  if (!isDominusPromoActive()) return null;
  const days = promoDaysLeft();

  return (
    <Link
      href="/founding-dominus"
      className="block w-full transition-opacity hover:opacity-90"
      style={{
        background:
          "linear-gradient(90deg, #c8ff2d 0%, #a8d726 50%, #c8ff2d 100%)",
        color: "#08080a",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 md:gap-4 text-center text-xs md:text-sm">
        <span
          className="font-mono uppercase tracking-wider font-bold hidden sm:inline"
          style={{ letterSpacing: "0.08em" }}
        >
          {days === 1 ? "Último día" : `${days} días`}
        </span>
        <span className="font-bold hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <span className="font-medium leading-tight">
          <strong>Founding Box Dominus</strong> · lock-in 12 meses + 3 meses
          gratis al anual · {PROMO_EVENT_DATE}
        </span>
        <span className="font-bold underline whitespace-nowrap">
          Ver oferta →
        </span>
      </div>
    </Link>
  );
}
