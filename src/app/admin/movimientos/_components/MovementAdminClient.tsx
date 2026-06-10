"use client";

import { useState, useTransition } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  updateMovementVideoUrl,
  restoreStandardMovement,
  getMovementById,
} from "@/server/actions/movements";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
import type { MovementRow, MovementDetail } from "@/server/actions/movements";
import MovementContentEditor from "@/components/admin/MovementContentEditor";

const CATEGORY_LABELS: Record<string, string> = {
  OLYMPIC: "Olímpicos",
  STRENGTH: "Fuerza",
  GYMNASTICS: "Gimnasia",
  MONOSTRUCTURAL: "Cardio",
  ACCESSORY: "Accesorio",
};

const CATEGORIES = [
  { key: "ALL", label: "Todos" },
  { key: "STRENGTH", label: "Fuerza" },
  { key: "GYMNASTICS", label: "Gimnasia" },
  { key: "OLYMPIC", label: "Olímpico" },
  { key: "MONOSTRUCTURAL", label: "Cardio" },
  { key: "ACCESSORY", label: "Accesorio" },
];

export default function MovementAdminClient({
  movements,
}: {
  movements: MovementRow[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editorDetail, setEditorDetail] = useState<MovementDetail | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);

  function openContentEditor(movementId: string) {
    setEditorLoading(true);
    void getMovementById(movementId)
      .then((d) => {
        if (d) setEditorDetail(d);
        setEditorLoading(false);
      })
      .catch(() => setEditorLoading(false));
  }

  const selected = movements.find((m) => m.id === selectedId);

  const filtered = movements.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.slug.includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "ALL" || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
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
            placeholder="Buscar movimiento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-[var(--card)] border border-[var(--line)] focus:outline-none focus:border-[var(--k-t2)] text-text placeholder:text-text-3"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2"
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

        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeCategory === cat.key
                  ? "bg-[var(--k-elevated)] text-text border border-[var(--k-line-2)]"
                  : "text-text-3 hover:text-text-2"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-text-3 font-mono uppercase tracking-wider mb-3">
        {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="text-left p-3 text-text-3 font-mono text-[10px] uppercase tracking-wider w-16">
                Miniatura
              </th>
              <th className="text-left p-3 text-text-3 font-mono text-[10px] uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left p-3 text-text-3 font-mono text-[10px] uppercase tracking-wider">
                Categoría
              </th>
              <th className="text-left p-3 text-text-3 font-mono text-[10px] uppercase tracking-wider">
                Estado
              </th>
              <th className="w-16 p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {filtered.map((m) => {
              const videoId = extractYouTubeId(m.videoUrl);
              const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null;
              const isOverridden = !!m.videoUrl && !m.isStandard;

              return (
                <tr
                  key={m.id}
                  className="hover:bg-[var(--k-elevated)] transition-colors cursor-pointer group"
                  onClick={() => openEdit(m)}
                >
                  <td className="p-3">
                    <div className="w-12 h-8 rounded-lg bg-[var(--k-surface)] overflow-hidden border border-[var(--line)]">
                      {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnail}
                          alt={m.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--k-t3)"
                            strokeWidth="1.5"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm font-medium text-text truncate">
                      {m.name}
                    </div>
                    <div className="text-[10px] text-text-3 truncate">
                      {m.slug}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-[11px] text-text-2">
                      {CATEGORY_LABELS[m.category] ?? m.category}
                    </span>
                  </td>
                  <td className="p-3">
                    {isOverridden ? (
                      <span className="k-chip k-chip-strain text-[9px] py-0.5 px-1.5">
                        Override
                      </span>
                    ) : (
                      <span className="k-chip k-chip-ghost text-[9px] py-0.5 px-1.5">
                        Estándar
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-text-3 group-hover:text-text-2 transition-colors"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="k-card p-10 text-center mt-4">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-text-2">
            No encontramos movimientos con &quot;{search}&quot;
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {selectedId && selected && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeEdit();
            }}
          >
            <m.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 bg-[var(--card)] border border-[var(--line)]"
            >
              <h2 className="font-display text-lg font-bold text-text mb-1">
                {selected.name}
              </h2>
              <p className="text-[11px] text-text-3 mb-4">
                {selected.isStandard ? "Movimiento estándar" : "Personalizado"}
                {" · "}
                {CATEGORY_LABELS[selected.category]}
              </p>

              {/* Current video preview */}
              {selected.videoUrl && (
                <div
                  className="rounded-xl overflow-hidden mb-4 border border-[var(--line)]"
                  style={{
                    aspectRatio: "16/9",
                    background: "var(--k-surface)",
                  }}
                >
                  <iframe
                    src={selected.videoUrl}
                    title={selected.name}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}

              <label className="block text-[11px] font-mono font-bold tracking-wider text-text-3 uppercase mb-1.5">
                URL del video (YouTube embed)
              </label>
              <input
                type="url"
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--k-elevated)] border border-[var(--line)] focus:outline-none focus:border-[var(--k-t2)] text-text placeholder:text-text-3 mb-4"
              />

              <AnimatePresence>
                {message && (
                  <m.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`text-[12px] mb-3 font-semibold ${
                      message.includes("Error")
                        ? "text-[var(--k-warning)]"
                        : "text-[var(--k-accent)]"
                    }`}
                  >
                    {message}
                  </m.p>
                )}
              </AnimatePresence>

              <div className="flex gap-2 flex-wrap">
                <m.button
                  onClick={handleSave}
                  disabled={isPending}
                  className="k-btn-grad flex-1 py-2.5 text-sm font-semibold disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isPending ? "Guardando..." : "Guardar video"}
                </m.button>
                <m.button
                  type="button"
                  onClick={() => openContentEditor(selected.id)}
                  disabled={isPending || editorLoading}
                  className="k-btn-ghost px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {editorLoading ? "Cargando..." : "Editar contenido AI"}
                </m.button>
                {selected.isStandard && (
                  <m.button
                    onClick={handleRestore}
                    disabled={isPending}
                    className="k-btn-ghost px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 14L4 9l5-5" />
                      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                    </svg>
                    Restaurar
                  </m.button>
                )}
                <button
                  onClick={closeEdit}
                  className="k-btn-ghost px-4 py-2.5 text-sm text-text-3 hover:text-text-2"
                >
                  Cerrar
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {editorDetail && (
        <MovementContentEditor
          movementId={editorDetail.id}
          movementName={editorDetail.name}
          contentSource={editorDetail.contentSource}
          initialJson={{
            cues: editorDetail.cues,
            commonMistakes: editorDetail.commonMistakes,
            progressions: editorDetail.progressions,
            musclesWorked: editorDetail.musclesWorked,
            difficulty: editorDetail.difficulty,
          }}
          onClose={() => setEditorDetail(null)}
        />
      )}
    </>
  );
}
