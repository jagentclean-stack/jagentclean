import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Calculator, CheckCircle2, LockKeyhole, Plus, RefreshCw, Sparkles } from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatTwd, HRLayout } from "./HRLayout";

const statuses: Record<string, string> = { draft: "草稿", pending_review: "待審核", confirmed: "已確認", pending_payment: "待發薪", paid: "已發薪" };
const periodTypes: Record<string, string> = { first_half: "上半月（1–15 日）", second_half: "下半月（16 日至月底）", monthly: "整月", custom: "自訂區間" };

export default function HRPayroll() {
  const currentDate = useMemo(() => new Date(), []);
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [periodType, setPeriodType] = useState<"first_half" | "second_half" | "monthly" | "custom">("monthly");
  const periods = trpc.payroll.periods.list.useQuery();
  const employees = trpc.payroll.employees.list.useQuery();
  const alerts = trpc.payroll.alerts.list.useQuery();
  const utils = trpc.useUtils();
  const activePeriodId = periodId ?? periods.data?.[0]?.id ?? null;
  const runs = trpc.payroll.runs.list.useQuery({ payrollPeriodId: activePeriodId ?? 1 }, { enabled: activePeriodId !== null });
  const refreshAll = () => Promise.all([utils.payroll.periods.list.invalidate(), utils.payroll.runs.list.invalidate(), utils.payroll.alerts.list.invalidate(), utils.payroll.dashboard.summary.invalidate()]);
  const createCustom = trpc.payroll.periods.create.useMutation({ onSuccess: async (result) => { toast.success("薪資週期已建立"); setPeriodId(result.id); await refreshAll(); }, onError: (error) => toast.error(error.message) });
  const createByType = trpc.payroll.periods.createByType.useMutation({ onSuccess: async (result) => { toast.success(`${result.label}已建立`); setPeriodId(result.id); await refreshAll(); }, onError: (error) => toast.error(error.message) });
  const calculate = trpc.payroll.runs.calculate.useMutation({ onSuccess: async () => { toast.success("薪資試算完成"); await refreshAll(); }, onError: (error) => toast.error(error.message) });
  const calculateBatch = trpc.payroll.runs.calculateBatch.useMutation({ onSuccess: async (result) => { toast.success(`已完成 ${result.calculated} 位員工試算${result.failures.length ? `；${result.failures.length} 位需處理` : ""}`); await refreshAll(); }, onError: (error) => toast.error(error.message) });
  const transition = trpc.payroll.periods.transition.useMutation({ onSuccess: async () => { toast.success("薪資週期狀態已更新"); await refreshAll(); }, onError: (error) => toast.error(error.message) });
  const refreshAlerts = trpc.payroll.alerts.refresh.useMutation({ onSuccess: async () => { toast.success("異常警示已更新"); await refreshAll(); }, onError: (error) => toast.error(error.message) });
  const resolveAlert = trpc.payroll.alerts.resolve.useMutation({ onSuccess: async () => { toast.success("已標記為完成"); await refreshAll(); } });
  const period = useMemo(() => periods.data?.find((item) => item.id === activePeriodId), [periods.data, activePeriodId]);
  const nextStatus = period?.status === "draft" ? "pending_review" : period?.status === "pending_review" ? "confirmed" : period?.status === "confirmed" ? "pending_payment" : period?.status === "pending_payment" ? "paid" : null;
  const isMutable = period?.status === "draft" || period?.status === "pending_review";

  const submitPeriod = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (periodType === "custom") {
      createCustom.mutate({ label: String(form.get("label")), periodStart: String(form.get("periodStart")), periodEnd: String(form.get("periodEnd")), periodType: "custom" });
      return;
    }
    createByType.mutate({ year: Number(form.get("year")), month: Number(form.get("month")), periodType });
  };

  return <HRLayout title="薪資計算" description="以薪資快照、出勤、已核准加班、獎金、津貼與扣款產生可追溯的薪資明細；確認後即自動鎖定。">
    <div className="grid gap-5 2xl:grid-cols-[340px_minmax(0,1fr)_300px]">
      <Card className="p-5"><h3 className="font-bold">薪資週期</h3><div className="mt-4 space-y-2">{periods.data?.map((item) => <button type="button" onClick={() => setPeriodId(item.id)} key={item.id} className={`w-full rounded-xl border p-3 text-left transition ${item.id === activePeriodId ? "border-[#163C72] bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}><p className="font-semibold">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.periodStart} 至 {item.periodEnd} · {periodTypes[item.periodType] ?? "自訂區間"} · {statuses[item.status]}</p></button>)}{!periods.data?.length && <p className="text-sm text-slate-500">尚無薪資週期。</p>}</div>
        <details className="mt-5 rounded-xl border border-dashed p-3"><summary className="cursor-pointer text-sm font-medium">建立薪資週期</summary><form className="mt-4 grid gap-3" onSubmit={submitPeriod}><div><Label>週期類型</Label><select value={periodType} onChange={(event) => setPeriodType(event.target.value as typeof periodType)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="monthly">整月</option><option value="first_half">上半月（1–15 日）</option><option value="second_half">下半月（16 日至月底）</option><option value="custom">自訂區間</option></select></div>{periodType === "custom" ? <><div><Label>名稱</Label><Input name="label" placeholder="115 年 7 月（專案結算）" required /></div><div><Label>開始日</Label><Input name="periodStart" type="date" required /></div><div><Label>結束日</Label><Input name="periodEnd" type="date" required /></div></> : <div className="grid grid-cols-2 gap-3"><div><Label>年份</Label><Input name="year" type="number" min="2000" defaultValue={currentDate.getFullYear()} required /></div><div><Label>月份</Label><Input name="month" type="number" min="1" max="12" defaultValue={currentDate.getMonth() + 1} required /></div></div>}<Button disabled={createCustom.isPending || createByType.isPending}><Plus className="mr-2 h-4 w-4" />建立</Button></form></details></Card>
      <div className="space-y-5"><Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-bold">{period?.label || "選擇薪資週期"}</h3><p className="mt-1 text-sm text-slate-500">{period ? `${period.periodStart} 至 ${period.periodEnd} · ${periodTypes[period.periodType] ?? "自訂區間"} · ${statuses[period.status]}` : ""}</p></div>{period && <div className="flex flex-wrap gap-2">{isMutable && <Button variant="outline" disabled={calculateBatch.isPending || !employees.data?.length} onClick={() => calculateBatch.mutate({ payrollPeriodId: period.id, employeeIds: employees.data?.map((item) => item.id) ?? [] })}><Sparkles className="mr-2 h-4 w-4" />全員批次試算</Button>}{nextStatus && <Button disabled={transition.isPending} onClick={() => transition.mutate({ id: period.id, status: nextStatus })}>{nextStatus === "confirmed" ? <LockKeyhole className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}{statuses[nextStatus]}</Button>}</div>}</div></Card>
        <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-5 py-3">員工</th><th className="px-5 py-3">應發</th><th className="px-5 py-3">扣款</th><th className="px-5 py-3">實發</th><th className="px-5 py-3">狀態</th><th className="px-5 py-3">操作</th></tr></thead><tbody>{employees.data?.map((employee) => { const row = runs.data?.find((item) => item.employeeId === employee.id); return <tr className="border-t" key={employee.id}><td className="px-5 py-3 font-medium">{employee.name}</td><td className="px-5 py-3">{row ? formatTwd(row.grossPay) : "—"}</td><td className="px-5 py-3">{row ? formatTwd(row.deductionTotal) : "—"}</td><td className="px-5 py-3 font-semibold">{row ? formatTwd(row.netPay) : "—"}</td><td className="px-5 py-3">{row ? statuses[row.status] : "未試算"}</td><td className="px-5 py-3">{isMutable ? <Button size="sm" disabled={!period || calculate.isPending} onClick={() => period && calculate.mutate({ payrollPeriodId: period.id, employeeId: employee.id })}><Calculator className="mr-1 h-3 w-3" />{row ? "重新試算" : "試算"}</Button> : <span className="text-xs text-slate-500">已鎖定</span>}</td></tr>; })}{!employees.data?.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">請先建立員工資料。</td></tr>}</tbody></table></div></Card></div>
      <Card className="h-fit p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">薪資異常</h3><p className="mt-1 text-xs text-slate-500">設定、出勤、加班與未確認薪資檢核</p></div><Button variant="outline" size="icon" aria-label="更新薪資警示" disabled={refreshAlerts.isPending} onClick={() => refreshAlerts.mutate({ payrollPeriodId: activePeriodId ?? undefined })}><RefreshCw className={`h-4 w-4 ${refreshAlerts.isPending ? "animate-spin" : ""}`} /></Button></div><div className="mt-4 space-y-3">{alerts.data?.filter((item) => !item.isResolved).slice(0, 8).map((item) => <div className="rounded-xl border border-amber-200 bg-amber-50 p-3" key={item.id}><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div className="min-w-0"><p className="text-sm font-medium capitalize text-amber-950">{item.type.replace(/_/g, " ")}</p><p className="mt-1 text-xs text-amber-800">{item.message}</p><button type="button" className="mt-2 text-xs font-semibold text-[#163C72] hover:underline" onClick={() => resolveAlert.mutate({ id: item.id })}>標記已處理</button></div></div></div>)}{!alerts.data?.filter((item) => !item.isResolved).length && <p className="py-8 text-center text-sm text-slate-500">目前沒有待處理異常。</p>}</div></Card>
    </div>
  </HRLayout>;
}
