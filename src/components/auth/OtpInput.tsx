"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Input de OTP de 6 dígitos. Diseñado para autofill nativo:
 *  - iOS Mail/Messages detecta códigos en mails recientes y ofrece autocompletar
 *    arriba del teclado (input con autocomplete="one-time-code", inputMode="numeric")
 *  - Android SMS Retriever (no aplica aquí porque venimos por email, pero el
 *    atributo no molesta)
 *
 * Acepta paste de "123 456" o "123-456" o "123456" — normaliza a 6 dígitos.
 * Dispara onComplete al alcanzar 6 dígitos sin necesidad de botón submit.
 */

type Props = {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [didFire, setDidFire] = useState(false);

  // Auto-focus on mount (mobile-friendly, abre el teclado).
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Disparar onComplete cuando alcanzamos 6 dígitos. Reset si vuelve a <6.
  useEffect(() => {
    if (value.length === 6 && !didFire && onComplete) {
      setDidFire(true);
      onComplete(value);
    }
    if (value.length < 6 && didFire) {
      setDidFire(false);
    }
  }, [value, didFire, onComplete]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Normalizar: solo dígitos, max 6
    const cleaned = raw.replace(/\D/g, "").slice(0, 6);
    onChange(cleaned);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    const cleaned = text.replace(/\D/g, "").slice(0, 6);
    if (cleaned.length > 0) {
      e.preventDefault();
      onChange(cleaned);
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder="• • • • • •"
        className="w-full text-center font-display font-bold rounded-xl py-4 px-3 outline-none transition-all"
        style={{
          fontSize: "32px",
          letterSpacing: "0.4em",
          paddingLeft: "0.4em",
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line-2)",
          color: "var(--k-t1)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--k-accent-line)";
          e.currentTarget.style.boxShadow = "var(--k-accent-glow)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--k-line-2)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <p
        className="text-center text-[11px] font-mono uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        6 dígitos del email
      </p>
    </div>
  );
}
