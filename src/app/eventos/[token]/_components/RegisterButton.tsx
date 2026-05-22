"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { registerToEvent } from "@/server/actions/events";

type Props = {
  token: string;
};

export default function RegisterButton({ token }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await registerToEvent(token);
        router.push(`/atleta/eventos/${res.eventSlug}` as Route);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos completar la inscripción",
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="k-btn-grad w-full disabled:opacity-60"
      >
        {pending ? "Inscribiendo…" : "Inscribirme al evento"}
      </button>
      {error ? (
        <p
          className="text-sm text-center"
          style={{ color: "var(--k-danger)" }}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
