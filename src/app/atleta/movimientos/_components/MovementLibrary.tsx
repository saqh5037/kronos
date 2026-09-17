"use client";

/**
 * Movement library — the page, not an appendix.
 *
 * Audit 2026-09-15 (`/atleta/movimientos`): 6,210 px stitching two products
 * vertically, with search and category chips 1,500 px down, after 14 ranked
 * rows. The library is now the page and "entrenados" is one of the filters.
 *
 * Also fixed here:
 *  - thumbnails: no white stills, no blank cards, no console 404. A card only
 *    requests an image when `thumbnailUrlFor` proves the id, and falls back to
 *    a lucide tile on error or on YouTube's 120×90 gray filler.
 *  - category chips: monochrome lime at varying opacity instead of the orange /
 *    yellow-orange / lime / gray taxonomy the audit called decorative colour.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Dumbbell, Search, X } from "lucide-react";
import type { MovementCategory } from "@prisma/client";
import { movementCategoryLabel } from "@/lib/labels";
import { isPlaceholderThumbnail, thumbnailUrlFor } from "@/lib/youtube";
import { useMovementCatalog } from "@/lib/query/useMovementCatalog";
import type { MovementRow } from "@/server/actions/movements";
import type { RankedMovement } from "@/server/analytics/movement";
import { equipmentLabels } from "../_lib/movement-i18n";

type Filter = "TRAINED" | "ALL" | MovementCategory;

const CATEGORY_ORDER: MovementCategory[] = [
  "STRENGTH",
  "GYMNASTICS",
  "OLYMPIC",
  "MONOSTRUCTURAL",
  "ACCESSORY",
];

type Props = {
  tenantId: string;
  userId: string;
  initialCatalog: MovementRow[];
  trained: RankedMovement[];
};

export default function MovementLibrary({
  tenantId,
  userId,
  initialCatalog,
  trained,
}: Props) {
  const { data } = useMovementCatalog({
    tenantId,
    userId,
    initialData: initialCatalog,
  });
  const catalog = data ?? initialCatalog;

  const [filter, setFilter] = useState<Filter>(
    trained.length > 0 ? "TRAINED" : "ALL",
  );
  const [search, setSearch] = useState("");

  const trainedById = useMemo(
    () => new Map(trained.map((t) => [t.movementId, t])),
    [trained],
  );

  const filtered = useMemo(() => {
    let rows = catalog;

    if (filter === "TRAINED") {
      rows = rows.filter((m) => trainedById.has(m.id));
    } else if (filter !== "ALL") {
      rows = rows.filter((m) => m.category === filter);
    }

    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((m) => m.name.toLowerCase().includes(q));

    if (filter === "TRAINED") {
      return [...rows].sort(
        (a, b) =>
          (trainedById.get(b.id)?.frequency90d ?? 0) -
          (trainedById.get(a.id)?.frequency90d ?? 0),
      );
    }
    return rows;
  }, [catalog, filter, search, trainedById]);

  const chips: { key: Filter; label: string; disabled?: boolean }[] = [
    {
      key: "TRAINED",
      label: `Entrenados (${trained.length})`,
      disabled: trained.length === 0,
    },
    { key: "ALL", label: "Todos" },
    ...CATEGORY_ORDER.map((c) => ({
      key: c as Filter,
      label: movementCategoryLabel[c],
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Search first — it is the fastest path through 52 cards. */}
      <div style={{ position: "relative" }}>
        <Search
          size={16}
          aria-hidden
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--k-t3)",
          }}
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar movimiento"
          aria-label="Buscar movimiento"
          style={{
            width: "100%",
            minHeight: 44,
            padding: "10px 40px 10px 38px",
            borderRadius: 12,
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line)",
            color: "var(--k-t1)",
            fontFamily: "var(--k-font-body)",
            fontSize: 14,
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Limpiar búsqueda"
            style={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              width: 40,
              height: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: "var(--k-t3)",
              cursor: "pointer",
            }}
          >
            <X size={16} aria-hidden />
          </button>
        )}
      </div>

      <div
        data-tour="movimientos.lista-personal"
        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
      >
        {chips.map((chip) => (
          <FilterChip
            key={String(chip.key)}
            label={chip.label}
            active={filter === chip.key}
            disabled={chip.disabled}
            onClick={() => setFilter(chip.key)}
          />
        ))}
      </div>

      <p
        className="k-mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {filtered.length} {filtered.length === 1 ? "movimiento" : "movimientos"}
      </p>

      {filtered.length === 0 ? (
        <div className="k-card" style={{ padding: 24, textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              color: "var(--k-t2)",
              margin: 0,
            }}
          >
            {filter === "TRAINED"
              ? "Aún no registras scores. Entrena y tus movimientos aparecen aquí."
              : "No encontramos movimientos con ese filtro."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((mv, i) => (
            <MovementCard
              key={mv.id}
              movement={mv}
              trained={trainedById.get(mv.id) ?? null}
              isFirst={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="k-tap"
      style={{
        minHeight: 36,
        padding: "8px 14px",
        borderRadius: 999,
        fontFamily: "var(--k-font-display)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        // Monochrome: the active chip is lime, the rest are the same lime at a
        // lower opacity through the border/text tokens. No category colours.
        background: active ? "var(--k-accent)" : "transparent",
        color: active ? "var(--k-accent-on)" : "var(--k-t2)",
        border: `1px solid ${active ? "var(--k-accent)" : "var(--k-line-2)"}`,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}

function MovementCard({
  movement,
  trained,
  isFirst,
}: {
  movement: MovementRow;
  trained: RankedMovement | null;
  isFirst?: boolean;
}) {
  const equipment = equipmentLabels(movement.equipment).slice(0, 2);

  return (
    <Link
      {...(isFirst ? { "data-tour": "movimientos.card-movimiento" } : {})}
      href={`/atleta/movimientos/${movement.id}` as Route}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        className="k-card"
        style={{ overflow: "hidden", padding: 0, height: "100%" }}
      >
        <MovementThumbnail videoUrl={movement.videoUrl} name={movement.name} />
        <div style={{ padding: 12 }}>
          <h3
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--k-t1)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {movement.name}
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            <CategoryChip category={movement.category} />
            {equipment.length > 0 && (
              <span
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 10,
                  color: "var(--k-t3)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {equipment.join(" · ")}
              </span>
            )}
          </div>
          {trained && (
            <div
              className="k-mono"
              style={{
                marginTop: 8,
                fontSize: 10,
                letterSpacing: 1,
                color: "var(--k-t2)",
              }}
            >
              {trained.currentBest !== null
                ? `${trained.currentBest}${trained.unit ? ` ${trained.unit}` : ""} · ${trained.frequency90d}×`
                : `${trained.frequency90d}× EN 90D`}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Category as one brand colour at a fixed opacity — "opacity for intensity",
 * never a second hue. `movementCategoryLabel` keeps the enum out of the UI.
 */
function CategoryChip({ category }: { category: MovementCategory }) {
  return (
    <span
      className="k-mono"
      style={{
        fontSize: 9,
        letterSpacing: 1,
        padding: "2px 7px",
        borderRadius: 999,
        color: "var(--k-accent)",
        background: "var(--k-accent-soft)",
        border: "1px solid var(--k-accent-line)",
        opacity: 0.85,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {movementCategoryLabel[category]}
    </span>
  );
}

function MovementThumbnail({
  videoUrl,
  name,
}: {
  videoUrl: string | null;
  name: string;
}) {
  const src = thumbnailUrlFor(videoUrl);
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div
        aria-hidden="true"
        style={{
          aspectRatio: "16 / 9",
          display: "grid",
          placeItems: "center",
          background: "var(--k-surface)",
          borderBottom: "1px solid var(--k-line)",
          color: "var(--k-t3)",
        }}
      >
        <Dumbbell size={26} strokeWidth={1.6} />
      </div>
    );
  }

  return (
    <div
      style={{
        aspectRatio: "16 / 9",
        overflow: "hidden",
        background: "var(--k-surface)",
        borderBottom: "1px solid var(--k-line)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Miniatura de ${name}`}
        loading="lazy"
        onError={() => setBroken(true)}
        onLoad={(e) => {
          if (isPlaceholderThumbnail(e.currentTarget.naturalWidth)) {
            setBroken(true);
          }
        }}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}
