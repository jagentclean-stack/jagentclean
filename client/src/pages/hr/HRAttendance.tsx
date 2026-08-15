import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import React, { FormEvent, useState } from "react";
import { toast } from "sonner";
import { HRLayout, monthRange } from "./HRLayout";

type AttendanceStatus = "present" | "leave" | "day_off" | "absent" | "late" | "early_leave" | "half_day" | "emergency_overtime";

type AttendanceForm = {
  employeeId: string;
  workDate: string;
  workHours: string;
  status: AttendanceStatus;
  actualStartTime: string;
  actualEndTime: string;
  lateMinutes: string;
  earlyLeaveMinutes: string;
  mealAllowance: string;
  notes: string;
};

type EditableAttendance = AttendanceForm & { id: number; scheduleId: number | null };

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "正常出勤",
  half_day: "半日",
  late: "遲到",
  early_leave: "早退",
  leave: "請假",
  day_off: "休假",
  absent: "未到",
  emergency_overtime: "臨時加班",
};

const EMPTY_FORM: AttendanceForm = {
  employeeId: "",
  workDate: new Date().toISOString().slice(0, 10),
  workHours: "8",
  status: "present",
  actualStartTime: "",
  actualEndTime: "",
  lateMinutes: "0",
  earlyLeaveMinutes: "0",
  mealAllowance: "0.00",
  notes: "",
};

function normalizeTime(value: string | null | undefined) {
  return value || "";
}

