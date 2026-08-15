import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, FileDown, ImageDown, ReceiptText, WalletCards } from "lucide-react";
import React, { useMemo, useState } from "react";
import { downloadCanvasAsPdf } from "./hrExport";
import { formatTwd, HRLayout } from "./HRLayout";

const paymentLabels: Record<string, string> = { pending: "待發薪", transferred: "已匯款", cash: "現金發放", other: "其他方式" };

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
  const selectedPeriod = periods.data?.find((item) => item.id === activePeriodId);
  const employeeName = selected ? employees.data?.find((employee) => employee.id === selected.run.employeeId)?.name || `員工 #${selected.run.employeeId}` : "";
  const selectedPayment = useMemo(() => selected ? payments.data?.find((payment) => payment.payrollRunId === selected.run.id) : undefined, [payments.data, selected]);
  const recordPayment = trpc.payroll.payments.upsert.useMutation({ onSuccess: () => { void utils.payroll.payments.list.invalidate(); void utils.payroll.runs.list.invalidate(); void utils.payroll.runs.detail.invalidate(); } });

  const downloadPng = () => {
    if (!selected) return;
    const canvas = document.createElement("canvas"); const width = 1080; const height = 520 + selected.items.length * 76; canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d"); if (!context) return;
    const text = (value: string, x: number, y: number, size = 28, color = "#13233f", weight = "400") => { context.font = `${weight} ${size}px Arial, sans-serif`; context.fillStyle = color; context.fillText(value, x, y); };
    context.fillStyle = "#f5f8fc"; context.fillRect(0, 0, width, height); context.fillStyle = "#fff"; context.roundRect(44, 44, width - 88, height - 88, 28); context.fill();
    text("J-AGENT CLEANING", 90, 112, 22, "#8CC63F", "700"); text("薪資條", 90, 172, 48, "#163C72", "700"); text(`${employeeName}｜${selectedPeriod?.label || "薪資週期"}`, 90, 212, 25, "#475569");
    [["應發薪資", formatTwd(selected.run.grossPay)], ["扣款合計", formatTwd(selected.run.deductionTotal)], ["實發薪資", formatTwd(selected.run.netPay)]].forEach(([label, amount], index) => { const x = 90 + index * 300; context.fillStyle = "#eaf0f8"; context.roundRect(x, 258, 260, 106, 18); context.fill(); text(label, x + 18, 294, 20, "#64748b"); text(amount, x + 18, 338, 30, index === 2 ? "#163C72" : "#13233f", "700"); });
    let y = 430; selected.items.forEach((item) => { text(item.label, 90, y, 25, "#13233f", "700"); text(item.category, 90, y + 30, 18, "#64748b"); text(`${item.direction === "income" ? "+" : "−"}${formatTwd(item.amount)}`, 900, y + 12, 25, item.direction === "income" ? "#047857" : "#be123c", "700"); context.strokeStyle = "#dbe4f0"; context.beginPath(); context.moveTo(90, y + 50); context.lineTo(990, y + 50); context.stroke(); y += 76; });
    canvas.toBlob((blob) => { if (!blob) return; const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `潔特務薪資條_${employeeName}_${selectedPeriod?.label || selected.run.id}.png`; link.click(); URL.revokeObjectURL(link.href); }, "image/png");
  };
  const downloadPdf = () => {
    if (!selected) return;
    const canvas = document.createElement("canvas"); const width = 1080; const height = 520 + selected.items.length * 76; canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d"); if (!context) return;
    const text = (value: string, x: number, y: number, size = 28, color = "#13233f", weight = "400") => { context.font = `${weight} ${size}px Arial, sans-serif`; context.fillStyle = color; context.fillText(value, x, y); };
    context.fillStyle = "#f5f8fc"; context.fillRect(0, 0, width, height); context.fillStyle = "#fff"; context.roundRect(44, 44, width - 88, height - 88, 28); context.fill(); text("J-AGENT CLEANING", 90, 112, 22, "#8CC63F", "700"); text("薪資條", 90, 172, 48, "#163C72", "700"); text(`${employeeName}｜${selectedPeriod?.label || "薪資週期"}`, 90, 212, 25, "#475569");
    [["應發薪資", formatTwd(selected.run.grossPay)], ["扣款合計", formatTwd(selected.run.deductionTotal)], ["實發薪資", formatTwd(selected.run.netPay)]].forEach(([label, amount], index) => { const x = 90 + index * 300; context.fillStyle = "#eaf0f8"; context.roundRect(x, 258, 260, 106, 18); context.fill(); text(label, x + 18, 294, 20, "#64748b"); text(amount, x + 18, 338, 30, index === 2 ? "#163C72" : "#13233f", "700"); });
    let y = 430; selected.items.forEach((item) => { text(item.label, 90, y, 25, "#13233f", "700"); text(item.category, 90, y + 30, 18, "#64748b"); text(`${item.direction === "income" ? "+" : "−"}${formatTwd(item.amount)}`, 900, y + 12, 25, item.direction === "income" ? "#047857" : "#be123c", "700"); context.strokeStyle = "#dbe4f0"; context.beginPath(); context.moveTo(90, y + 50); context.lineTo(990, y + 50); context.stroke(); y += 76; });
    downloadCanvasAsPdf(canvas, `潔特務薪資條_${employeeName}_${selectedPeriod?.label || selected.run.id}.pdf`);
  };
  const canRecordPayment = selected && ["confirmed", "pending_payment", "paid"].includes(selected.run.status);
  const setPayment = (status: "pending" | "transferred" | "cash" | "other") => {
    if (!selected) return;
    recordPayment.mutate({ payrollRunId: selected.run.id, paymentMethod: status === "transferred" ? "transfer" : status, status, paidAt: status === "pending" ? null : new Date(), notes: null });
  };
  return <HRLayout title="薪資條管理" description="檢視每位員工每期薪資明細，下載手機版 PNG 或 PDF，並登錄發薪方式與狀態。"><div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"><Card className="p-5"><label className="text-sm font-medium">薪資週期</label><select value={activePeriodId ?? ""} onChange={(event) => { setPeriodId(Number(event.target.value)); setRunId(null); }} className="mt-2 h-10 w-full rounded-md border px-3 text-sm">{periods.data?.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><div className="mt-5 space-y-2">{runs.data?.map((run) => <button type="button" key={run.id} onClick={() => setRunId(run.id)} className={`w-full rounded-xl border p-4 text-left ${run.id === runId ? "border-[#163C72] bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}><p className="font-semibold">{employees.data?.find((employee) => employee.id === run.employeeId)?.name || `員工 #${run.employeeId}`}</p><p className="mt-1 text-sm text-slate-500">實發 {formatTwd(run.netPay)} · {run.status}</p></button>)}{!runs.data?.length && <p className="text-sm text-slate-500">此週期尚未產生薪資條。</p>}</div></Card><div className="space-y-6"><Card className="p-6 print:shadow-none">{selected ? <><div className="flex flex-wrap justify-between gap-4 border-b pb-5"><div><p className="text-xs font-bold tracking-[.16em] text-[#8CC63F]">J-AGENT CLEANING</p><h3 className="mt-1 text-2xl font-bold text-[#163C72]">薪資條</h3><p className="mt-2 text-sm text-slate-500">{employeeName} · {selectedPeriod?.label || "薪資週期"} · {selected.run.status}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="print:hidden" onClick={downloadPng}><ImageDown className="mr-2 h-4 w-4"/>下載 PNG</Button><Button variant="outline" className="print:hidden" onClick={downloadPdf}><FileDown className="mr-2 h-4 w-4"/>下載 PDF</Button></div></div><div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-slate-500">應發薪資</p><p className="mt-1 text-xl font-bold">{formatTwd(selected.run.grossPay)}</p></div><div><p className="text-slate-500">扣款合計</p><p className="mt-1 text-xl font-bold text-rose-600">{formatTwd(selected.run.deductionTotal)}</p></div><div><p className="text-slate-500">實發薪資</p><p className="mt-1 text-xl font-bold text-[#163C72]">{formatTwd(selected.run.netPay)}</p></div></div><div className="mt-6 divide-y rounded-xl border">{selected.items.map((item) => <div key={item.id} className="flex items-center justify-between px-4 py-3"><div><p className="font-medium">{item.label}</p><p className="text-xs text-slate-500">{item.category}</p></div><p className={item.direction === "income" ? "font-semibold text-emerald-700" : "font-semibold text-rose-600"}>{item.direction === "income" ? "+" : "−"}{formatTwd(item.amount)}</p></div>)}</div></> : <div className="grid min-h-80 place-items-center text-center text-slate-500"><div><ReceiptText className="mx-auto h-10 w-10"/><p className="mt-3">請從左側選擇薪資條以檢視明細。</p></div></div>}</Card>{selected && <Card className="p-5"><div className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-[#163C72]"/><h3 className="font-bold">發薪紀錄</h3></div><p className="mt-1 text-sm text-slate-500">{selectedPayment ? `${paymentLabels[selectedPayment.status] ?? selectedPayment.status} · ${selectedPayment.paidAt ? new Date(selectedPayment.paidAt).toLocaleDateString("zh-TW") : "尚未設定發薪日期"}` : "尚未建立發薪紀錄"}</p>{canRecordPayment ? <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={recordPayment.isPending} onClick={() => setPayment("pending")}>標記待發薪</Button><Button size="sm" className="bg-[#163C72]" disabled={recordPayment.isPending} onClick={() => setPayment("transferred")}><CheckCircle2 className="mr-1 h-4 w-4"/>標記已匯款</Button><Button size="sm" variant="outline" disabled={recordPayment.isPending} onClick={() => setPayment("cash")}>現金發放</Button><Button size="sm" variant="outline" disabled={recordPayment.isPending} onClick={() => setPayment("other")}>其他方式</Button></div> : <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">請先將薪資條確認並進入待發薪狀態，才能登錄發薪紀錄。</p>}{recordPayment.error && <p className="mt-3 text-sm text-rose-600">{recordPayment.error.message}</p>}</Card>}</div></div></HRLayout>;
}
