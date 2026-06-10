import { Suspense } from "react";
import { SaludContent, SaludContentSkeleton } from "./_components/SaludContent";

export const metadata = { title: "Kronos — Salud" };
export const dynamic = "force-dynamic";

export default function SaludPage() {
  return (
    <Suspense fallback={<SaludContentSkeleton />}>
      <SaludContent />
    </Suspense>
  );
}
