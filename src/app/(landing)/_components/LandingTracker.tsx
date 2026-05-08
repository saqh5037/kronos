"use client";

import { useEffect } from "react";
import { track } from "../_lib/track";

export default function LandingTracker() {
  useEffect(() => {
    track("landing_viewed");
  }, []);
  return null;
}
