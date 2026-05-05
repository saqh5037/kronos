"use client";

import { useRouter } from "next/navigation";

type Props = {
  count: number;
};

export default function Step3Confirm({ count }: Props) {
  const router = useRouter();

  return (
    <div className="k-card p-8 max-w-md mx-auto text-center space-y-6">
      <div className="text-5xl">✅</div>

      <div>
        <h2 className="text-2xl font-display font-bold text-white">
          {count} score{count !== 1 ? "s" : ""} guardado{count !== 1 ? "s" : ""}
        </h2>
        <p className="text-white/60 text-sm mt-2">
          Los atletas recibirán una notificación en la app. Los PRs fueron
          detectados y registrados automáticamente.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => router.push(`/admin/asistencia`)}
          className="k-btn-grad py-3 text-sm font-semibold"
        >
          Ver asistencia
        </button>
        <button
          onClick={() => router.push(`/admin/leaderboards`)}
          className="k-btn-ghost py-3 text-sm"
        >
          Ver leaderboard
        </button>
      </div>
    </div>
  );
}
