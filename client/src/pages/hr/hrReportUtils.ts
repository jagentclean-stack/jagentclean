export type PayrollReportRow = {
  employeeId: number;
  employeeName: string;
  grossPay: string | number;
  deductionTotal: string | number;
  netPay: string | number;
  status: string;
};

export type PayrollReportFilters = {
  query: string;
  employeeId: number | null;
  status: string;
  sortBy: "employeeName" | "grossPay" | "deductionTotal" | "netPay" | "status";
  direction: "asc" | "desc";
};

export function filterAndSortPayrollReportRows(rows: PayrollReportRow[], filters: PayrollReportFilters) {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("zh-Hant");
  const compare = (left: PayrollReportRow, right: PayrollReportRow) => {
    const leftValue = filters.sortBy === "employeeName" || filters.sortBy === "status" ? String(left[filters.sortBy]) : Number(left[filters.sortBy]);
    const rightValue = filters.sortBy === "employeeName" || filters.sortBy === "status" ? String(right[filters.sortBy]) : Number(right[filters.sortBy]);
    const result = typeof leftValue === "number" && typeof rightValue === "number" ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), "zh-Hant");
    return filters.direction === "asc" ? result : -result;
  };
  return rows.filter((row) => {
    const matchesQuery = !normalizedQuery || row.employeeName.toLocaleLowerCase("zh-Hant").includes(normalizedQuery);
    return matchesQuery && (!filters.employeeId || row.employeeId === filters.employeeId) && (!filters.status || row.status === filters.status);
  }).sort(compare);
}
