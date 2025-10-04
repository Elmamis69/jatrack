import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";

export type PdfColumn<T> = {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  width?: number; // opcional: ancho en mm
};

export function exportTablePdf<T>(args: {
  rows: T[];
  columns: PdfColumn<T>[];
  title?: string;
  fileName?: string; // sin .pdf
  landscape?: boolean;
}) {
  const { rows, columns, title = "Report", fileName = "export", landscape } = args;

  // A4 portrait o landscape
  const doc = new jsPDF(landscape ? "landscape" : "portrait", "mm", "a4");

  const dateStr = new Date().toISOString().slice(0, 10);

  // Encabezado (título + fecha)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${dateStr}`, 14, 22);

  // Construimos head/body para autoTable
  const head = [columns.map(c => c.header)];
  const body: RowInput[] = rows.map(r => columns.map(c => {
    const v = c.accessor(r);
    return v === null || v === undefined ? "" : String(v);
  }));

  // Estilos y layout
  autoTable(doc, {
    head,
    body,
    startY: 28,
    styles: {
      fontSize: 9,
      cellPadding: 2,
      overflow: "linebreak",
      halign: "left",
      valign: "middle",
    },
    headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
    columnStyles: columns.reduce((acc, col, idx) => {
      if (col.width) acc[idx] = { cellWidth: col.width };
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
    didDrawPage: () => { 
      // Footer con número de página
      const pageNumber = doc.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      doc.setFontSize(9);
      doc.text(
        `Page ${pageNumber}`,
        pageSize.getWidth() - 20,
        pageHeight - 8,
        { align: "right" }
      );
    },
    // Mantener header en cada página
    showHead: "everyPage",
  });

  doc.save(`${fileName}.pdf`);
}
