"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { clearQueryCacheAndStorage } from "@/components/providers/QueryProvider";

type Props = {
  callbackUrl: string;
  /** userId is passed from the server component so we avoid useSession() here
   *  (the /logout page has no SessionProvider in its layout tree). */
  userId?: string;
};

export default function LogoutClient({ callbackUrl, userId }: Props) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      // Clear IndexedDB device cache BEFORE signing out so the next user
      // cannot restore cached data belonging to the current user.
      if (userId) {
        await clearQueryCacheAndStorage(userId);
      }
      await signOut({ callbackUrl, redirect: true });
    } catch {
      setPending(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
      }}
    >
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
        style={{ background: "var(--k-accent-soft)" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--k-accent)" }}
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </div>

      <h2 className="font-display font-bold text-xl mb-2">¿Cerrar sesión?</h2>
      <p
        className="text-sm mb-6"
        style={{ color: "var(--k-t2)", lineHeight: 1.5 }}
      >
        Vas a salir de tu cuenta. Puedes volver a entrar en cualquier momento
        con tu correo.
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={pending}
          className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
        >
          {pending ? "Cerrando sesión…" : "Sí, cerrar sesión"}
        </button>
        <a
          href={callbackUrl === "/" ? "/atleta" : callbackUrl}
          className="text-sm py-2"
          style={{ color: "var(--k-t2)" }}
        >
          Cancelar
        </a>
      </div>
    </div>
  );
}
