import * as XLSX from "xlsx";

export type PayrollReportExportRow = {
  employeeName: string;
  grossPay: string | number;
  deductionTotal: string | number;
  netPay: string | number;
  status: string;
};

export function buildPayrollReportRows(rows: PayrollReportExportRow[]) {
  const body = rows.map((row) => [
    row.employeeName,
    Number(row.grossPay),
    Number(row.deductionTotal),
    Number(row.netPay),
    row.status,
  ]);
  const totals = body.reduce(
    (acc, row) => ({
      gross: acc.gross + Number(row[1]),
      deductions: acc.deductions + Number(row[2]),
      net: acc.net + Number(row[3]),
    }),
    { gross: 0, deductions: 0, net: 0 },
  );

  return {
    rows: [
      ["潔特務清潔｜薪資支出報表"],
      [],
      ["員工", "應發薪資", "扣款合計", "實發薪資", "發薪狀態"],
      ...body,
      [],
      ["合計", totals.gross, totals.deductions, totals.net, ""],
    ],
    totals,
  };
}

export function downloadPayrollReportWorkbook(label: string, rows: PayrollReportExportRow[]) {
  const report = buildPayrollReportRows(rows);
  const worksheet = XLSX.utils.aoa_to_sheet(report.rows);
  worksheet["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
  for (let index = 4; index <= rows.length + 4; index += 1) {
    for (const column of ["B", "C", "D"]) {
      const cell = worksheet[`${column}${index}`];
      if (cell) cell.z = '"$"#,##0';
    }
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "薪資支出報表");
  const safeLabel = label.replace(/[\\/:*?"<>|]/g, "_");
  XLSX.writeFile(workbook, `潔特務薪資支出報表_${safeLabel || "report"}.xlsx`);
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

/**
 * 將 canvas 的 JPEG 圖像包裝成標準 PDF。薪資條先以瀏覽器字型繪製後再嵌入，
 * 可正確保留繁體中文而不需在前端額外內嵌大型字型檔。
 */
export function canvasJpegDataUrlToPdf(dataUrl: string, imageWidth: number, imageHeight: number) {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("無法讀取薪資條影像資料");
  const decoded = atob(base64);
  const image = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  const encoder = new TextEncoder();
  const pageWidth = 595.28;
  const pageHeight = Number(((imageHeight / imageWidth) * pageWidth).toFixed(2));
  const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
  const sections = [
    encoder.encode("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"),
    encoder.encode("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"),
    encoder.encode("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"),
    encoder.encode(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`),
    encoder.encode(`4 0 obj\n<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`),
    encoder.encode(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),
    image,
    encoder.encode("\nendstream\nendobj\n"),
  ];
  const offsets: number[] = [];
  let currentOffset = sections[0].length;
  for (let index = 1; index < sections.length; index += 1) {
    if ([1, 2, 3, 4, 5].includes(index)) offsets.push(currentOffset);
    currentOffset += sections[index].length;
  }
  const xrefOffset = currentOffset;
  const xref = `xref\n0 6\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([concatBytes([...sections, encoder.encode(xref)])], { type: "application/pdf" });
}

export function downloadCanvasAsPdf(canvas: HTMLCanvasElement, filename: string) {
  const blob = canvasJpegDataUrlToPdf(canvas.toDataURL("image/jpeg", 0.96), canvas.width, canvas.height);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
