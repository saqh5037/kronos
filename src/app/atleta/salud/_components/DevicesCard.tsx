/**
 * Dispositivos — the honest state of the Whoop integration.
 *
 * Audit 2026-09-15 asked for a card that either connects a wearable for real or
 * says plainly that it does not exist yet. `/api/wearables/whoop/connect` is
 * shipped, so this is a real OAuth entry point plus a read-only status; the
 * recovery/readiness surface on top of that data is a later phase and is not
 * promised here.
 */

import { Watch } from "lucide-react";
import {
  getMyWearableConnections,
  type WearableSummary,
} from "@/server/actions/wearables";
import { wearableProviderLabel, wearableStatusLabel } from "@/lib/labels";
import { formatDateShort } from "@/lib/format";

/**
 * `bare` drops the section margin/heading so Ajustes can place the same card
 * inside its own section instead of shipping a second connect button.
 */
export async function DevicesCard({ bare = false }: { bare?: boolean } = {}) {
  const connections = await getMyWearableConnections().catch(
    () => [] as WearableSummary[],
  );
  const whoop = connections.find((c) => c.provider === "WHOOP") ?? null;

  return (
    <section style={bare ? undefined : { margin: "0 16px 20px" }}>
      {!bare && (
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
            marginBottom: 8,
            paddingLeft: 4,
          }}
        >
          Dispositivos
        </div>
      )}

      <div
        style={{
          padding: 16,
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line)",
          borderRadius: 14,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <Watch
          size={22}
          strokeWidth={1.8}
          aria-hidden
          color={whoop ? "var(--k-accent)" : "var(--k-t3)"}
          style={{ flexShrink: 0, marginTop: 2 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--k-t1)",
            }}
          >
            {wearableProviderLabel.WHOOP}
          </div>

          {whoop ? (
            <>
              <div
                className="k-mono"
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color:
                    whoop.status === "CONNECTED"
                      ? "var(--k-accent)"
                      : whoop.status === "ERROR"
                        ? "var(--k-danger)"
                        : "var(--k-warning)",
                }}
              >
                {wearableStatusLabel[whoop.status]}
              </div>
              <p
                style={{
                  margin: "6px 0 0",
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: "var(--k-t2)",
                  lineHeight: 1.45,
                }}
              >
                {whoop.lastSyncedAt
                  ? `Última sincronización: ${formatDateShort(new Date(whoop.lastSyncedAt))}.`
                  : "Aún sin sincronizar."}
              </p>
              {whoop.status !== "CONNECTED" && (
                <ConnectLink label="Reconectar Whoop" />
              )}
            </>
          ) : (
            <>
              <p
                style={{
                  margin: "6px 0 0",
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: "var(--k-t2)",
                  lineHeight: 1.45,
                }}
              >
                Conecta tu Whoop para traer tus datos de sueño y recuperación a
                Kronos.
              </p>
              <ConnectLink label="Conectar Whoop" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ConnectLink({ label }: { label: string }) {
  return (
    <a
      href="/api/wearables/whoop/connect"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        minHeight: 44,
        padding: "11px 18px",
        borderRadius: 10,
        background: "var(--k-accent)",
        color: "var(--k-accent-on)",
        fontFamily: "var(--k-font-display)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        textDecoration: "none",
      }}
    >
      {label}
    </a>
  );
}

export function DevicesCardSkeleton() {
  return (
    <section style={{ margin: "0 16px 20px" }}>
      <div
        className="k-card k-skeleton"
        style={{ height: 120, borderRadius: 14 }}
      />
    </section>
  );
}
