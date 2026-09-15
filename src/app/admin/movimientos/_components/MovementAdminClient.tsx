"use client";

import { useState, useTransition } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Dumbbell, Pencil, RotateCcw, Search, SearchX, X } from "lucide-react";
import {
  updateMovementVideoUrl,
  restoreStandardMovement,
  getMovementById,
} from "@/server/actions/movements";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
import type { MovementRow, MovementDetail } from "@/server/actions/movements";
import { label, movementCategoryLabel } from "@/lib/labels";
import MovementContentEditor from "@/components/admin/MovementContentEditor";

const CATEGORIES = [
  { key: "ALL", label: "Todos" },
  { key: "STRENGTH", label: movementCategoryLabel.STRENGTH },
  { key: "GYMNASTICS", label: movementCategoryLabel.GYMNASTICS },
  { key: "OLYMPIC", label: movementCategoryLabel.OLYMPIC },
  { key: "MONOSTRUCTURAL", label: movementCategoryLabel.MONOSTRUCTURAL },
  { key: "ACCESSORY", label: movementCategoryLabel.ACCESSORY },
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
  const [onlyWithoutVideo, setOnlyWithoutVideo] = useState(false);
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});
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
    const matchesVideo = !onlyWithoutVideo || !m.videoUrl;
    return matchesSearch && matchesCategory && matchesVideo;
  });

  const withoutVideoCount = movements.filter((m) => !m.videoUrl).length;

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
          <Search
            size={16}
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--k-t2)]"
          />
          <input
            type="text"
            placeholder="Buscar movimiento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-xl text-sm bg-[var(--k-surface)] border border-[var(--k-line-2)] focus:outline-none focus:border-[var(--k-t2)] text-[var(--k-t1)] placeholder:text-[var(--k-t2)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--k-t2)] hover:text-[var(--k-t1)]"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              aria-pressed={activeCategory === cat.key}
              className={`min-h-11 px-3 text-xs font-medium rounded-full transition-colors ${
                activeCategory === cat.key
                  ? "bg-[var(--k-elevated)] text-[var(--k-t1)] border border-[var(--k-line-2)]"
                  : "text-[var(--k-t2)] hover:text-[var(--k-t1)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOnlyWithoutVideo((v) => !v)}
            aria-pressed={onlyWithoutVideo}
            className="min-h-11 rounded-full px-3 text-xs font-medium transition-colors"
            style={{
              background: onlyWithoutVideo
                ? "var(--k-accent-soft)"
                : "transparent",
              color: onlyWithoutVideo ? "var(--k-accent)" : "var(--k-t2)",
              border: `1px solid ${
                onlyWithoutVideo ? "var(--k-accent-line)" : "transparent"
              }`,
            }}
          >
            Sin video ({withoutVideoCount})
          </button>
        </div>
      </div>

      <p className="text-[11px] text-[var(--k-t2)] font-mono uppercase tracking-wider mb-3">
        {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--k-line)]">
              <th className="text-left p-3 text-[var(--k-t2)] font-mono text-[10px] uppercase tracking-wider w-16">
                Miniatura
              </th>
              <th className="text-left p-3 text-[var(--k-t2)] font-mono text-[10px] uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left p-3 text-[var(--k-t2)] font-mono text-[10px] uppercase tracking-wider">
                Categoría
              </th>
              <th className="text-left p-3 text-[var(--k-t2)] font-mono text-[10px] uppercase tracking-wider">
                Video
              </th>
              <th className="w-16 p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--k-line)]">
            {filtered.map((m) => {
              const videoId = extractYouTubeId(m.videoUrl);
              const thumbnail =
                videoId && !brokenThumbs[m.id]
                  ? getYouTubeThumbnail(videoId)
                  : null;
              const isOverridden = !!m.videoUrl && !m.isStandard;

              return (
                <tr
                  key={m.id}
                  className="hover:bg-[var(--k-elevated)] transition-colors cursor-pointer group"
                  onClick={() => openEdit(m)}
                >
                  <td className="p-3">
                    <div className="w-12 h-8 rounded-lg bg-[var(--k-elevated)] overflow-hidden border border-[var(--k-line)]">
                      {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() =>
                            setBrokenThumbs((prev) => ({
                              ...prev,
                              [m.id]: true,
                            }))
                          }
                        />
                      ) : (
                        // No thumbnail: a movement tile, not a grey "•••".
                        <div className="w-full h-full flex items-center justify-center text-[var(--k-t2)]">
                          <Dumbbell size={14} aria-hidden />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {/* The slug is developer information — it lives in the
                        edit form, not in the coach's table. */}
                    <div className="text-sm font-medium text-[var(--k-t1)] truncate">
                      {m.name}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-[11px] text-[var(--k-t2)]">
                      {label("movementCategory", m.category)}
                    </span>
                  </td>
                  <td className="p-3">
                    {isOverridden ? (
                      <span className="k-chip k-chip-moss text-[9px] py-0.5 px-1.5">
                        Video propio
                      </span>
                    ) : m.videoUrl ? (
                      <span className="text-[11px] text-[var(--k-t2)]">—</span>
                    ) : (
                      <span className="k-chip k-chip-ghost text-[9px] py-0.5 px-1.5">
                        Sin video
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      aria-label={`Editar ${m.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(m);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--k-t2)] transition-colors hover:bg-[var(--k-elevated)] hover:text-[var(--k-t1)]"
                    >
                      <Pencil size={16} aria-hidden />
                    </button>
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
          <SearchX
            size={28}
            aria-hidden
            className="mx-auto mb-2 text-[var(--k-t2)]"
          />
          <p className="text-sm text-[var(--k-t2)]">
            No encontramos movimientos con esos filtros.
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
              className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 bg-[var(--k-surface)] border border-[var(--k-line-2)]"
            >
              <h2 className="font-display text-lg font-bold text-[var(--k-t1)] mb-1">
                {selected.name}
              </h2>
              <p className="text-[11px] text-[var(--k-t2)] mb-4">
                {selected.isStandard ? "Movimiento estándar" : "Personalizado"}
                {" · "}
                {label("movementCategory", selected.category)}
                {" · "}
                <span className="font-mono">{selected.slug}</span>
              </p>

              {/* Current video preview */}
              {selected.videoUrl && (
                <div
                  className="rounded-xl overflow-hidden mb-4 border border-[var(--k-line)]"
                  style={{
                    aspectRatio: "16/9",
                    background: "var(--k-elevated)",
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

              <label className="block text-[11px] font-mono font-bold tracking-wider text-[var(--k-t2)] uppercase mb-1.5">
                URL del video (YouTube embed)
              </label>
              <input
                type="url"
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--k-elevated)] border border-[var(--k-line-2)] focus:outline-none focus:border-[var(--k-t2)] text-[var(--k-t1)] placeholder:text-[var(--k-t2)] mb-4"
              />

              <AnimatePresence>
                {message && (
                  <m.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] mb-3 font-semibold"
                    style={{
                      color: message.includes("Error")
                        ? "var(--k-danger)"
                        : "var(--k-accent)",
                    }}
                  >
                    {message}
                  </m.p>
                )}
              </AnimatePresence>

              <div className="flex gap-2 flex-wrap">
                <m.button
                  onClick={handleSave}
                  disabled={isPending}
                  className="k-btn-grad flex-1 min-h-11 py-2.5 text-sm font-semibold disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isPending ? "Guardando…" : "Guardar video"}
                </m.button>
                <m.button
                  type="button"
                  onClick={() => openContentEditor(selected.id)}
                  disabled={isPending || editorLoading}
                  className="k-btn-ghost min-h-11 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {editorLoading ? "Cargando…" : "Editar contenido"}
                </m.button>
                {selected.isStandard && (
                  <m.button
                    onClick={handleRestore}
                    disabled={isPending}
                    className="k-btn-ghost min-h-11 px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RotateCcw size={14} aria-hidden />
                    Restaurar
                  </m.button>
                )}
                <button
                  type="button"
                  onClick={closeEdit}
                  className="k-btn-ghost min-h-11 px-4 py-2.5 text-sm text-[var(--k-t2)] hover:text-[var(--k-t1)]"
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
