"use client";

type Tab = "subs" | "invoices";

type Props = {
  active: Tab;
};

export function TabNav({ active }: Props) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "subs", label: "Suscripciones" },
    { key: "invoices", label: "Historial de pagos" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 20,
        borderBottom: "1px solid var(--k-line)",
        paddingBottom: 0,
      }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <a
            key={t.key}
            href={`?tab=${t.key}`}
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 13,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? "var(--k-accent)" : "var(--k-t2)",
              padding: "10px 16px",
              textDecoration: "none",
              borderBottom: isActive
                ? "2px solid var(--k-accent)"
                : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.15s",
            }}
          >
            {t.label}
          </a>
        );
      })}
    </div>
  );
}
