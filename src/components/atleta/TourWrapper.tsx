"use client";

import dynamic from "next/dynamic";

const SpotlightTour = dynamic(() => import("./SpotlightTour"), {
  ssr: false,
});

export default function TourWrapper() {
  return <SpotlightTour />;
}
