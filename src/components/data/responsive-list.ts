/**
 * Column spec + pure column→card mapping behind `<ResponsiveList/>`
 * (audit 2026-09-15, P0 #4/#5: `/admin/reservas` and `/admin/pagos` clip columns
 * at 360 — Monto/Estado/Adeudo and even athlete names never render).
 *
 * The table and the stacked row cards are driven by the SAME spec so a column can
 * never exist in one and be missing from the other.
 */
import type { ReactNode } from "react";

export type ColumnAlign = "left" | "center" | "right";

export interface ColumnSpec<T> {
  /** Stable identity; also the row key read when `render` is omitted. */
  key: string;
  /** Header text and, on the card, the field label. */
  label: string;
  render?: (row: T) => ReactNode;
  align?: ColumnAlign;
  /**
   * The one column that identifies the row (athlete name, class time). It becomes
   * the card title instead of a label/value pair. First column wins if unset.
   */
  primary?: boolean;
  /** Keep out of the stacked card (row checkboxes, drag handles). */
  hideOnCard?: boolean;
}

export interface CardField {
  key: string;
  label: string;
  value: ReactNode;
  align: ColumnAlign;
}

export interface CardModel {
  /** Card title, from the primary column. */
  title: { key: string; label: string; value: ReactNode } | null;
  /** Everything else, in column order. */
  fields: CardField[];
}

function readCell<T>(column: ColumnSpec<T>, row: T): ReactNode {
  if (column.render) return column.render(row);
  const value = (row as Record<string, unknown>)[column.key];
  if (value === null || value === undefined) return "—";
  return value as ReactNode;
}

/** Index of the column that titles the card, or -1 when there is none. */
export function primaryColumnIndex<T>(columns: ColumnSpec<T>[]): number {
  const cardable = columns.filter((c) => !c.hideOnCard);
  if (cardable.length === 0) return -1;
  const flagged = columns.findIndex((c) => c.primary && !c.hideOnCard);
  if (flagged >= 0) return flagged;
  return columns.indexOf(cardable[0]);
}

/** One row → one stacked card: a title plus label/value fields in column order. */
export function toCardModel<T>(columns: ColumnSpec<T>[], row: T): CardModel {
  const titleIndex = primaryColumnIndex(columns);
  const titleColumn = titleIndex >= 0 ? columns[titleIndex] : null;

  return {
    title: titleColumn
      ? {
          key: titleColumn.key,
          label: titleColumn.label,
          value: readCell(titleColumn, row),
        }
      : null,
    fields: columns
      .filter((c, i) => !c.hideOnCard && i !== titleIndex)
      .map((c) => ({
        key: c.key,
        label: c.label,
        value: readCell(c, row),
        align: c.align ?? "left",
      })),
  };
}

export function toCardModels<T>(
  columns: ColumnSpec<T>[],
  rows: T[],
): CardModel[] {
  return rows.map((row) => toCardModel(columns, row));
}
