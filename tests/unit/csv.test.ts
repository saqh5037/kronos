import { describe, it, expect } from "vitest";
import { toCSV, type CSVColumn } from "../../src/lib/csv";

type Row = { name: string; age: number; note: string | null; joined: Date };

const cols: CSVColumn<Row>[] = [
  { key: "name", header: "Nombre", value: (r) => r.name },
  { key: "age", header: "Edad", value: (r) => r.age },
  { key: "note", header: "Nota", value: (r) => r.note },
  { key: "joined", header: "Ingreso", value: (r) => r.joined },
];

describe("toCSV", () => {
  it("produces header-only output for empty rows", () => {
    const out = toCSV<Row>([], cols);
    expect(out).toBe("Nombre,Edad,Nota,Ingreso\n");
  });

  it("renders simple rows with header", () => {
    const out = toCSV<Row>(
      [{ name: "Ana", age: 28, note: "ok", joined: new Date("2026-01-01") }],
      cols,
    );
    expect(out.split("\n")[0]).toBe("Nombre,Edad,Nota,Ingreso");
    expect(out).toMatch(/Ana,28,ok,2026-01-01T/);
  });

  it("escapes commas with quotes", () => {
    const out = toCSV<Row>(
      [{ name: "Pérez, Ana", age: 30, note: null, joined: new Date() }],
      cols,
    );
    expect(out).toContain('"Pérez, Ana"');
  });

  it("escapes embedded quotes by doubling", () => {
    const out = toCSV<Row>(
      [{ name: 'She said "hi"', age: 1, note: null, joined: new Date() }],
      cols,
    );
    expect(out).toContain('"She said ""hi"""');
  });

  it("escapes newlines inside cells", () => {
    const out = toCSV<Row>(
      [{ name: "line1\nline2", age: 1, note: null, joined: new Date() }],
      cols,
    );
    expect(out).toContain('"line1\nline2"');
  });

  it("renders null/undefined as empty string", () => {
    const out = toCSV<Row>(
      [{ name: "x", age: 0, note: null, joined: new Date("2026-01-01") }],
      cols,
    );
    const dataRow = out.split("\n")[1];
    expect(dataRow.split(",")[2]).toBe("");
  });

  it("renders Date as ISO string", () => {
    const d = new Date("2026-05-15T12:00:00.000Z");
    const out = toCSV<Row>(
      [{ name: "x", age: 0, note: null, joined: d }],
      cols,
    );
    expect(out).toContain("2026-05-15T12:00:00.000Z");
  });
});
