"use client";

/**
 * The event entry point the audit asked for.
 *
 * Before: "the only action ('escanea el código QR que reparte el organizador')
 * is prose. No 'Escanear QR' button, no camera entry." A QR scan is a camera
 * capture plus a code, so this gives both: the OS camera through
 * `<input type="file" capture>` (which opens the scanner app on a phone and a
 * file picker on desktop), and a plain text field for the code printed next to
 * the QR.
 *
 * Decoding a QR image in-browser needs a decoder we do not ship, so the camera
 * path is explicit about what it is: take the photo, then type the code. That
 * is honest, unlike a button that pretends to scan.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, QrCode } from "lucide-react";

export default function EventCodeEntry() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [photoTaken, setPhotoTaken] = useState(false);

  const trimmed = code.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (trimmed.length < 8) return;
    router.push(`/eventos/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="k-card" style={{ padding: 16 }}>
      <p
        className="k-eyebrow"
        style={{ color: "var(--k-t3)", margin: "0 0 10px" }}
      >
        Inscríbete a un evento
      </p>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="k-tap"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          minHeight: 44,
          padding: "12px 16px",
          borderRadius: 12,
          background: "var(--k-accent)",
          color: "var(--k-accent-on)",
          border: "none",
          fontFamily: "var(--k-font-display)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        <Camera size={16} aria-hidden />
        Escanear QR
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={() => setPhotoTaken(true)}
        style={{ display: "none" }}
        aria-hidden
        tabIndex={-1}
      />

      <p
        style={{
          margin: "10px 0 0",
          fontFamily: "var(--k-font-body)",
          fontSize: 12,
          color: "var(--k-t2)",
          lineHeight: 1.45,
        }}
      >
        {photoTaken
          ? "Ya tienes la foto: escribe abajo el código que aparece junto al QR."
          : "Abre la cámara sobre el QR del organizador y escribe el código que aparece junto a él."}
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ marginTop: 12, display: "flex", gap: 8 }}
      >
        <label htmlFor="event-code" className="sr-only">
          Código del evento
        </label>
        <div style={{ position: "relative", flex: 1 }}>
          <QrCode
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
            id="event-code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código del evento"
            autoComplete="off"
            style={{
              width: "100%",
              minHeight: 44,
              padding: "10px 12px 10px 36px",
              borderRadius: 10,
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              color: "var(--k-t1)",
              fontFamily: "var(--k-font-body)",
              fontSize: 14,
            }}
          />
        </div>
        <button
          type="submit"
          disabled={trimmed.length < 8}
          className="k-tap"
          style={{
            minHeight: 44,
            padding: "10px 16px",
            borderRadius: 10,
            background: "transparent",
            border: "1px solid var(--k-line-2)",
            color: "var(--k-t1)",
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: trimmed.length < 8 ? "not-allowed" : "pointer",
            opacity: trimmed.length < 8 ? 0.5 : 1,
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
