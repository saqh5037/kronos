"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

export default function AnalyticsProvider() {
  useEffect(() => {
    if (initialized || typeof window === "undefined") return;
    if (!POSTHOG_KEY) return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,
      persistence: "localStorage",
      person_profiles: "identified_only",
    });
    initialized = true;
  }, []);

  return null;
}
