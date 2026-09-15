import { describe, it, expect } from "vitest";
import {
  initialPushState,
  resolvePushState,
  nextPushState,
  type PushStatus,
} from "@/components/atleta/PushSubscribeButton";

/**
 * Regression guard for the `/atleta/perfil` hydration failure
 * (technical-audit.md §C, root cause `PushSubscribeButton.tsx:7-16`).
 *
 * The component used to seed `useState` straight from `Notification.permission`
 * / `"serviceWorker" in navigator`, so the server rendered "idle" while the
 * client's FIRST render produced "subscribed" / "denied" / "unsupported".
 * React then discarded and regenerated the whole subtree on the heaviest
 * athlete page.
 *
 * The fix splits the logic in two pure pieces:
 *  - `initialPushState()` — the SSR/first-client-render seed. MUST be constant.
 *  - `resolvePushState(env)` — the post-mount resolution, driven by an explicit
 *    capability snapshot instead of reading globals during render.
 */
describe("initialPushState (SSR seed)", () => {
  it('is always "idle" so server HTML and first client render agree', () => {
    expect(initialPushState()).toBe("idle");
  });

  it("is deterministic across calls and ignores ambient globals", () => {
    const g = globalThis as Record<string, unknown>;
    const hadNotification = "Notification" in g;
    g.Notification = { permission: "granted" };
    try {
      expect(initialPushState()).toBe("idle");
      expect(initialPushState()).toBe(initialPushState());
    } finally {
      if (!hadNotification) delete g.Notification;
    }
  });
});

describe("resolvePushState (post-mount capability snapshot)", () => {
  it('returns "unsupported" when the Notification API is missing', () => {
    expect(
      resolvePushState({
        hasNotification: false,
        hasServiceWorker: true,
        permission: null,
      }),
    ).toBe("unsupported");
  });

  it('returns "unsupported" when service workers are missing', () => {
    expect(
      resolvePushState({
        hasNotification: true,
        hasServiceWorker: false,
        permission: "granted",
      }),
    ).toBe("unsupported");
  });

  it('returns "subscribed" when permission is already granted', () => {
    expect(
      resolvePushState({
        hasNotification: true,
        hasServiceWorker: true,
        permission: "granted",
      }),
    ).toBe("subscribed");
  });

  it('returns "denied" when permission is denied', () => {
    expect(
      resolvePushState({
        hasNotification: true,
        hasServiceWorker: true,
        permission: "denied",
      }),
    ).toBe("denied");
  });

  it('returns "idle" when permission is still "default"', () => {
    expect(
      resolvePushState({
        hasNotification: true,
        hasServiceWorker: true,
        permission: "default",
      }),
    ).toBe("idle");
  });

  it('treats a missing permission value as "idle" when APIs exist', () => {
    expect(
      resolvePushState({
        hasNotification: true,
        hasServiceWorker: true,
        permission: null,
      }),
    ).toBe("idle");
  });
});

describe("nextPushState (subscribe state machine)", () => {
  it('moves idle -> requesting on "request"', () => {
    expect(nextPushState("idle", "request")).toBe("requesting");
  });

  it('ignores "request" from any non-idle state (no double submit)', () => {
    const blocked: PushStatus[] = [
      "requesting",
      "subscribed",
      "denied",
      "unsupported",
    ];
    for (const from of blocked) {
      expect(nextPushState(from, "request")).toBe(from);
    }
  });

  it("resolves requesting -> subscribed / denied / idle", () => {
    expect(nextPushState("requesting", "granted")).toBe("subscribed");
    expect(nextPushState("requesting", "rejected")).toBe("denied");
    expect(nextPushState("requesting", "error")).toBe("idle");
  });

  it("never resurrects an unsupported browser", () => {
    expect(nextPushState("unsupported", "granted")).toBe("unsupported");
    expect(nextPushState("unsupported", "rejected")).toBe("unsupported");
    expect(nextPushState("unsupported", "error")).toBe("unsupported");
  });

  it("is idempotent for resolution events fired outside a request", () => {
    expect(nextPushState("subscribed", "granted")).toBe("subscribed");
    expect(nextPushState("denied", "rejected")).toBe("denied");
    expect(nextPushState("idle", "error")).toBe("idle");
  });
});
