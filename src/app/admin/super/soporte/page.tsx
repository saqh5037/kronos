import { db as prismaBase } from "@/server/db";
import { getActiveSupportSession } from "@/server/actions/support";
import { CodeEntryForm } from "./_components/CodeEntryForm";
import { SupportBoxView } from "./_components/SupportBoxView";

export const metadata = {
  title: "Soporte · Kronos super-admin",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SoportePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params: SearchParams = searchParams ? await searchParams : {};
  const wasExpired = params["expired"] === "1";

  const session = await getActiveSupportSession();

  // No active session → show code entry form
  if (!session) {
    return (
      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "48px 24px",
          color: "var(--k-t1)",
        }}
      >
        <PageHeader />
        <CodeEntryForm expiredSession={wasExpired} />
      </main>
    );
  }

  // Active session → fetch extra box info for the view
  const box = await prismaBase.box.findUnique({
    where: { id: session.boxId },
    select: {
      slug: true,
      subscriptionStatus: true,
      users: {
        where: { role: "OWNER" },
        select: { email: true },
        take: 1,
      },
      _count: { select: { athletes: true } },
    },
  });

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "48px 24px",
        color: "var(--k-t1)",
      }}
    >
      <PageHeader />
      <SupportBoxView
        session={session}
        boxSlug={box?.slug ?? "—"}
        subscriptionStatus={box?.subscriptionStatus ?? "—"}
        athleteCount={box?._count.athletes ?? 0}
        ownerEmail={box?.users[0]?.email ?? null}
      />
    </main>
  );
}

function PageHeader() {
  return (
    <header style={{ marginBottom: 32 }}>
      <p
        className="k-eyebrow mb-2"
        style={{ color: "var(--k-warning)", letterSpacing: "0.15em" }}
      >
        SUPER-ADMIN · SOPORTE
      </p>
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: "clamp(24px, 3.5vw, 36px)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--k-t1)",
          margin: "8px 0 8px",
          lineHeight: 1.1,
        }}
      >
        Sesión de soporte
      </h1>
      <p
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 14,
          color: "var(--k-t2)",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        Ingresa el código que te dio el cliente para abrir una sesión de soporte
        acotada a su box.
      </p>
    </header>
  );
}
