export type ColumnDef<T> = {
  /** Encabezado a mostrar en el CSV */
  header: string;
  /** Cómo obtener el valor en texto para la fila */
  accessor: (row: T) => string | number | null | undefined;
};

/** Escapa valores para CSV (RFC 4180-ish) */
function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Si contiene comillas, comas o saltos de línea, lo encerramos en comillas y escapamos comillas internas
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Genera un CSV en texto con BOM para Excel */
export function buildCsv<T>(rows: T[], columns: ColumnDef<T>[], lineBreak: "\r\n" | "\n" = "\r\n"): string {
  const header = columns.map(c => escapeCsv(c.header)).join(",");
  const body = rows
    .map(row => columns.map(c => escapeCsv(c.accessor(row))).join(","))
    .join(lineBreak);
  // BOM + contenido
  return "\uFEFF" + header + lineBreak + body + lineBreak;
}

/** Dispara descarga del CSV en el navegador */
export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
