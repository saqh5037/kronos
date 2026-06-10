import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { disconnect, ensureDemoAthleteOnboarded } from "./fixtures/db";

const HOME_TOUR_KEY = "kronos_tour_home_v1";

/**
 * Regression guard for the "tour keeps insisting" bug: dismissing the tour
 * (X / backdrop / Escape) used to NOT persist, so TourAutoStart re-triggered it
 * on every navigation. The fix persists the seen-flag on ANY dismissal.
 *
 * NOTA: TourAutoStart fue convertido a NO-OP (tours ahora son opt-in, se
 * lanzan vía TourTriggerButton "?"). El auto-start se deshabilitó porque
 * disparaba el tour inmediatamente después del onboarding y la persistencia
 * era poco confiable. El test de auto-start queda skipped hasta que se
 * decida si se vuelve a habilitar el auto-start o se adapta a opt-in.
 *
 * PRODUCT-BUG ref: TourAutoStart es intencional NO-OP (ver
 * src/components/tour/TourAutoStart.tsx).
 */
test.describe("athlete onboarding tour", () => {
  test.beforeEach(async () => {
    await ensureDemoAthleteOnboarded();
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test.skip(
    "does not reappear after being dismissed",
    async () => {
      // SKIPPED: TourAutoStart es NO-OP — tours son opt-in desde que se cambió
      // la UX. El auto-start ya no dispara en primera visita. Este test necesita
      // ser reescrito para disparar el tour manualmente via TourTriggerButton
      // o restaurar el auto-start. Ver atleta-tour.spec.ts comentarios superiores.
    },
  );
});
