import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronDown, FileDown, ImageDown, ReceiptText, WalletCards } from "lucide-react";
import React, { useMemo, useState } from "react";
import { downloadCanvasAsPdf } from "./hrExport";
import { formatTwd, HRLayout } from "./HRLayout";
import { buildPayslipSummary, type PayslipSummary } from "./payslipSummary";

const paymentLabels: Record<string, string> = { pending: "待發薪", transferred: "已匯款", cash: "現金發放", other: "其他方式" };

type ExportDetails = {
  employeeName: string;
  periodLabel: string;
  summary: PayslipSummary;
};

function drawPayslipSummary(canvas: HTMLCanvasElement, details: ExportDetails) {
  const { employeeName, periodLabel, summary } = details;
  const width = 1080;
  const height = 900;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return false;
  const text = (value: string, x: number, y: number, size = 28, color = "#13233f", weight = "400") => {
    context.font = `${weight} ${size}px Arial, sans-serif`;
    context.fillStyle = color;
    context.fillText(value, x, y);
  };
  const tile = (label: string, amount: number, x: number, y: number, tone: "income" | "deduction" | "accent" = "income") => {
    const background = tone === "deduction" ? "#fff1f2" : tone === "accent" ? "#eaf0f8" : "#f2faf2";
    const color = tone === "deduction" ? "#be123c" : tone === "accent" ? "#163C72" : "#047857";
    context.fillStyle = background;
    context.roundRect(x, y, 424, 100, 18);
    context.fill();
    text(label, x + 18, y + 34, 19, "#64748b");
    text(formatTwd(amount), x + 18, y + 76, 28, color, "700");
  };

  context.fillStyle = "#f5f8fc";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#fff";
  context.roundRect(44, 44, width - 88, height - 88, 28);
  context.fill();
  text("J-AGENT CLEANING", 90, 106, 22, "#8CC63F", "700");
  text("薪資條", 90, 166, 48, "#163C72", "700");
  text(`${employeeName}｜${periodLabel}`, 90, 206, 25, "#475569");
  text("收入彙總", 90, 272, 23, "#163C72", "700");
  tile("基本薪資總計", summary.basePay, 90, 294);
  tile("餐費總計", summary.mealAllowance, 566, 294);
  tile("加班費總計", summary.overtimePay, 90, 414);
  tile("獎金總計", summary.bonusPay, 566, 414);
  text("扣款與未清借支", 90, 594, 23, "#163C72", "700");
  tile("本期借支扣款", summary.advanceDeduction, 90, 616, "deduction");
  tile("目前尚欠借支", summary.outstandingAdvance, 566, 616, "deduction");
  tile("實發薪資", summary.netPay, 90, 736, "accent");
  tile("扣款合計", summary.deductionTotal, 566, 736, "deduction");
  return true;
}

function SummaryTile({ label, amount, tone = "income" }: { label: string; amount: number; tone?: "income" | "deduction" | "accent" }) {
  const toneClass = tone === "deduction" ? "border-rose-100 bg-rose-50 text-rose-700" : tone === "accent" ? "border-blue-100 bg-blue-50 text-[#163C72]" : "border-emerald-100 bg-emerald-50 text-emerald-700";
  return <div className={`rounded-xl border p-4 ${toneClass}`}><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{formatTwd(amount)}</p></div>;
}

