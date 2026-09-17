"use client";

import { useEffect, useState } from "react";

type TocItem = { id: string; label: string };

export default function ManualTOC({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="atletas-toc" aria-label="Índice del manual">
      <div
        className="lp-caption"
        style={{
          color: "var(--k-t3)",
          marginBottom: 12,
          paddingLeft: 16,
          letterSpacing: "0.22em",
        }}
      >
        ÍNDICE
      </div>
      {/* Los chips de cada sección no decían para quién eran (audit
          2026-09-15). Esta es su leyenda, junto al índice. */}
      <p
        style={{
          fontFamily: "var(--k-font-body), Inter",
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--k-t3)",
          padding: "0 16px",
          margin: "0 0 16px",
        }}
      >
        Cada pantalla dice para quién es: <strong>Box personal</strong> si
        cargas tus propios WODs, <strong>Atleta de box</strong> si tu box usa
        Kronos, o <strong>Ambos</strong>.
      </p>
      <ul className="atletas-toc-list">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === activeId ? "true" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
