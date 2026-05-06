"use client";

import dynamic from "next/dynamic";

export type { CapabilityCategory } from "./CapabilityRadar.impl";

export const CapabilityRadar = dynamic(
  () => import("./CapabilityRadar.impl").then((m) => m.CapabilityRadar),
  {
    ssr: false,
    loading: () => (
      <div
        className="k-skeleton rounded-xl"
        style={{ height: 280, width: "100%" }}
      />
    ),
  },
);