function AttendanceFields({ value, onChange, employees, disabled, prefix }: { value: AttendanceForm; onChange: (next: AttendanceForm) => void; employees: Array<{ id: number; name: string }>; disabled: boolean; prefix: string }) {
  const change = (field: keyof AttendanceForm, nextValue: string) => onChange({ ...value, [field]: nextValue });
  return <div className="grid gap-4 md:grid-cols-4">
    <div><Label htmlFor={`${prefix}-employee`}>員工</Label><select id={`${prefix}-employee`} required value={value.employeeId} onChange={(event) => change("employeeId", event.target.value)} disabled={disabled} className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">選擇員工</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></div>
    <div><Label htmlFor={`${prefix}-date`}>日期</Label><Input id={`${prefix}-date`} type="date" required value={value.workDate} onChange={(event) => change("workDate", event.target.value)} disabled={disabled} /></div>
    <div><Label htmlFor={`${prefix}-hours`}>工時</Label><Input id={`${prefix}-hours`} type="number" min="0" step="0.25" required value={value.workHours} onChange={(event) => change("workHours", event.target.value)} disabled={disabled} /></div>
    <div><Label htmlFor={`${prefix}-status`}>狀態</Label><select id={`${prefix}-status`} value={value.status} onChange={(event) => change("status", event.target.value)} disabled={disabled} className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{Object.entries(STATUS_LABELS).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></div>
    <div><Label htmlFor={`${prefix}-start`}>實際上班</Label><Input id={`${prefix}-start`} type="time" value={value.actualStartTime} onChange={(event) => change("actualStartTime", event.target.value)} disabled={disabled} /></div>
    <div><Label htmlFor={`${prefix}-end`}>實際下班</Label><Input id={`${prefix}-end`} type="time" value={value.actualEndTime} onChange={(event) => change("actualEndTime", event.target.value)} disabled={disabled} /></div>
    <div><Label htmlFor={`${prefix}-late`}>遲到分鐘</Label><Input id={`${prefix}-late`} type="number" min="0" value={value.lateMinutes} onChange={(event) => change("lateMinutes", event.target.value)} disabled={disabled} /></div>
    <div><Label htmlFor={`${prefix}-early`}>早退分鐘</Label><Input id={`${prefix}-early`} type="number" min="0" value={value.earlyLeaveMinutes} onChange={(event) => change("earlyLeaveMinutes", event.target.value)} disabled={disabled} /></div>
    <div><Label htmlFor={`${prefix}-meal`}>餐費</Label><Input id={`${prefix}-meal`} type="number" min="0" step="1" value={value.mealAllowance} onChange={(event) => change("mealAllowance", event.target.value)} disabled={disabled} /></div>
    <div className="md:col-span-3"><Label htmlFor={`${prefix}-notes`}>備註</Label><Input id={`${prefix}-notes`} value={value.notes} onChange={(event) => change("notes", event.target.value)} placeholder="選填：現場狀況或補充說明" disabled={disabled} /></div>
  </div>;
}

export default function HRAttendance() {
  const range = monthRange();
  const employees = trpc.payroll.employees.list.useQuery();
  const records = trpc.payroll.attendance.list.useQuery({ startDate: range.start, endDate: range.end });
  const utils = trpc.useUtils();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<AttendanceForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<EditableAttendance | null>(null);

  const refresh = () => void utils.payroll.attendance.list.invalidate();
  const create = trpc.payroll.attendance.create.useMutation({
    onSuccess: () => { toast.success("出勤紀錄已儲存"); setCreateForm(EMPTY_FORM); setIsCreateOpen(false); refresh(); },
    onError: (error) => toast.error(error.message || "無法儲存出勤紀錄"),
  });
  const update = trpc.payroll.attendance.update.useMutation({
    onSuccess: () => { toast.success("出勤紀錄已更新，並已留下稽核紀錄"); setEditing(null); refresh(); },
    onError: (error) => toast.error(error.message || "無法更新出勤紀錄"),
  });

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    create.mutate({ employeeId: Number(createForm.employeeId), workDate: createForm.workDate, workHours: createForm.workHours, status: createForm.status, actualStartTime: createForm.actualStartTime || null, actualEndTime: createForm.actualEndTime || null, lateMinutes: Number(createForm.lateMinutes || 0), earlyLeaveMinutes: Number(createForm.earlyLeaveMinutes || 0), mealAllowance: createForm.mealAllowance || "0.00", notes: createForm.notes.trim() || null });
  };

  const submitUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    update.mutate({ id: editing.id, employeeId: Number(editing.employeeId), scheduleId: editing.scheduleId, workDate: editing.workDate, workHours: editing.workHours, status: editing.status, actualStartTime: editing.actualStartTime || null, actualEndTime: editing.actualEndTime || null, lateMinutes: Number(editing.lateMinutes || 0), earlyLeaveMinutes: Number(editing.earlyLeaveMinutes || 0), mealAllowance: editing.mealAllowance || "0.00", notes: editing.notes.trim() || null });
  };

  const beginEdit = (row: { id: number; employeeId: number; scheduleId: number | null; workDate: string; workHours: unknown; status: string; actualStartTime: string | null; actualEndTime: string | null; lateMinutes: number; earlyLeaveMinutes: number; mealAllowance: unknown; notes: string | null }) => {
    setEditing({ id: row.id, scheduleId: row.scheduleId, employeeId: String(row.employeeId), workDate: row.workDate, workHours: String(row.workHours), status: row.status as AttendanceStatus, actualStartTime: normalizeTime(row.actualStartTime), actualEndTime: normalizeTime(row.actualEndTime), lateMinutes: String(row.lateMinutes), earlyLeaveMinutes: String(row.earlyLeaveMinutes), mealAllowance: String(row.mealAllowance), notes: row.notes || "" });
  };

  const employeeOptions = employees.data?.map((employee) => ({ id: employee.id, name: employee.name })) || [];

  return <HRLayout title="出勤管理" description="記錄實際出退勤、工時、遲到、早退、請假與餐費；修改資料會保留操作稽核。">
    <div className="flex items-center justify-between gap-4"><p className="text-sm text-slate-500">本月出勤</p><Button onClick={() => setIsCreateOpen((current) => !current)} className="bg-[#163C72]"><Plus className="mr-2 h-4 w-4" />新增出勤</Button></div>

    {isCreateOpen && <Card className="mt-5 border-blue-100 p-5"><form onSubmit={submitCreate}><AttendanceFields value={createForm} onChange={setCreateForm} employees={employeeOptions} disabled={create.isPending} prefix="create" /><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={create.isPending}>取消</Button><Button disabled={create.isPending} className="bg-[#163C72]">{create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}儲存出勤</Button></div></form></Card>}

    {editing && <Card role="dialog" aria-label="編輯出勤紀錄" className="mt-5 border-[#8CC63F] p-5 shadow-sm"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="font-semibold text-[#163C72]">編輯出勤紀錄</h2><p className="mt-1 text-sm text-slate-600">儲存後會記錄修改前後資料。若此日期落在已確認或已發薪週期，系統會拒絕直接修改。</p></div><Button type="button" variant="ghost" size="icon" aria-label="關閉編輯" onClick={() => setEditing(null)} disabled={update.isPending}><X className="h-4 w-4" /></Button></div><form onSubmit={submitUpdate}><AttendanceFields value={editing} onChange={(next) => setEditing({ ...editing, ...next })} employees={employeeOptions} disabled={update.isPending} prefix="edit" /><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={update.isPending}>取消</Button><Button disabled={update.isPending} className="bg-[#163C72]">{update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}儲存變更</Button></div></form></Card>}

    <Card className="mt-5 overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-5 py-3">日期</th><th className="px-5 py-3">員工</th><th className="px-5 py-3">工時</th><th className="px-5 py-3">狀態</th><th className="px-5 py-3">遲到／早退</th><th className="px-5 py-3 text-right">操作</th></tr></thead><tbody>{records.data?.map((row) => <tr key={row.id} className="border-t"><td className="px-5 py-3">{row.workDate}</td><td className="px-5 py-3">{employees.data?.find((employee) => employee.id === row.employeeId)?.name || `#${row.employeeId}`}</td><td className="px-5 py-3">{row.workHours} 小時</td><td className="px-5 py-3">{STATUS_LABELS[row.status as AttendanceStatus] || row.status}</td><td className="px-5 py-3">{row.lateMinutes}／{row.earlyLeaveMinutes} 分鐘</td><td className="px-5 py-3 text-right"><Button size="sm" variant="outline" aria-label={`編輯 ${row.workDate} 出勤紀錄`} onClick={() => beginEdit(row)}><Pencil className="mr-1 h-4 w-4" />編輯</Button></td></tr>)}{!records.data?.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">本期間尚無出勤資料。</td></tr>}</tbody></table></div></Card>
  </HRLayout>;
}
