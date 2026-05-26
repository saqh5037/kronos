import type { Metadata } from "next";
import { ConfirmProvider } from "@/lib/use-confirm";
import {
  getPlatformBillingKpis,
  listAllSubscriptionsCrossTenant,
  listAllInvoicesCrossTenant,
  listSaasPlansForSuper,
} from "@/server/actions/super-billing";
import { BillingKpiRow } from "./_components/BillingKpiRow";
import { SubscriptionsTable } from "./_components/SubscriptionsTable";
import { InvoicesSection } from "./_components/InvoicesSection";
import { TabNav } from "./_components/TabNav";

export const metadata: Metadata = {
  title: "Pagos · Kronos super-admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE_SUBS = 10;
const PAGE_SIZE_INVOICES = 20;

type Tab = "subs" | "invoices";

type SearchParams = {
  tab?: string;
  page?: string;
  invPage?: string;
  status?: string;
  planId?: string;
  q?: string;
};

export default async function SuperPagosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeTab: Tab = params.tab === "invoices" ? "invoices" : "subs";
  const subPage = Math.max(1, Number(params.page ?? 1) || 1);
  const invPage = Math.max(1, Number(params.invPage ?? 1) || 1);

  // Fetch all data in parallel
  const [kpis, subsResult, invoicesResult, plans] = await Promise.allSettled([
    getPlatformBillingKpis(),
    listAllSubscriptionsCrossTenant({
      page: subPage,
      pageSize: PAGE_SIZE_SUBS,
      status: params.status || undefined,
      planId: params.planId || undefined,
      q: params.q || undefined,
    }),
    listAllInvoicesCrossTenant({
      page: invPage,
      pageSize: PAGE_SIZE_INVOICES,
    }),
    listSaasPlansForSuper(),
  ]);

  // Error state — any critical fetch failed
  if (kpis.status === "rejected") {
    return (
      <main style={mainStyle}>
        <PageHeader />
        <div
          className="k-card"
          style={{
            padding: 48,
            textAlign: "center",
            background: "var(--k-elevated)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--k-danger)",
              marginBottom: 8,
            }}
          >
            No pudimos cargar los datos de pagos
          </p>
          <p style={{ fontSize: 13, color: "var(--k-t2)", marginBottom: 20 }}>
            Ocurrió un error al conectar con la base de datos. Intenta de nuevo
            en un momento.
          </p>
          <a
            href="/admin/super/pagos"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--k-accent)",
              background: "var(--k-accent-soft)",
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--k-accent-line)",
              textDecoration: "none",
            }}
          >
            Reintentar
          </a>
        </div>
      </main>
    );
  }

  const resolvedKpis = kpis.value;
  const resolvedSubs =
    subsResult.status === "fulfilled"
      ? subsResult.value
      : { rows: [], total: 0 };
  const resolvedInvoices =
    invoicesResult.status === "fulfilled"
      ? invoicesResult.value
      : { rows: [], total: 0 };
  const resolvedPlans = plans.status === "fulfilled" ? plans.value : [];

  // Neutral state — no subs and no invoices at all (brand new platform)
  const isEmpty = resolvedSubs.total === 0 && resolvedInvoices.total === 0;

  return (
    <ConfirmProvider>
      <main style={mainStyle}>
        <PageHeader />

        {/* KPI row */}
        <BillingKpiRow kpis={resolvedKpis} />

        {isEmpty ? (
          <div
            className="k-card"
            style={{
              padding: 64,
              textAlign: "center",
              background: "var(--k-elevated)",
              borderColor: "var(--k-line-2)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--k-t1)",
                marginBottom: 8,
              }}
            >
              Sin actividad de facturación
            </p>
            <p style={{ fontSize: 14, color: "var(--k-t2)" }}>
              La plataforma aún no tiene suscripciones ni facturas registradas.
              Las suscripciones aparecerán aquí en cuanto los boxes contraten un
              plan.
            </p>
          </div>
        ) : (
          <section>
            <TabNav active={activeTab} />

            {activeTab === "subs" && (
              <SubscriptionsTable
                rows={resolvedSubs.rows}
                total={resolvedSubs.total}
                page={subPage}
                pageSize={PAGE_SIZE_SUBS}
                plans={resolvedPlans}
              />
            )}

            {activeTab === "invoices" && (
              <InvoicesSection
                rows={resolvedInvoices.rows}
                total={resolvedInvoices.total}
                page={invPage}
                pageSize={PAGE_SIZE_INVOICES}
              />
            )}
          </section>
        )}
      </main>
    </ConfirmProvider>
  );
}

const mainStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "48px 24px",
  color: "var(--k-t1)",
};

function PageHeader() {
  return (
    <header style={{ marginBottom: 32 }}>
      <p
        className="lp-eyebrow"
        style={{ color: "var(--k-accent)", letterSpacing: "0.22em" }}
      >
        <span className="lp-dot" />
        SUPER-ADMIN · PAGOS
      </p>
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--k-t1)",
          margin: "12px 0 8px",
          lineHeight: 1.1,
        }}
      >
        Pagos
      </h1>
      <p
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 15,
          color: "var(--k-t2)",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        Gestión de suscripciones SaaS y facturación cross-tenant. Los pagos
        manuales (transferencia/efectivo) se registran desde aquí. Cancelaciones
        locales no afectan a MercadoPago.
      </p>
    </header>
  );
}
