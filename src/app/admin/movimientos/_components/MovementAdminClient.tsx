"use client";

import { useState, useTransition } from "react";
import {
  updateMovementVideoUrl,
  restoreStandardMovement,
} from "@/server/actions/movements";
import type { MovementRow } from "@/server/actions/movements";

const CATEGORY_LABELS: Record<string, string> = {
  OLYMPIC: "Olímpicos",
  STRENGTH: "Fuerza",
  GYMNASTICS: "Gimnasia",
  MONOSTRUCTURAL: "Cardio",
  ACCESSORY: "Accesorio",
};

export default function MovementAdminClient({
  movements,
}: {
  movements: MovementRow[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const selected = movements.find((m) => m.id === selectedId);

  const filtered = movements.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.slug.includes(search.toLowerCase()),
  );

  const grouped = Object.entries(CATEGORY_LABELS).reduce(
    (acc, [cat, label]) => {
      const items = filtered.filter((m) => m.category === cat);
      if (items.length > 0) acc.push({ cat, label, items });
      return acc;
    },
    [] as { cat: string; label: string; items: MovementRow[] }[],
  );

  function openEdit(m: MovementRow) {
    setSelectedId(m.id);
    setEditVideoUrl(m.videoUrl ?? "");
    setMessage(null);
  }

  function closeEdit() {
    setSelectedId(null);
    setMessage(null);
  }

  function handleSave() {
    if (!selectedId) return;
    startTransition(async () => {
      try {
        await updateMovementVideoUrl(selectedId, editVideoUrl);
        setMessage("Video actualizado correctamente");
        setTimeout(closeEdit, 1200);
      } catch {
        setMessage("Error al guardar");
      }
    });
  }

  function handleRestore() {
    if (!selectedId) return;
    startTransition(async () => {
      try {
        await restoreStandardMovement(selectedId);
        setMessage("Video restaurado al estándar");
        setTimeout(closeEdit, 1200);
      } catch {
        setMessage("Error al restaurar");
      }
    });
  }

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar movimiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-[10px] text-sm bg-[var(--card)] border border-[var(--line)] focus:outline-none focus:border-[var(--strain)]"
          style={{ color: "var(--text)" }}
        />
      </div>

      {/* Grouped list */}
      <div className="space-y-6">
        {grouped.map(({ cat, label, items }) => (
          <div key={cat}>
            <p
              className="font-mono text-[10px] font-bold tracking-[0.14em] mb-2"
              style={{ color: "var(--text-3)" }}
            >
              {label.toUpperCase()} · {items.length}
            </p>
            <div className="k-card overflow-hidden">
              {items.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-subtle)] transition-colors cursor-pointer"
                  style={{
                    borderBottom:
                      i < items.length - 1 ? "1px solid var(--line)" : "none",
                  }}
                  onClick={() => openEdit(m)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {m.name}
                    </div>
                    <div
                      className="text-[10px] truncate"
                      style={{ color: "var(--text-3)" }}
                    >
                      {m.slug}
                    </div>
                  </div>
                  {m.videoUrl ? (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--moss-soft)",
                        color: "var(--moss)",
                      }}
                    >
                      Video
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--ember-soft)",
                        color: "var(--ember)",
                      }}
                    >
                      Sin video
                    </span>
                  )}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "var(--text-3)", flexShrink: 0 }}
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {selectedId && selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div
            className="w-full max-w-md rounded-t-[20px] sm:rounded-[16px] p-6"
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
            }}
          >
            <h2 className="font-display text-lg font-bold mb-1">
              {selected.name}
            </h2>
            <p className="text-[11px] mb-4" style={{ color: "var(--text-3)" }}>
              {selected.isStandard ? "Movimiento estándar" : "Personalizado"} ·{" "}
              {CATEGORY_LABELS[selected.category]}
            </p>

            {/* Current video preview */}
            {selected.videoUrl && (
              <div
                className="rounded-[10px] overflow-hidden mb-4"
                style={{ aspectRatio: "16/9", background: "var(--bg-soft)" }}
              >
                <iframe
                  src={selected.videoUrl}
                  title={selected.name}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}

            <label
              className="block text-[11px] font-bold mb-1"
              style={{ color: "var(--text-2)" }}
            >
              URL del video (YouTube embed)
            </label>
            <input
              type="url"
              value={editVideoUrl}
              onChange={(e) => setEditVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              className="w-full px-3 py-2 rounded-[10px] text-sm mb-4 bg-[var(--bg-soft)] border border-[var(--line)] focus:outline-none focus:border-[var(--strain)]"
              style={{ color: "var(--text)" }}
            />

            {message && (
              <p
                className="text-[12px] mb-3 font-semibold"
                style={{
                  color: message.includes("Error")
                    ? "var(--ember)"
                    : "var(--moss)",
                }}
              >
                {message}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="k-btn-grad flex-1 py-2.5 text-sm font-semibold rounded-[10px]"
              >
                {isPending ? "Guardando..." : "Guardar"}
              </button>
              {selected.isStandard && (
                <button
                  onClick={handleRestore}
                  disabled={isPending}
                  className="k-btn-ghost px-4 py-2.5 text-sm font-semibold rounded-[10px]"
                >
                  Restaurar
                </button>
              )}
              <button
                onClick={closeEdit}
                className="k-btn-ghost px-4 py-2.5 text-sm font-semibold rounded-[10px]"
                style={{ color: "var(--text-3)" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
