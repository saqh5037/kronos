export type CSVColumn<T> = {
  key: string;
  header: string;
  value: (row: T) => string | number | boolean | null | undefined | Date;
};

const NEEDS_QUOTING = /[",\n\r]/;

function escapeCell(input: unknown): string {
  if (input === null || input === undefined) return "";
  let str: string;
  if (input instanceof Date) {
    str = input.toISOString();
  } else if (typeof input === "boolean") {
    str = input ? "true" : "false";
  } else {
    str = String(input);
  }
  if (NEEDS_QUOTING.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV<T>(rows: T[], columns: CSVColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.value(row))).join(","))
    .join("\n");
  return body ? `${header}\n${body}\n` : `${header}\n`;
}

/** Browser-only helper to trigger a CSV download. */
export function downloadCSV(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
