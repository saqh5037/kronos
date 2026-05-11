import type { ReactNode } from "react";

/**
 * Subtle fade-in/up on route transitions. CSS-only on purpose: depending on
 * framer-motion `initial={{ opacity: 0 }}` left the content invisible when the
 * client chunk failed to hydrate (same class of bug as the PageTransition
 * hotfix `10df47f`). CSS keyframes run from the server-rendered markup, so
 * if the JS chunk never lands the content still becomes visible.
 */
export default function AtletaTemplate({ children }: { children: ReactNode }) {
  return <div className="k-fade-in-up">{children}</div>;
}
