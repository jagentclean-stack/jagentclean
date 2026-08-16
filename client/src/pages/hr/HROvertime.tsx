import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Eye, Loader2, Pencil, Plus, X, XCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { formatTwd, HRLayout, monthRange } from "./HRLayout";

type Form = { employeeId: string; workDate: string; startTime: string; endTime: string; hours: string; multiplier: string; calculatedAmount: string; manualAmount: string; notes: string };
type Entry = Form & { id: number };
const empty = (): Form => ({ employeeId: "", workDate: new Date().toISOString().slice(0, 10), startTime: "", endTime: "", hours: "", multiplier: "1.00", calculatedAmount: "", manualAmount: "", notes: "" });

function Fields({ value, onChange, employees, disabled }: { value: Form; onChange: (next: Form) => void; employees: { id: number; name: string }[]; disabled: boolean }) {
  const change = (key: keyof Form, next: string) => onChange({ ...value, [key]: next });
  return <div className="grid gap-4 md:grid-cols-4">
    <div><Label>員工</Label><select required value={value.employeeId} disabled={disabled} onChange={(e) => change("employeeId", e.target.value)} className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">選擇員工</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    <div><Label>加班日期</Label><Input type="date" required value={value.workDate} disabled={disabled} onChange={(e) => change("workDate", e.target.value)} /></div>
    <div><Label>開始／結束</Label><div className="flex gap-2"><Input type="time" required value={value.startTime} disabled={disabled} onChange={(e) => change("startTime", e.target.value)} /><Input type="time" required value={value.endTime} disabled={disabled} onChange={(e) => change("endTime", e.target.value)} /></div></div>
    <div><Label>加班時數</Label><Input type="number" min="0" step="0.25" required value={value.hours} disabled={disabled} onChange={(e) => change("hours", e.target.value)} /></div>
    <div><Label>加班倍率</Label><Input type="number" min="1" step="0.01" required value={value.multiplier} disabled={disabled} onChange={(e) => change("multiplier", e.target.value)} /></div>
    <div><Label>計算金額</Label><Input type="number" min="0" step="1" required value={value.calculatedAmount} disabled={disabled} onChange={(e) => change("calculatedAmount", e.target.value)} /></div>
    <div><Label>人工覆寫金額</Label><Input type="number" min="0" step="1" value={value.manualAmount} disabled={disabled} onChange={(e) => change("manualAmount", e.target.value)} /></div>
    <div className="md:col-span-4"><Label>備註</Label><Input value={value.notes} disabled={disabled} placeholder="選填：加班原因或現場說明" onChange={(e) => change("notes", e.target.value)} /></div>
  </div>;
}