export default function HRPayslip() {
  const utils = trpc.useUtils();
  const periods = trpc.payroll.periods.list.useQuery();
  const employees = trpc.payroll.employees.list.useQuery();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const activePeriodId = periodId ?? periods.data?.[0]?.id ?? null;
  const runs = trpc.payroll.runs.list.useQuery({ payrollPeriodId: activePeriodId ?? 1 }, { enabled: activePeriodId !== null });
  const payments = trpc.payroll.payments.list.useQuery(activePeriodId ? { payrollPeriodId: activePeriodId } : undefined, { enabled: activePeriodId !== null });
  const detail = trpc.payroll.runs.detail.useQuery({ id: runId ?? 1 }, { enabled: runId !== null });
  const selected = detail.data;
  const advances = trpc.payroll.advances.list.useQuery({ employeeId: selected?.run.employeeId ?? 1 }, { enabled: Boolean(selected) });
  const selectedPeriod = periods.data?.find((item) => item.id === activePeriodId);
  const employeeName = selected ? employees.data?.find((employee) => employee.id === selected.run.employeeId)?.name || `員工 #${selected.run.employeeId}` : "";
  const selectedPayment = useMemo(() => selected ? payments.data?.find((payment) => payment.payrollRunId === selected.run.id) : undefined, [payments.data, selected]);
  const summary = useMemo(() => selected ? buildPayslipSummary(selected.items, selected.run, (advances.data ?? []).reduce((total, advance) => total + Number(advance.outstandingAmount), 0)) : null, [advances.data, selected]);
  const recordPayment = trpc.payroll.payments.upsert.useMutation({ onSuccess: () => { void utils.payroll.payments.list.invalidate(); void utils.payroll.runs.list.invalidate(); void utils.payroll.runs.detail.invalidate(); } });

  const exportDetails = summary && selected ? { employeeName, periodLabel: selectedPeriod?.label || "薪資週期", summary } : null;
  const downloadPng = () => {
    if (!exportDetails) return;
    const canvas = document.createElement("canvas");
    if (!drawPayslipSummary(canvas, exportDetails)) return;
    canvas.toBlob((blob) => { if (!blob) return; const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `潔特務薪資條_${employeeName}_${selectedPeriod?.label || selected?.run.id}.png`; link.click(); URL.revokeObjectURL(link.href); }, "image/png");
  };
  const downloadPdf = () => {
    if (!exportDetails) return;
    const canvas = document.createElement("canvas");
    if (!drawPayslipSummary(canvas, exportDetails)) return;
    downloadCanvasAsPdf(canvas, `潔特務薪資條_${employeeName}_${selectedPeriod?.label || selected?.run.id}.pdf`);
  };
  const canRecordPayment = selected && ["confirmed", "pending_payment", "paid"].includes(selected.run.status);
  const setPayment = (status: "pending" | "transferred" | "cash" | "other") => {
    if (!selected) return;
    recordPayment.mutate({ payrollRunId: selected.run.id, paymentMethod: status === "transferred" ? "transfer" : status, status, paidAt: status === "pending" ? null : new Date(), notes: null });
  };

  return <HRLayout title="薪資條管理" description="以收入、扣款與未清借支彙總檢視每期薪資，並可下載適合手機閱讀的 PNG 或 PDF。"><div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"><Card className="p-5"><label className="text-sm font-medium">薪資週期</label><select value={activePeriodId ?? ""} onChange={(event) => { setPeriodId(Number(event.target.value)); setRunId(null); }} className="mt-2 h-10 w-full rounded-md border px-3 text-sm">{periods.data?.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><div className="mt-5 space-y-2">{runs.data?.map((run) => <button type="button" key={run.id} onClick={() => setRunId(run.id)} className={`w-full rounded-xl border p-4 text-left ${run.id === runId ? "border-[#163C72] bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}><p className="font-semibold">{employees.data?.find((employee) => employee.id === run.employeeId)?.name || `員工 #${run.employeeId}`}</p><p className="mt-1 text-sm text-slate-500">實發 {formatTwd(run.netPay)} · {run.status}</p></button>)}{!runs.data?.length && <p className="text-sm text-slate-500">此週期尚未產生薪資條。</p>}</div></Card><div className="space-y-6"><Card className="p-6 print:shadow-none">{selected && summary ? <><div className="flex flex-wrap justify-between gap-4 border-b pb-5"><div><p className="text-xs font-bold tracking-[.16em] text-[#8CC63F]">J-AGENT CLEANING</p><h3 className="mt-1 text-2xl font-bold text-[#163C72]">薪資條</h3><p className="mt-2 text-sm text-slate-500">{employeeName} · {selectedPeriod?.label || "薪資週期"} · {selected.run.status}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="print:hidden" onClick={downloadPng}><ImageDown className="mr-2 h-4 w-4"/>下載 PNG</Button><Button variant="outline" className="print:hidden" onClick={downloadPdf}><FileDown className="mr-2 h-4 w-4"/>下載 PDF</Button></div></div><section className="mt-6" aria-label="收入彙總"><div className="mb-3 flex items-center justify-between"><h4 className="font-bold text-[#163C72]">收入彙總</h4><span className="text-sm text-slate-500">應發薪資 {formatTwd(summary.grossPay)}</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SummaryTile label="基本薪資總計" amount={summary.basePay}/><SummaryTile label="餐費總計" amount={summary.mealAllowance}/><SummaryTile label="加班費總計" amount={summary.overtimePay}/><SummaryTile label="獎金總計" amount={summary.bonusPay}/></div>{summary.otherIncome > 0 && <div className="mt-3"><SummaryTile label="其他收入總計" amount={summary.otherIncome}/></div>}</section><section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-label="扣款與尚欠借支"><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h4 className="font-bold text-[#163C72]">扣款與尚欠借支</h4><p className="mt-1 text-sm text-slate-500">「尚欠借支」為目前尚未結清的累積餘額。</p></div><div className="text-right"><p className="text-sm text-slate-500">本期扣款合計</p><p className="font-bold text-rose-600">{formatTwd(summary.deductionTotal)}</p></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><SummaryTile label="本期借支扣款" amount={summary.advanceDeduction} tone="deduction"/><SummaryTile label="其他扣款" amount={summary.otherDeductions} tone="deduction"/><SummaryTile label="目前尚欠借支" amount={summary.outstandingAdvance} tone="deduction"/></div></section><div className="mt-6 rounded-2xl bg-[#163C72] p-5 text-white"><p className="text-sm font-medium text-blue-100">實發薪資</p><p className="mt-1 text-3xl font-bold tabular-nums">{formatTwd(summary.netPay)}</p></div><details className="mt-6 rounded-xl border"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium text-slate-700">查看完整薪資明細（{selected.items.length} 筆）<ChevronDown className="h-4 w-4 text-slate-500"/></summary><div className="divide-y border-t">{selected.items.map((item) => <div key={item.id} className="flex items-center justify-between px-4 py-3"><div><p className="font-medium">{item.label}</p><p className="text-xs text-slate-500">{item.category}</p></div><p className={item.direction === "income" ? "font-semibold text-emerald-700" : "font-semibold text-rose-600"}>{item.direction === "income" ? "+" : "−"}{formatTwd(item.amount)}</p></div>)}</div></details></> : <div className="grid min-h-80 place-items-center text-center text-slate-500"><div><ReceiptText className="mx-auto h-10 w-10"/><p className="mt-3">請從左側選擇薪資條以檢視彙總。</p></div></div>}</Card>{selected && <Card className="p-5"><div className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-[#163C72]"/><h3 className="font-bold">發薪紀錄</h3></div><p className="mt-1 text-sm text-slate-500">{selectedPayment ? `${paymentLabels[selectedPayment.status] ?? selectedPayment.status} · ${selectedPayment.paidAt ? new Date(selectedPayment.paidAt).toLocaleDateString("zh-TW") : "尚未設定發薪日期"}` : "尚未建立發薪紀錄"}</p>{canRecordPayment ? <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={recordPayment.isPending} onClick={() => setPayment("pending")}>標記待發薪</Button><Button size="sm" className="bg-[#163C72]" disabled={recordPayment.isPending} onClick={() => setPayment("transferred")}><CheckCircle2 className="mr-1 h-4 w-4"/>標記已匯款</Button><Button size="sm" variant="outline" disabled={recordPayment.isPending} onClick={() => setPayment("cash")}>現金發放</Button><Button size="sm" variant="outline" disabled={recordPayment.isPending} onClick={() => setPayment("other")}>其他方式</Button></div> : <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">請先將薪資條確認並進入待發薪狀態，才能登錄發薪紀錄。</p>}{recordPayment.error && <p className="mt-3 text-sm text-rose-600">{recordPayment.error.message}</p>}</Card>}</div></div></HRLayout>;
}
