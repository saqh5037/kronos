import Link from "next/link";
import type { Route } from "next";

type Props = {
  href: Route;
  label: string;
};

export default function AthleteBackLink({ href, label }: Props) {
  return (
    <Link
      href={href}
      aria-label={`Volver a ${label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 12px 12px 0",
        marginLeft: -4,
        color: "var(--k-t2)",
        textDecoration: "none",
        fontFamily: "var(--k-font-display)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        minHeight: 44,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={18}
        height={18}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