export default function HROvertime() {
  const range = monthRange(); const employees = trpc.payroll.employees.list.useQuery(); const access = trpc.payroll.access.useQuery(); const rows = trpc.payroll.overtime.list.useQuery({ startDate: range.start, endDate: range.end }); const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false); const [createForm, setCreateForm] = useState<Form>(empty); const [editing, setEditing] = useState<Entry | null>(null); const [viewing, setViewing] = useState<Entry | null>(null);
  const refresh = () => { void utils.payroll.overtime.list.invalidate(); void utils.payroll.runs.list.invalidate(); };
  const create = trpc.payroll.overtime.create.useMutation({ onSuccess: () => { toast.success("加班申請已建立"); setCreateOpen(false); setCreateForm(empty()); refresh(); }, onError: (e) => toast.error(e.message) });
  const update = trpc.payroll.overtime.update.useMutation({ onSuccess: () => { toast.success("加班紀錄已更新，並已留下稽核紀錄"); setEditing(null); refresh(); }, onError: (e) => toast.error(e.message || "無法更新加班紀錄") });
  const review = trpc.payroll.overtime.review.useMutation({ onSuccess: () => { toast.success("加班審核已更新"); refresh(); }, onError: (e) => toast.error(e.message) });
  const payload = (form: Form) => ({ employeeId: Number(form.employeeId), workDate: form.workDate, startTime: form.startTime, endTime: form.endTime, hours: form.hours, multiplier: form.multiplier, calculatedAmount: form.calculatedAmount, manualAmount: form.manualAmount || null, notes: form.notes.trim() || null });
  const map = (row: any): Entry => ({ id: row.id, employeeId: String(row.employeeId), workDate: row.workDate, startTime: row.startTime, endTime: row.endTime, hours: String(row.hours), multiplier: String(row.multiplier), calculatedAmount: String(row.calculatedAmount), manualAmount: row.manualAmount == null ? "" : String(row.manualAmount), notes: row.notes || "" });
  const employeeOptions = employees.data?.map((item) => ({ id: item.id, name: item.name })) || [];
  return <HRLayout title="加班管理" description="可檢視、編輯、審核加班資料；已確認或已發薪週期的紀錄會受到鎖定保護。">
    <div className="flex justify-between"><p className="text-sm text-slate-500">本月加班申請與審核</p><Button className="bg-[#163C72]" onClick={() => setCreateOpen((value) => !value)}><Plus className="mr-2 h-4 w-4" />新增加班</Button></div>
    {createOpen && <Card className="mt-5 p-5"><form onSubmit={(e: FormEvent) => { e.preventDefault(); create.mutate(payload(createForm)); }}><Fields value={createForm} onChange={setCreateForm} employees={employeeOptions} disabled={create.isPending} /><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>取消</Button><Button disabled={create.isPending}>{create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}儲存加班</Button></div></form></Card>}
    {viewing && <Card role="dialog" aria-label="檢視加班紀錄" className="mt-5 border-blue-100 p-5"><div className="flex justify-between"><div><h2 className="font-semibold text-[#163C72]">加班明細</h2><p className="mt-1 text-sm text-slate-500">{viewing.workDate} {viewing.startTime}–{viewing.endTime}・{viewing.hours} 小時・倍率 {viewing.multiplier}</p><p className="mt-2 font-medium">加班費 {formatTwd(viewing.manualAmount || viewing.calculatedAmount)}</p><p className="mt-2 text-sm text-slate-600">{viewing.notes || "未填寫備註"}</p></div><Button size="icon" variant="ghost" onClick={() => setViewing(null)}><X className="h-4 w-4" /></Button></div></Card>}
    {editing && <Card role="dialog" aria-label="編輯加班紀錄" className="mt-5 border-[#8CC63F] p-5"><div className="mb-4 flex justify-between"><div><h2 className="font-semibold text-[#163C72]">編輯加班紀錄</h2><p className="mt-1 text-sm text-slate-600">儲存後會記錄修改前後資料；已確認或已發薪週期不能直接修改。</p></div><Button size="icon" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button></div><form onSubmit={(e: FormEvent) => { e.preventDefault(); update.mutate({ id: editing.id, ...payload(editing) }); }}><Fields value={editing} onChange={(next) => setEditing({ ...editing, ...next })} employees={employeeOptions} disabled={update.isPending} /><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>取消</Button><Button disabled={update.isPending}>{update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}儲存變更</Button></div></form></Card>}
    <Card className="mt-5 overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-5 py-3">日期／員工</th><th className="px-5 py-3">時數</th><th className="px-5 py-3">加班費</th><th className="px-5 py-3">狀態</th><th className="px-5 py-3 text-right">操作</th></tr></thead><tbody>{rows.data?.map((row) => <tr className="border-t" key={row.id}><td className="px-5 py-3"><p>{row.workDate}</p><p className="text-xs text-slate-500">{employees.data?.find((item) => item.id === row.employeeId)?.name || `#${row.employeeId}`}</p></td><td className="px-5 py-3">{row.hours} 小時</td><td className="px-5 py-3">{formatTwd(row.manualAmount || row.calculatedAmount)}</td><td className="px-5 py-3">{row.status}</td><td className="px-5 py-3 text-right"><div className="inline-flex gap-2"><Button size="sm" variant="outline" onClick={() => setViewing(map(row))}><Eye className="mr-1 h-3 w-3" />檢視</Button><Button size="sm" variant="outline" onClick={() => setEditing(map(row))}><Pencil className="mr-1 h-3 w-3" />編輯</Button>{row.status === "pending" && access.data?.canManageOperations && <><Button size="sm" onClick={() => review.mutate({ id: row.id, status: "approved" })}><CheckCircle2 className="mr-1 h-3 w-3" />核准</Button><Button size="sm" variant="outline" onClick={() => review.mutate({ id: row.id, status: "rejected" })}><XCircle className="mr-1 h-3 w-3" />退回</Button></>}</div></td></tr>)}{!rows.data?.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">本期間尚無加班資料。</td></tr>}</tbody></table></div></Card>
  </HRLayout>;
}
