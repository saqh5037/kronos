import type { ReactNode } from "react";
import { TourProvider } from "@/components/tour/TourProvider";
import { TourAutoStart } from "@/components/tour/TourAutoStart";

/**
 * Subtle fade-in/up on route transitions. CSS-only on purpose: depending on
 * framer-motion `initial={{ opacity: 0 }}` left the content invisible when the
 * client chunk failed to hydrate (same class of bug as the PageTransition
 * hotfix `10df47f`). CSS keyframes run from the server-rendered markup, so
 * if the JS chunk never lands the content still becomes visible.
 */
export default function AtletaTemplate({ children }: { children: ReactNode }) {
  return (
    <TourProvider>
      <TourAutoStart />
      <div className="k-fade-in-up">{children}</div>
    </TourProvider>
  );
}
