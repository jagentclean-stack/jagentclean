import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CalendarClock, ChevronRight, DollarSign, History, Loader2, Pencil, Plus, ReceiptText, Search, Trash2, UserRound, X } from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { HRLayout } from "./HRLayout";

const currency = (value: string | number | null | undefined) => `$${Number(value ?? 0).toLocaleString("zh-TW", { maximumFractionDigits: 0 })}`;
const today = () => new Date().toISOString().slice(0, 10);
type DetailTab = "profile" | "salary" | "adjustments" | "payslips";

function snapshotAmount(snapshot: unknown, field: string) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return "—";
  const value = (snapshot as Record<string, unknown>)[field];
  return value === null || value === undefined ? "—" : currency(String(value));
}

export default function HREmployees() {
  const access = trpc.payroll.access.useQuery();
  const employees = trpc.payroll.employees.list.useQuery(undefined, { enabled: access.data?.canManageOperations });
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("profile");
  const [editingProfile, setEditingProfile] = useState(false);
  const selectedEmployee = useMemo(() => (employees.data ?? []).find((employee) => employee.id === selectedEmployeeId) ?? null, [employees.data, selectedEmployeeId]);
  const rows = useMemo(() => (employees.data ?? []).filter((item) => `${item.name}${item.employeeCode ?? ""}${item.phone ?? ""}`.toLowerCase().includes(query.toLowerCase())), [employees.data, query]);
  const employeeIdInput = selectedEmployeeId ?? 0;
  const salaryConfigs = trpc.payroll.employees.salaryConfig.useQuery({ employeeId: employeeIdInput }, { enabled: Boolean(selectedEmployeeId) && Boolean(access.data?.canManagePayroll) });
  const adjustments = trpc.payroll.employees.salaryAdjustmentHistory.useQuery({ employeeId: employeeIdInput }, { enabled: Boolean(selectedEmployeeId) && Boolean(access.data?.canManagePayroll) });
  const payslips = trpc.payroll.employees.payslipHistory.useQuery({ employeeId: employeeIdInput }, { enabled: Boolean(selectedEmployeeId) && Boolean(access.data?.canManagePayroll) });
  const create = trpc.payroll.employees.create.useMutation({
    onSuccess: (result) => {
      toast.success(`員工資料已建立（${result.employeeCode}）`);
      setShowCreate(false);
      void utils.payroll.employees.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateSalary = trpc.payroll.employees.updateSalaryConfig.useMutation({
    onSuccess: () => {
      toast.success("薪資設定已儲存，並已建立薪資調整紀錄");
      void Promise.all([
        utils.payroll.employees.salaryConfig.invalidate(),
        utils.payroll.employees.salaryAdjustmentHistory.invalidate(),
        utils.payroll.periods.invalidate(),
      ]);
      setDetailTab("adjustments");
    },
    onError: (error) => toast.error(error.message),
  });
  const updateEmployee = trpc.payroll.employees.update.useMutation({
    onSuccess: () => {
      toast.success("員工基本資料已更新");
      setEditingProfile(false);
      void utils.payroll.employees.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const removeEmployee = trpc.payroll.employees.delete.useMutation({
    onSuccess: (result) => {
      toast.success(result.mode === "hard" ? "員工資料已永久刪除" : "員工已有歷史資料，已安全改為停用");
      setSelectedEmployeeId(null);
      setEditingProfile(false);
      void utils.payroll.employees.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const createEmployee = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      name: String(form.get("name")),
      nickname: String(form.get("nickname") || "") || null,
      phone: String(form.get("phone") || "") || null,
      email: String(form.get("email") || "") || null,
      nationalId: String(form.get("nationalId") || "") || null,
      gender: String(form.get("gender") || "unspecified") as "female" | "male" | "other" | "unspecified",
      birthDate: String(form.get("birthDate") || "") || null,
      address: String(form.get("address") || "") || null,
      emergencyContactName: String(form.get("emergencyContactName") || "") || null,
      emergencyContactPhone: String(form.get("emergencyContactPhone") || "") || null,
      jobTitle: String(form.get("jobTitle") || "") || null,
      hireDate: String(form.get("hireDate")),
      employmentStatus: String(form.get("employmentStatus") || "active") as "active" | "inactive" | "leave_of_absence" | "terminated",
      bankName: String(form.get("bankName") || "") || null,
      bankAccount: String(form.get("bankAccount") || "") || null,
      notes: String(form.get("notes") || "") || null,
    });
  };
  const saveSalary = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEmployeeId) return;
    const form = new FormData(event.currentTarget);
    const amount = (key: string) => String(form.get(key) || "0");
    const optionalAmount = (key: string) => String(form.get(key) || "") || null;
    updateSalary.mutate({
      employeeId: selectedEmployeeId,
      effectiveFrom: String(form.get("effectiveFrom")),
      effectiveTo: String(form.get("effectiveTo") || "") || null,
      reason: String(form.get("reason") || "") || null,
      salaryType: String(form.get("salaryType")) as "daily" | "hourly" | "monthly" | "special",
      dailyRate: optionalAmount("dailyRate"),
      hourlyRate: optionalAmount("hourlyRate"),
      monthlyRate: optionalAmount("monthlyRate"),
      mealAllowance: amount("mealAllowance"),
      supervisorAllowance: amount("supervisorAllowance"),
      drivingAllowance: amount("drivingAllowance"),
      transportationAllowance: amount("transportationAllowance"),
      otherAllowance: amount("otherAllowance"),
      overtimeMode: String(form.get("overtimeMode")) as "manual" | "hourly_multiplier" | "fixed",
      overtimeMultiplier: amount("overtimeMultiplier"),
      overtimeFixedRate: optionalAmount("overtimeFixedRate"),
    });
  };
  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEmployeeId) return;
    const form = new FormData(event.currentTarget);
    const textOrNull = (key: string) => String(form.get(key) || "") || null;
    updateEmployee.mutate({
      id: selectedEmployeeId,
      name: String(form.get("name")),
      nickname: textOrNull("nickname"),
      phone: textOrNull("phone"),
      email: textOrNull("email"),
      address: textOrNull("address"),
      jobTitle: textOrNull("jobTitle"),
      hireDate: String(form.get("hireDate")),
      employmentStatus: String(form.get("employmentStatus")) as "active" | "inactive" | "leave_of_absence" | "terminated",
      terminationDate: textOrNull("terminationDate"),
      bankName: textOrNull("bankName"),
      notes: textOrNull("notes"),
    });
  };
  const requestRemoveEmployee = () => {
    if (!selectedEmployee || !window.confirm(`確定要刪除「${selectedEmployee.name}」嗎？若已有排班、出勤或薪資歷史，系統會保留資料並改為停用。`)) return;
    removeEmployee.mutate({ id: selectedEmployee.id });
  };
  const activeConfig = salaryConfigs.data?.[0];

  return <HRLayout title="員工管理" description="管理員工主檔、薪資設定、調整歷史與已領薪資。薪資調整採有效日期版本化，不會改寫既有薪資條。">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="搜尋姓名、員工編號或電話"/></div>
      {access.data?.canManagePayroll && <Button className="bg-[#163C72] hover:bg-[#102e59]" onClick={() => setShowCreate((open) => !open)}><Plus className="mr-2 h-4 w-4"/>新增員工</Button>}
    </div>

    {showCreate && <Card className="mt-5 border-slate-200 p-5"><div className="mb-4 flex items-center gap-2 text-sm text-slate-600"><UserRound className="h-4 w-4 text-[#163C72]"/>員工編號將於建立時由系統自動產生（例如 EMP-001）。建立後，點選該員工即可輸入薪資設定。</div><form className="grid gap-4 md:grid-cols-3" onSubmit={createEmployee}><div><Label>姓名 *</Label><Input name="name" required /></div><div><Label>暱稱</Label><Input name="nickname"/></div><div><Label>員工編號</Label><Input disabled value="系統自動產生"/></div><div><Label>到職日期 *</Label><Input name="hireDate" type="date" defaultValue={today()} required/></div><div><Label>在職狀態</Label><select name="employmentStatus" defaultValue="active" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="active">在職</option><option value="inactive">停用</option><option value="leave_of_absence">留職停薪</option><option value="terminated">離職</option></select></div><div><Label>職稱</Label><Input name="jobTitle"/></div><div><Label>電話</Label><Input name="phone"/></div><div><Label>電子信箱</Label><Input name="email" type="email"/></div><div><Label>性別</Label><select name="gender" defaultValue="unspecified" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="unspecified">未填寫</option><option value="female">女性</option><option value="male">男性</option><option value="other">其他</option></select></div><div><Label>身分證字號（加密儲存）</Label><Input name="nationalId"/></div><div><Label>出生日期</Label><Input name="birthDate" type="date"/></div><div><Label>銀行名稱</Label><Input name="bankName"/></div><div className="md:col-span-2"><Label>地址</Label><Input name="address"/></div><div><Label>銀行帳號（加密儲存）</Label><Input name="bankAccount" inputMode="numeric"/></div><div><Label>緊急聯絡人</Label><Input name="emergencyContactName"/></div><div><Label>緊急聯絡電話</Label><Input name="emergencyContactPhone"/></div><div className="md:col-span-3"><Label>備註</Label><textarea name="notes" className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/></div><div className="flex items-end gap-2"><Button disabled={create.isPending}>{create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}建立員工</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>取消</Button></div></form></Card>}

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_500px]">
      <Card className="overflow-hidden border-slate-200 shadow-sm"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3">員工</th><th className="px-5 py-3">職稱</th><th className="px-5 py-3">電話</th><th className="px-5 py-3">銀行</th><th className="px-5 py-3">狀態</th><th className="px-5 py-3 text-right">檢視</th></tr></thead><tbody>{employees.isLoading ? <tr><td colSpan={6} className="px-5 py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin"/></td></tr> : rows.map((employee) => <tr key={employee.id} className={`cursor-pointer border-t border-slate-100 transition-colors hover:bg-blue-50/50 ${selectedEmployeeId === employee.id ? "bg-blue-50" : ""}`} onClick={() => { setSelectedEmployeeId(employee.id); setDetailTab("profile"); }}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{employee.name}</p><p className="text-xs text-slate-500">{employee.employeeCode || "建立後將補上編號"}</p></td><td className="px-5 py-4">{employee.jobTitle || "—"}</td><td className="px-5 py-4">{employee.phone || "—"}</td><td className="px-5 py-4">{employee.bankName ? `${employee.bankName} ${employee.bankAccountMasked || ""}` : "未設定"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${employee.employmentStatus === "active" ? "bg-lime-100 text-lime-800" : "bg-slate-100 text-slate-600"}`}>{employee.employmentStatus === "active" ? "在職" : employee.employmentStatus}</span></td><td className="px-5 py-4 text-right"><ChevronRight className="ml-auto h-4 w-4 text-slate-400"/></td></tr>)}{!employees.isLoading && rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">尚無符合條件的員工資料。</td></tr>}</tbody></table></div></Card>

      <Card className="min-h-[560px] border-slate-200 shadow-sm">{!selectedEmployee ? <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-8 text-center text-slate-500"><UserRound className="mb-3 h-10 w-10 text-slate-300"/><p className="font-medium text-slate-700">選取一位員工以管理薪資</p><p className="mt-1 text-sm">可直接輸入薪資設定、追溯調整前後金額，並查閱已領薪資。</p></div> : <div className="flex h-full flex-col"><div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-lg font-bold text-[#163C72]">{selectedEmployee.name}</p><p className="text-sm text-slate-500">{selectedEmployee.employeeCode || "未設定編號"} · {selectedEmployee.jobTitle || "未設定職稱"}</p></div><Button variant="ghost" size="icon" aria-label="關閉員工明細" onClick={() => setSelectedEmployeeId(null)}><X className="h-4 w-4"/></Button></div><div className="grid grid-cols-4 border-b border-slate-100 px-3"><button type="button" onClick={() => setDetailTab("profile")} className={`px-2 py-3 text-xs font-medium ${detailTab === "profile" ? "border-b-2 border-[#8CC63F] text-[#163C72]" : "text-slate-500"}`}>基本資料</button><button type="button" onClick={() => setDetailTab("salary")} className={`px-2 py-3 text-xs font-medium ${detailTab === "salary" ? "border-b-2 border-[#8CC63F] text-[#163C72]" : "text-slate-500"}`}>薪資設定</button><button type="button" onClick={() => setDetailTab("adjustments")} className={`px-2 py-3 text-xs font-medium ${detailTab === "adjustments" ? "border-b-2 border-[#8CC63F] text-[#163C72]" : "text-slate-500"}`}>調整紀錄</button><button type="button" onClick={() => setDetailTab("payslips")} className={`px-2 py-3 text-xs font-medium ${detailTab === "payslips" ? "border-b-2 border-[#8CC63F] text-[#163C72]" : "text-slate-500"}`}>薪資歷史</button></div>
        <div className="flex-1 overflow-y-auto p-5">
          {detailTab === "profile" && <div className="space-y-4">{editingProfile ? <form className="space-y-4" onSubmit={saveProfile}><div className="grid grid-cols-2 gap-3"><div><Label>姓名 *</Label><Input name="name" defaultValue={selectedEmployee.name} required/></div><div><Label>暱稱</Label><Input name="nickname" defaultValue={selectedEmployee.nickname || ""}/></div><div><Label>電話</Label><Input name="phone" defaultValue={selectedEmployee.phone || ""}/></div><div><Label>電子信箱</Label><Input name="email" type="email" defaultValue={selectedEmployee.email || ""}/></div><div><Label>職稱</Label><Input name="jobTitle" defaultValue={selectedEmployee.jobTitle || ""}/></div><div><Label>到職日期 *</Label><Input name="hireDate" type="date" defaultValue={selectedEmployee.hireDate} required/></div><div><Label>在職狀態</Label><select name="employmentStatus" defaultValue={selectedEmployee.employmentStatus} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="active">在職</option><option value="inactive">停用</option><option value="leave_of_absence">留職停薪</option><option value="terminated">離職</option></select></div><div><Label>離職／停用日期</Label><Input name="terminationDate" type="date" defaultValue={selectedEmployee.terminationDate || ""}/></div><div className="col-span-2"><Label>地址</Label><Input name="address" defaultValue={selectedEmployee.address || ""}/></div><div><Label>銀行名稱</Label><Input name="bankName" defaultValue={selectedEmployee.bankName || ""}/></div><div><Label>銀行帳號</Label><Input disabled value={selectedEmployee.bankAccountMasked ? `已設定（${selectedEmployee.bankAccountMasked}）` : "未設定"}/></div><div className="col-span-2"><Label>備註</Label><textarea name="notes" defaultValue={selectedEmployee.notes || ""} className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/></div></div><div className="flex gap-2"><Button type="submit" disabled={updateEmployee.isPending}>{updateEmployee.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}儲存基本資料</Button><Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>取消</Button></div></form> : <><div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => setEditingProfile(true)}><Pencil className="mr-1 h-3.5 w-3.5"/>編輯資料</Button></div><div className="rounded-xl bg-slate-50 p-4 text-sm"><div className="grid gap-3 sm:grid-cols-2"><p><span className="text-slate-500">到職日期</span><br/>{selectedEmployee.hireDate}</p><p><span className="text-slate-500">狀態</span><br/>{selectedEmployee.employmentStatus === "active" ? "在職" : selectedEmployee.employmentStatus}</p><p><span className="text-slate-500">電話</span><br/>{selectedEmployee.phone || "—"}</p><p><span className="text-slate-500">電子信箱</span><br/>{selectedEmployee.email || "—"}</p><p><span className="text-slate-500">銀行資料</span><br/>{selectedEmployee.bankName ? `${selectedEmployee.bankName} ${selectedEmployee.bankAccountMasked || ""}` : "未設定"}</p><p><span className="text-slate-500">備註</span><br/>{selectedEmployee.notes || "—"}</p></div></div><div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><DollarSign className="mr-1 inline h-4 w-4"/>請切換至「薪資設定」輸入日薪、時薪、月薪、餐費、津貼與加班規則；調整後會保留不可變更的稽核紀錄。</div><div className="border-t border-slate-100 pt-4"><Button type="button" variant="destructive" size="sm" disabled={removeEmployee.isPending} onClick={requestRemoveEmployee}>{removeEmployee.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin"/> : <Trash2 className="mr-1 h-3.5 w-3.5"/>}刪除／停用員工</Button><p className="mt-2 text-xs text-slate-500">已有排班、出勤、薪資設定、調整紀錄或薪資條時，系統會保留歷史並安全改為停用。</p></div></>}</div>}
          {detailTab === "salary" && <form key={`${selectedEmployee.id}-${activeConfig?.id ?? "new"}`} className="space-y-4" onSubmit={saveSalary}><div className="rounded-xl border border-lime-200 bg-lime-50 p-3 text-xs leading-5 text-slate-700"><CalendarClock className="mr-1 inline h-4 w-4 text-lime-700"/>以「生效日」建立薪資版本。已確認或已發薪的歷史薪資條保留原始快照，不會因本次調整而改變。</div><div className="grid grid-cols-2 gap-3"><div><Label>生效日期 *</Label><Input name="effectiveFrom" type="date" defaultValue={activeConfig?.effectiveFrom || today()} required/></div><div><Label>結束日期（選填）</Label><Input name="effectiveTo" type="date" defaultValue={activeConfig?.effectiveTo || ""}/></div></div><div><Label>薪資類型 *</Label><select name="salaryType" defaultValue={activeConfig?.salaryType || "daily"} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="daily">日薪</option><option value="hourly">時薪</option><option value="monthly">月薪</option><option value="special">特殊薪資</option></select></div><div className="grid grid-cols-3 gap-3"><div><Label>基本日薪</Label><Input name="dailyRate" inputMode="decimal" defaultValue={activeConfig?.dailyRate || ""} placeholder="1600"/></div><div><Label>基本時薪</Label><Input name="hourlyRate" inputMode="decimal" defaultValue={activeConfig?.hourlyRate || ""} placeholder="200"/></div><div><Label>固定月薪</Label><Input name="monthlyRate" inputMode="decimal" defaultValue={activeConfig?.monthlyRate || ""} placeholder="30000"/></div></div><div className="grid grid-cols-2 gap-3"><div><Label>餐費（符合出勤條件）</Label><Input name="mealAllowance" inputMode="decimal" defaultValue={activeConfig?.mealAllowance || "100"}/></div><div><Label>主管津貼</Label><Input name="supervisorAllowance" inputMode="decimal" defaultValue={activeConfig?.supervisorAllowance || "0"}/></div><div><Label>開車補助</Label><Input name="drivingAllowance" inputMode="decimal" defaultValue={activeConfig?.drivingAllowance || "0"}/></div><div><Label>交通補助</Label><Input name="transportationAllowance" inputMode="decimal" defaultValue={activeConfig?.transportationAllowance || "0"}/></div><div><Label>其他津貼</Label><Input name="otherAllowance" inputMode="decimal" defaultValue={activeConfig?.otherAllowance || "0"}/></div><div><Label>加班計算方式</Label><select name="overtimeMode" defaultValue={activeConfig?.overtimeMode || "manual"} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="manual">人工輸入</option><option value="hourly_multiplier">時薪倍率</option><option value="fixed">固定時薪</option></select></div><div><Label>加班倍率</Label><Input name="overtimeMultiplier" inputMode="decimal" defaultValue={activeConfig?.overtimeMultiplier || "1"}/></div><div><Label>固定加班時薪</Label><Input name="overtimeFixedRate" inputMode="decimal" defaultValue={activeConfig?.overtimeFixedRate || ""}/></div></div><div><Label>調整原因</Label><Input name="reason" placeholder="例如：通過試用期調整日薪"/></div><Button type="submit" className="w-full bg-[#163C72] hover:bg-[#102e59]" disabled={updateSalary.isPending}>{updateSalary.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}儲存薪資設定並建立調整紀錄</Button></form>}
          {detailTab === "adjustments" && <div>{adjustments.isLoading ? <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin"/> : adjustments.data?.length ? <div className="space-y-3">{adjustments.data.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.effectiveDate} 生效</p><p className="mt-1 text-xs text-slate-500">操作人：{item.operatorName} · {new Date(item.createdAt).toLocaleString("zh-TW")}</p></div><History className="h-4 w-4 text-[#163C72]"/></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded bg-slate-50 p-2"><p className="text-slate-500">調整前日薪／月薪</p><p>{snapshotAmount(item.previousConfig, "dailyRate")} ／ {snapshotAmount(item.previousConfig, "monthlyRate")}</p></div><div className="rounded bg-lime-50 p-2"><p className="text-slate-500">調整後日薪／月薪</p><p>{snapshotAmount(item.newConfig, "dailyRate")} ／ {snapshotAmount(item.newConfig, "monthlyRate")}</p></div></div>{item.reason && <p className="mt-3 text-sm text-slate-700">原因：{item.reason}</p>}</div>)}</div> : <div className="py-12 text-center text-sm text-slate-500">尚無薪資調整紀錄。首次儲存薪資設定後會自動建立一筆紀錄。</div>}</div>}
          {detailTab === "payslips" && <div>{payslips.isLoading ? <Loader2 className="mx-auto mt-10 h-5 w-5 animate-spin"/> : payslips.data?.length ? <div className="space-y-3">{payslips.data.map(({ run, period, payment }) => <div key={run.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><p className="font-semibold text-slate-900">{period.label}</p><p className="mt-1 text-xs text-slate-500">{period.periodStart} ～ {period.periodEnd} · {payment?.status === "transferred" ? "已匯款" : payment?.status === "cash" ? "已發現金" : run.status === "paid" ? "已發薪" : "處理中"}</p></div><div className="text-right"><p className="font-bold text-[#163C72]">{currency(run.netPay)}</p><ReceiptText className="ml-auto mt-1 h-4 w-4 text-slate-400"/></div></div>)}</div> : <div className="py-12 text-center text-sm text-slate-500">此員工尚無已建立的薪資條。</div>}</div>}
        </div></div>}</Card>
    </div>
  </HRLayout>;
}
