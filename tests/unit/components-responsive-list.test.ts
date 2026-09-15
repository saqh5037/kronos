import { describe, it, expect } from "vitest";
import {
  primaryColumnIndex,
  toCardModel,
  toCardModels,
  type ColumnSpec,
} from "@/components/data/responsive-list";

type Row = { id: string; athlete: string; amount: number; status: string };

const rows: Row[] = [
  { id: "1", athlete: "Emma Soto", amount: 1200, status: "Pagado" },
  { id: "2", athlete: "Luis Rangel", amount: 0, status: "Pendiente" },
];

const columns: ColumnSpec<Row>[] = [
  { key: "athlete", label: "Atleta", primary: true },
  { key: "amount", label: "Monto", align: "right", render: (r) => `$${r.amount}` },
  { key: "status", label: "Estado" },
];

describe("primaryColumnIndex", () => {
  it("uses the flagged column", () => {
    expect(primaryColumnIndex(columns)).toBe(0);
  });

  it("falls back to the first cardable column when nothing is flagged", () => {
    const unflagged: ColumnSpec<Row>[] = [
      { key: "status", label: "Estado" },
      { key: "athlete", label: "Atleta" },
    ];
    expect(primaryColumnIndex(unflagged)).toBe(0);
  });

  it("skips card-hidden columns when picking the fallback", () => {
    const withCheckbox: ColumnSpec<Row>[] = [
      { key: "_select", label: "", hideOnCard: true },
      { key: "athlete", label: "Atleta" },
    ];
    expect(primaryColumnIndex(withCheckbox)).toBe(1);
  });

  it("returns -1 when every column is hidden on the card", () => {
    expect(
      primaryColumnIndex([{ key: "_select", label: "", hideOnCard: true }]),
    ).toBe(-1);
  });
});

describe("toCardModel — every column reaches the card", () => {
  it("promotes the primary column to the card title", () => {
    const card = toCardModel(columns, rows[0]);
    expect(card.title).toEqual({
      key: "athlete",
      label: "Atleta",
      value: "Emma Soto",
    });
  });

  it("keeps the remaining columns as label/value fields in column order", () => {
    const card = toCardModel(columns, rows[0]);
    expect(card.fields.map((f) => f.key)).toEqual(["amount", "status"]);
    expect(card.fields.map((f) => f.label)).toEqual(["Monto", "Estado"]);
  });

  it("never repeats the title column among the fields (no clipped Monto/Estado)", () => {
    const card = toCardModel(columns, rows[0]);
    expect(card.fields.some((f) => f.key === "athlete")).toBe(false);
    expect(card.fields).toHaveLength(columns.length - 1);
  });

  it("runs the column renderer for the value", () => {
    const card = toCardModel(columns, rows[0]);
    expect(card.fields[0].value).toBe("$1200");
  });

  it("reads the raw row key when there is no renderer", () => {
    const card = toCardModel(columns, rows[1]);
    expect(card.fields[1].value).toBe("Pendiente");
  });

  it("defaults align to left and carries an explicit align through", () => {
    const card = toCardModel(columns, rows[0]);
    expect(card.fields[0].align).toBe("right");
    expect(card.fields[1].align).toBe("left");
  });

  it("renders a dash instead of an empty cell for null/undefined", () => {
    const sparse: ColumnSpec<{ coach: string | null }>[] = [
      { key: "coach", label: "Coach" },
    ];
    expect(toCardModel(sparse, { coach: null }).title?.value).toBe("—");
  });

  it("drops card-hidden columns entirely", () => {
    const withCheckbox: ColumnSpec<Row>[] = [
      { key: "_select", label: "", hideOnCard: true },
      ...columns,
    ];
    const card = toCardModel(withCheckbox, rows[0]);
    expect(card.title?.key).toBe("athlete");
    expect(card.fields.map((f) => f.key)).toEqual(["amount", "status"]);
  });

  it("keeps a zero value instead of falling back to a dash", () => {
    const card = toCardModel(
      [{ key: "amount", label: "Monto" }] as ColumnSpec<Row>[],
      rows[1],
    );
    expect(card.title?.value).toBe(0);
  });

  it("maps every row", () => {
    expect(toCardModels(columns, rows)).toHaveLength(2);
  });
});
