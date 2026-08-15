import { describe, expect, it } from "vitest";
import { filterAndSortPayrollReportRows } from "./hrReportUtils";

const rows = [
  { employeeId: 1, employeeName: "王小明", grossPay: "30000", deductionTotal: "1000", netPay: "29000", status: "pending_payment" },
  { employeeId: 2, employeeName: "陳小華", grossPay: "28000", deductionTotal: "2000", netPay: "26000", status: "paid" },
];

describe("filterAndSortPayrollReportRows", () => {
  it("可同時依員工、狀態篩選並以實發金額排序", () => {
    expect(filterAndSortPayrollReportRows(rows, { query: "王", employeeId: null, status: "pending_payment", sortBy: "netPay", direction: "desc" })).toEqual([rows[0]]);
    expect(filterAndSortPayrollReportRows(rows, { query: "", employeeId: null, status: "", sortBy: "netPay", direction: "asc" }).map((item) => item.employeeId)).toEqual([2, 1]);
  });
});
