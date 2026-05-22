export type TourPlacement = "top" | "bottom" | "left" | "right" | "auto";

export type TourStep = {
  anchor: string;
  title: string;
  body: string;
  placement?: TourPlacement;
  spotlightPadding?: number;
};

export type TourDefinition = {
  id: string;
  storageKey: string;
  steps: TourStep[];
};

export type TourState = {
  activeTour: TourDefinition | null;
  stepIndex: number;
};
