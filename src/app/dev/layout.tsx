import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Gate for the whole `/dev` surface.
 *
 * `/dev/charts-demo`, `/dev/skeletons-demo` and `/dev/toast-demo` are
 * design-system playgrounds, not product. The code inventory of 2026-09-15
 * flagged them as routable in production (two of them merely returned `null`,
 * which still answers 200 with an empty document). One gate here covers every
 * current and future child route, so nobody has to remember to add it.
 *
 * `force-dynamic` keeps the check at request time instead of letting the build
 * prerender these routes.
 */
export const dynamic = "force-dynamic";

export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <>{children}</>;
}
