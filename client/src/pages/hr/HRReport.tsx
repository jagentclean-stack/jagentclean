import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowDownAZ, Download, Search, SlidersHorizontal } from "lucide-react";
import React, { useMemo, useState } from "react";
import { downloadPayrollReportWorkbook } from "./hrExport";
import { formatTwd, HRLayout } from "./HRLayout";
import { filterAndSortPayrollReportRows, type PayrollReportFilters } from "./hrReportUtils";

const statusLabels: Record<string, string> = { draft: "草稿", pending_review: "待審核", confirmed: "已確認", pending_payment: "待發薪", paid: "已發薪" };

export default function HRReport() {
  const periods = trpc.payroll.periods.list.useQuery();
  const employees = trpc.payroll.employees.list.useQuery();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [filters, setFilters] = useState<PayrollReportFilters>({ query: "", employeeId: null, status: "", sortBy: "netPay", direction: "desc" });
  const activePeriodId = periodId ?? periods.data?.[0]?.id ?? null;
  const runs = trpc.payroll.runs.list.useQuery({ payrollPeriodId: activePeriodId ?? 1 }, { enabled: activePeriodId !== null });
  const rows = useMemo(() => (runs.data ?? []).map((row) => ({ employeeId: row.employeeId, employeeName: employees.data?.find((employee) => employee.id === row.employeeId)?.name || `#${row.employeeId}`, grossPay: row.grossPay, deductionTotal: row.deductionTotal, netPay: row.netPay, status: row.status })), [runs.data, employees.data]);
  const filteredRows = useMemo(() => filterAndSortPayrollReportRows(rows, filters), [rows, filters]);
  const totals = useMemo(() => filteredRows.reduce((acc, row) => ({ gross: acc.gross + Number(row.grossPay), deduction: acc.deduction + Number(row.deductionTotal), net: acc.net + Number(row.netPay) }), { gross: 0, deduction: 0, net: 0 }), [filteredRows]);
  const exportExcel = () => {
    const selectedPeriod = periods.data?.find((item) => item.id === activePeriodId);
    downloadPayrollReportWorkbook(selectedPeriod?.label || "report", filteredRows);
  };
  const updateFilter = <Key extends keyof PayrollReportFilters>(key: Key, value: PayrollReportFilters[Key]) => setFilters((current) => ({ ...current, [key]: value }));

  return <HRLayout title="薪資支出報表" description="依薪資週期、員工與發薪狀態篩選明細，排序後匯出正式 Excel 活頁簿。">
    <Card className="p-5"><div className="grid gap-3 xl:grid-cols-[minmax(220px,.85fr)_minmax(220px,.85fr)_minmax(180px,.7fr)_minmax(200px,.8fr)_auto]"><div><label className="text-sm font-medium">薪資週期</label><select value={activePeriodId ?? ""} onChange={(event) => setPeriodId(Number(event.target.value))} className="mt-2 block h-10 w-full rounded-md border px-3 text-sm">{periods.data?.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><div><label className="text-sm font-medium">員工</label><select value={filters.employeeId ?? ""} onChange={(event) => updateFilter("employeeId", event.target.value ? Number(event.target.value) : null)} className="mt-2 block h-10 w-full rounded-md border px-3 text-sm"><option value="">全部員工</option>{employees.data?.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></div><div><label className="text-sm font-medium">發薪狀態</label><select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="mt-2 block h-10 w-full rounded-md border px-3 text-sm"><option value="">全部狀態</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><label className="text-sm font-medium">搜尋姓名</label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"/><Input value={filters.query} onChange={(event) => updateFilter("query", event.target.value)} className="pl-9" placeholder="輸入員工姓名"/></div></div><Button className="self-end bg-[#163C72]" disabled={!activePeriodId || !filteredRows.length} onClick={exportExcel}><Download className="mr-2 h-4 w-4"/>下載 Excel</Button></div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-slate-500"/><span className="text-sm text-slate-500">排序：</span><select value={filters.sortBy} onChange={(event) => updateFilter("sortBy", event.target.value as PayrollReportFilters["sortBy"])} className="h-8 rounded-md border px-2 text-sm"><option value="netPay">實發金額</option><option value="grossPay">應發金額</option><option value="deductionTotal">扣款金額</option><option value="employeeName">員工姓名</option><option value="status">發薪狀態</option></select><Button size="sm" variant="outline" onClick={() => updateFilter("direction", filters.direction === "desc" ? "asc" : "desc")}><ArrowDownAZ className="mr-1 h-4 w-4"/>{filters.direction === "desc" ? "由高至低" : "由低至高"}</Button><span className="ml-auto text-sm text-slate-500">共 {filteredRows.length} 筆</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">總應發</p><p className="mt-1 text-xl font-bold">{formatTwd(totals.gross)}</p></div><div className="rounded-xl bg-rose-50 p-4"><p className="text-xs text-rose-600">總扣款</p><p className="mt-1 text-xl font-bold text-rose-700">{formatTwd(totals.deduction)}</p></div><div className="rounded-xl bg-blue-50 p-4"><p className="text-xs text-[#163C72]">總實發／人事支出</p><p className="mt-1 text-xl font-bold text-[#163C72]">{formatTwd(totals.net)}</p></div></div></Card>
    <Card className="mt-5 overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-5 py-3">員工</th><th className="px-5 py-3">基本／應發</th><th className="px-5 py-3">扣款</th><th className="px-5 py-3">實發</th><th className="px-5 py-3">發薪狀態</th></tr></thead><tbody>{filteredRows.map((row) => <tr className="border-t" key={row.employeeId}><td className="px-5 py-3 font-medium">{row.employeeName}</td><td className="px-5 py-3">{formatTwd(row.grossPay)}</td><td className="px-5 py-3">{formatTwd(row.deductionTotal)}</td><td className="px-5 py-3 font-semibold">{formatTwd(row.netPay)}</td><td className="px-5 py-3">{statusLabels[row.status] ?? row.status}</td></tr>)}{!filteredRows.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">此條件下尚無薪資資料。</td></tr>}</tbody></table></div></Card>
  </HRLayout>;
}
