"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { m, AnimatePresence } from "framer-motion";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
import type { MovementRow } from "@/server/actions/movements";

/** Thumbnail card — shows the YouTube thumbnail and falls back to a branded
 *  placeholder for broken video IDs. Handles both failure modes: a hard 404
 *  (onError) and YouTube's 120x90 gray "no thumbnail" image served with a 200
 *  (detected on load via naturalWidth).                                       */
function MovementThumbnail({ src, name }: { src: string; name: string }) {
  const [broken, setBroken] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const initial = name.charAt(0).toUpperCase();

  // Catch images that finished loading before React attached the handlers
  // (cached responses), including YouTube's 120x90 gray placeholder (HTTP 200).
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && (img.naturalWidth === 0 || img.naturalWidth <= 120)) {
      setBroken(true);
    }
  }, []);

  if (broken) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-1"
        style={{ background: "var(--k-surface)" }}
      >
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--k-t3)",
            lineHeight: 1,
          }}
        >
          {initial}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--k-t3)"
          strokeWidth="1.5"
          style={{ opacity: 0.5 }}
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={name}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
      onError={() => setBroken(true)}
      onLoad={(e) => {
        // YouTube serves a 120x90 gray placeholder (HTTP 200) for video IDs
        // with no real thumbnail. A valid hqdefault is 480x360.
        if (e.currentTarget.naturalWidth <= 120) setBroken(true);
      }}
    />
  );
}

type Category =
  | "ALL"
  | "STRENGTH"
  | "GYMNASTICS"
  | "OLYMPIC"
  | "MONOSTRUCTURAL"
  | "ACCESSORY";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "STRENGTH", label: "Fuerza" },
  { key: "GYMNASTICS", label: "Gimnasia" },
  { key: "OLYMPIC", label: "Olímpico" },
  { key: "MONOSTRUCTURAL", label: "Cardio" },
  { key: "ACCESSORY", label: "Accesorio" },
];

function categoryChipClass(cat: string): string {
  switch (cat) {
    case "STRENGTH":
      return "k-chip-steel";
    case "GYMNASTICS":
      return "k-chip-moss";
    case "OLYMPIC":
      return "bg-gradient-to-r from-[var(--k-accent)] to-[var(--k-warning)] text-white border-transparent";
    case "MONOSTRUCTURAL":
      return "k-chip-amber";
    case "ACCESSORY":
      return "k-chip-ghost";
    default:
      return "k-chip-ghost";
  }
}

function categoryGlow(cat: string): string {
  switch (cat) {
    case "STRENGTH":
      return "rgba(100,116,139,0.25)";
    case "GYMNASTICS":
      return "rgba(74,124,89,0.25)";
    case "OLYMPIC":
      return "rgba(220,75,23,0.25)";
    case "MONOSTRUCTURAL":
      return "rgba(217,119,6,0.25)";
    default:
      return "rgba(255,255,255,0.06)";
  }
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    STRENGTH: "Fuerza",
    GYMNASTICS: "Gimnasia",
    OLYMPIC: "Olímpico",
    MONOSTRUCTURAL: "Cardio",
    ACCESSORY: "Accesorio",
  };
  return map[cat] ?? cat;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function MovementCatalog({
  movements,
}: {
  movements: MovementRow[];
}) {
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = movements;
    if (activeCategory !== "ALL") {
      result = result.filter((mv) => mv.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((mv) => mv.name.toLowerCase().includes(q));
    }
    return result;
  }, [movements, activeCategory, search]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--k-t3)]"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle
              cx="7"
              cy="7"
              r="5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M11 11L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar movimiento..."
            className="w-full bg-[var(--k-elevated)] text-[var(--text)] text-sm rounded-xl pl-10 pr-4 py-2.5 border border-[var(--line)] placeholder:text-[var(--k-t3)] focus:outline-none focus:border-[var(--k-t2)] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--k-t3)] hover:text-[var(--k-t2)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2L12 12M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeCategory === cat.key
                  ? "text-[var(--text)]"
                  : "text-[var(--k-t3)] hover:text-[var(--k-t2)]"
              }`}
            >
              {activeCategory === cat.key && (
                <m.div
                  layoutId="movement-cat-pill"
                  className="absolute inset-0 bg-[var(--k-elevated)] border border-[var(--k-line-2)] rounded-full"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-[11px] text-[var(--k-t3)] font-mono uppercase tracking-wider">
        {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <m.div
          key={activeCategory + search}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {filtered.map((mv) => {
            const videoId = extractYouTubeId(mv.videoUrl);
            const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null;

            return (
              <m.div key={mv.id} variants={item} layout>
                <Link
                  href={`/atleta/movimientos/${mv.id}` as Route}
                  className="group block"
                >
                  <m.div
                    className="rounded-xl border border-[var(--line)] bg-[var(--card)] overflow-hidden"
                    whileHover={{
                      scale: 1.03,
                      boxShadow: `0 8px 32px ${categoryGlow(mv.category)}`,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-[var(--k-surface)] overflow-hidden">
                      {thumbnail ? (
                        <MovementThumbnail src={thumbnail} name={mv.name} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <span
                            style={{
                              fontFamily: "var(--k-font-display)",
                              fontSize: 28,
                              fontWeight: 700,
                              color: "var(--k-t3)",
                              lineHeight: 1,
                            }}
                          >
                            {mv.name.charAt(0).toUpperCase()}
                          </span>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--k-t3)"
                            strokeWidth="1.5"
                            style={{ opacity: 0.5 }}
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <m.div
                          className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          whileHover={{ scale: 1.1 }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="var(--bg)"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </m.div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-[13px] font-semibold text-[var(--text)] truncate">
                        {mv.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`k-chip text-[9px] py-0.5 px-1.5 ${categoryChipClass(mv.category)}`}
                        >
                          {categoryLabel(mv.category)}
                        </span>
                        {mv.equipment.length > 0 && (
                          <span className="text-[10px] text-[var(--k-t3)] truncate">
                            {mv.equipment.slice(0, 2).join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </m.div>
                </Link>
              </m.div>
            );
          })}
        </m.div>
      </AnimatePresence>

      {/* Empty state */}
      {filtered.length === 0 && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="k-card p-8 text-center"
        >
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-[var(--k-t2)]">
            No encontramos movimientos con &quot;{search}&quot;
          </p>
          <p className="text-xs text-[var(--k-t3)] mt-1">
            Prueba con otro término o cambia el filtro de categoría
          </p>
        </m.div>
      )}
    </div>
  );
}
