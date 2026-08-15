import { describe, expect, it } from "vitest";
import { buildPayrollReportRows, canvasJpegDataUrlToPdf } from "./hrExport";

describe("buildPayrollReportRows", () => {
  it("建立可供 Excel 使用的明細列與薪資合計", () => {
    const report = buildPayrollReportRows([
      { employeeName: "王小明", grossPay: "2600", deductionTotal: "200", netPay: "2400", status: "paid" },
      { employeeName: "陳小美", grossPay: "1800", deductionTotal: "0", netPay: "1800", status: "confirmed" },
    ]);

    expect(report.rows[0]).toEqual(["潔特務清潔｜薪資支出報表"]);
    expect(report.rows[2]).toEqual(["員工", "應發薪資", "扣款合計", "實發薪資", "發薪狀態"]);
    expect(report.rows[3]).toEqual(["王小明", 2600, 200, 2400, "paid"]);
    expect(report.rows.at(-1)).toEqual(["合計", 4400, 200, 4200, ""]);
    expect(report.totals).toEqual({ gross: 4400, deductions: 200, net: 4200 });
  });
});

describe("canvasJpegDataUrlToPdf", () => {
  it("將 JPEG 資料封裝為標準 PDF 二進位檔", async () => {
    const blob = canvasJpegDataUrlToPdf("data:image/jpeg;base64,/9j/2Q==", 10, 10);
    const firstBytes = new Uint8Array(await blob.arrayBuffer()).slice(0, 8);
    expect(new TextDecoder().decode(firstBytes)).toContain("%PDF-1.4");
    expect(blob.type).toBe("application/pdf");
  });
});
