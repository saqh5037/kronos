"use client";

import { useEffect } from "react";
import { incrementVisit } from "@/lib/pwa-visits";

/**
 * Side-effect only: incrementa visit count del atleta para gatear el banner
 * de instalación PWA. TTL de 30 min entre visitas para no contar refresh.
 */
export default function VisitTracker() {
  useEffect(() => {
    incrementVisit();
  }, []);
  return null;
}
