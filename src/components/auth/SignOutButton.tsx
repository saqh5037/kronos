"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";

type Variant = "compact" | "menu" | "danger";

export function SignOutButton({
  variant = "menu",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-[var(--card-2)] disabled:opacity-50 ${className ?? ""}`}
        style={{ color: "var(--text-2)" }}
      >
        <LogOutIcon />
      </button>
    );
  }

  if (variant === "danger") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${className ?? ""}`}
        style={{
          background: "var(--pr-soft)",
          color: "var(--pr)",
          border: "1px solid var(--pr-line)",
        }}
      >
        <LogOutIcon />
        {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
    );
  }

  // menu
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--card-2)] disabled:opacity-50 ${className ?? ""}`}
      style={{ color: "var(--text-2)" }}
    >
      <LogOutIcon />
      <span>{isPending ? "Cerrando sesión…" : "Cerrar sesión"}</span>
    </button>
  );
}

function LogOutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
