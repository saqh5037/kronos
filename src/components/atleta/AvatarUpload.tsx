"use client";

import { useRef, useState, useTransition } from "react";
import {
  uploadAtletaAvatar,
  removeAtletaAvatar,
} from "@/server/actions/atleta-avatar";
import { kToast } from "@/lib/toast";

type Props = {
  initialPhotoUrl: string | null;
  initials: string;
  size?: number;
  showRemove?: boolean;
  onChange?: (url: string | null) => void;
};

const MAX_BYTES = 5 * 1024 * 1024;

export default function AvatarUpload({
  initialPhotoUrl,
  initials,
  size = 88,
  showRemove = true,
  onChange,
}: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      kToast.error("Solo aceptamos JPG, PNG o WEBP");
      return;
    }
    if (file.size > MAX_BYTES) {
      kToast.error("La imagen no puede superar 5 MB");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const r = await uploadAtletaAvatar(fd);
      if (!r.ok) {
        kToast.error(r.message);
        return;
      }
      setPhotoUrl(r.photoUrl);
      onChange?.(r.photoUrl);
      kToast.success("Foto actualizada");
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const r = await removeAtletaAvatar();
      if (!r.ok) {
        kToast.error(r.message);
        return;
      }
      setPhotoUrl(null);
      onChange?.(null);
      kToast.success("Foto eliminada");
    });
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        aria-label="Cambiar foto de perfil"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--k-elevated)",
          border: "1.5px solid var(--k-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--k-font-display)",
          fontSize: Math.round(size * 0.36),
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--k-accent)",
          boxShadow: "var(--k-accent-glow)",
          overflow: "hidden",
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.6 : 1,
          padding: 0,
          backgroundImage: photoUrl ? `url(${photoUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {photoUrl ? null : initials}
      </button>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="text-xs font-mono uppercase tracking-wider text-left disabled:opacity-50"
          style={{ color: "var(--k-accent)", letterSpacing: "0.05em" }}
        >
          {pending
            ? "Subiendo…"
            : photoUrl
              ? "Cambiar foto"
              : "Subir foto"}
        </button>
        {photoUrl && showRemove ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="text-[11px] font-mono uppercase tracking-wider text-left disabled:opacity-50"
            style={{ color: "var(--k-t3)", letterSpacing: "0.05em" }}
          >
            Eliminar
          </button>
        ) : null}
        <p className="text-[10px]" style={{ color: "var(--k-t3)" }}>
          JPG/PNG/WEBP · máx 5 MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSelect(file);
          e.target.value = ""; // reset para permitir re-upload del mismo file
        }}
      />
    </div>
  );
}
