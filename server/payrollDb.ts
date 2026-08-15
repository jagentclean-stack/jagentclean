import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import {
  advanceRepayments,
  attendanceRecords,
  employeeAdvances,
  employeeSalarySettings,
  employees,
  overtimeRecords,
  payrollAlerts,
  payrollAuditLogs,
  payrollBonuses,
  payrollDeductions,
  payrollLineItems,
  payrollPayments,
  payrollPeriods,
  payrollRuns,
  workSchedules,
} from "../drizzle/schema";
import { getDb } from "./db";

export async function requirePayrollDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export async function getEmployeeById(id: number) {
  const db = await requirePayrollDb();
  return (await db.select().from(employees).where(eq(employees.id, id)).limit(1))[0];
}

export async function getEmployeeByUserId(userId: number) {
  const db = await requirePayrollDb();
  return (await db.select().from(employees).where(eq(employees.userId, userId)).limit(1))[0];
}

export async function getPayrollPeriod(id: number) {
  const db = await requirePayrollDb();
  return (await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, id)).limit(1))[0];
}

export async function getSalarySettingForPeriod(employeeId: number, periodStart: string) {
  const db = await requirePayrollDb();
  const settings = await db
    .select()
    .from(employeeSalarySettings)
    .where(and(eq(employeeSalarySettings.employeeId, employeeId), eq(employeeSalarySettings.isActive, true), lte(employeeSalarySettings.effectiveFrom, periodStart)))
    .orderBy(desc(employeeSalarySettings.effectiveFrom));
  return settings.find((setting) => !setting.effectiveTo || setting.effectiveTo >= periodStart);
}

export async function getPayrollCalculationSources(employeeId: number, periodStart: string, periodEnd: string, payrollPeriodId: number) {
  const db = await requirePayrollDb();
  const [attendance, overtime, bonuses, deductions] = await Promise.all([
    db.select().from(attendanceRecords).where(and(eq(attendanceRecords.employeeId, employeeId), gte(attendanceRecords.workDate, periodStart), lte(attendanceRecords.workDate, periodEnd))).orderBy(asc(attendanceRecords.workDate)),
    db.select().from(overtimeRecords).where(and(eq(overtimeRecords.employeeId, employeeId), gte(overtimeRecords.workDate, periodStart), lte(overtimeRecords.workDate, periodEnd))).orderBy(asc(overtimeRecords.workDate)),
    db.select().from(payrollBonuses).where(and(eq(payrollBonuses.employeeId, employeeId), eq(payrollBonuses.payrollPeriodId, payrollPeriodId))),
    db.select().from(payrollDeductions).where(and(eq(payrollDeductions.employeeId, employeeId), eq(payrollDeductions.payrollPeriodId, payrollPeriodId))),
  ]);
  return { attendance, overtime, bonuses, deductions };
}

export async function listAdvanceBalances(employeeId?: number) {
  const db = await requirePayrollDb();
  const advances = await db.select().from(employeeAdvances).where(employeeId ? eq(employeeAdvances.employeeId, employeeId) : undefined).orderBy(desc(employeeAdvances.advanceDate));
  const repayments = await db.select().from(advanceRepayments);
  return advances.map((advance) => {
    const paid = repayments.filter((item) => item.advanceId === advance.id).reduce((sum, item) => sum + Number(item.amount), 0);
    return { ...advance, repaidAmount: paid.toFixed(2), outstandingAmount: Math.max(0, Number(advance.originalAmount) - paid).toFixed(2) };
  });
}

export async function writePayrollAudit(input: {
  actorUserId: number;
  entityType: string;
  entityId: number;
  action: string;
  reason?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
}) {
  const db = await requirePayrollDb();
  await db.insert(payrollAuditLogs).values({
    actorUserId: input.actorUserId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    reason: input.reason ?? null,
    beforeData: input.beforeData ?? null,
    afterData: input.afterData ?? null,
  });
}

export async function listPayrollAlerts() {
  const db = await requirePayrollDb();
  return db.select().from(payrollAlerts).orderBy(asc(payrollAlerts.isResolved), desc(payrollAlerts.createdAt));
}

export async function resolvePayrollAlert(id: number, actorUserId: number) {
  const db = await requirePayrollDb();
  const current = (await db.select().from(payrollAlerts).where(eq(payrollAlerts.id, id)).limit(1))[0];
  if (!current) return null;
  await db.update(payrollAlerts).set({ isResolved: true, resolvedByUserId: actorUserId, resolvedAt: new Date() }).where(eq(payrollAlerts.id, id));
  return current;
}

export function buildPayrollAlertCandidates(input: {
  activeEmployees: Array<{ id: number; name: string; bankAccountEncrypted?: string | null }>;
  payrollPeriodId?: number;
  salaryConfiguredEmployeeIds?: Set<number>;
  schedules?: Array<{ employeeId: number; status: string }>;
  attendance?: Array<{ employeeId: number }>;
  overtime?: Array<{ employeeId: number; status: string }>;
  payrollRuns?: Array<{ employeeId: number }>;
  advances?: Array<{ employeeId: number; outstandingAmount: string | number }>;
}) {
  const candidates: Array<{ type: string; severity: "warning" | "critical"; employeeId: number; payrollPeriodId?: number; message: string }> = [];
  const isPeriodScoped = Boolean(input.payrollPeriodId);

  for (const employee of input.activeEmployees) {
    if (isPeriodScoped && !input.salaryConfiguredEmployeeIds?.has(employee.id)) {
      candidates.push({ type: "salary_setting_missing", severity: "critical", employeeId: employee.id, payrollPeriodId: input.payrollPeriodId, message: `${employee.name} 缺少此薪資週期的有效薪資設定。` });
    }
    if (!employee.bankAccountEncrypted) {
      candidates.push({ type: "bank_account_missing", severity: "warning", employeeId: employee.id, payrollPeriodId: input.payrollPeriodId, message: `${employee.name} 尚未完成銀行帳戶資料。` });
    }
    if (isPeriodScoped) {
      const scheduleCount = (input.schedules ?? []).filter((item) => item.employeeId === employee.id && item.status !== "cancelled").length;
      const attendanceCount = (input.attendance ?? []).filter((item) => item.employeeId === employee.id).length;
      if (scheduleCount > attendanceCount) candidates.push({ type: "attendance_missing", severity: "warning", employeeId: employee.id, payrollPeriodId: input.payrollPeriodId, message: `${employee.name} 有 ${scheduleCount - attendanceCount} 筆排班尚未建立出勤紀錄。` });
      const pendingOvertime = (input.overtime ?? []).filter((item) => item.employeeId === employee.id && item.status === "pending").length;
      if (pendingOvertime) candidates.push({ type: "overtime_pending", severity: "warning", employeeId: employee.id, payrollPeriodId: input.payrollPeriodId, message: `${employee.name} 有 ${pendingOvertime} 筆加班尚待審核。` });
      if (!(input.payrollRuns ?? []).some((item) => item.employeeId === employee.id)) candidates.push({ type: "payroll_unreviewed", severity: "warning", employeeId: employee.id, payrollPeriodId: input.payrollPeriodId, message: `${employee.name} 尚未完成薪資試算。` });
    }
    const outstanding = (input.advances ?? []).find((item) => item.employeeId === employee.id && Number(item.outstandingAmount) > 0);
    if (outstanding) candidates.push({ type: "advance_outstanding", severity: "warning", employeeId: employee.id, payrollPeriodId: input.payrollPeriodId, message: `${employee.name} 仍有未結清借支 $${Number(outstanding.outstandingAmount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}。` });
  }
  return candidates;
}

export async function syncPayrollAlerts(payrollPeriodId?: number) {
  const db = await requirePayrollDb();
  const period = payrollPeriodId ? await getPayrollPeriod(payrollPeriodId) : undefined;
  const activeEmployees = await db.select().from(employees).where(eq(employees.employmentStatus, "active"));
  const openAlerts = await db.select().from(payrollAlerts).where(eq(payrollAlerts.isResolved, false));
  const schedules = period
    ? await db.select().from(workSchedules).where(and(gte(workSchedules.workDate, period.periodStart), lte(workSchedules.workDate, period.periodEnd)))
    : [];
  const attendance = period
    ? await db.select().from(attendanceRecords).where(and(gte(attendanceRecords.workDate, period.periodStart), lte(attendanceRecords.workDate, period.periodEnd)))
    : [];
  const overtime = period
    ? await db.select().from(overtimeRecords).where(and(gte(overtimeRecords.workDate, period.periodStart), lte(overtimeRecords.workDate, period.periodEnd)))
    : [];
  const runs = period
    ? await db.select().from(payrollRuns).where(eq(payrollRuns.payrollPeriodId, period.id))
    : [];
  const advances = await listAdvanceBalances();

  const salaryConfiguredEmployeeIds = new Set<number>();
  for (const employee of activeEmployees) {
    const salary = period ? await getSalarySettingForPeriod(employee.id, period.periodStart) : undefined;
    if (salary) salaryConfiguredEmployeeIds.add(employee.id);
  }
  const candidates = buildPayrollAlertCandidates({
    activeEmployees,
    payrollPeriodId: period?.id,
    salaryConfiguredEmployeeIds,
    schedules,
    attendance,
    overtime,
    payrollRuns: runs,
    advances,
  });
  const fresh = candidates.filter((candidate) => !openAlerts.some((item) => item.type === candidate.type && item.employeeId === candidate.employeeId && item.payrollPeriodId === (candidate.payrollPeriodId ?? null)));
  if (fresh.length) await db.insert(payrollAlerts).values(fresh.map((item) => ({ ...item, payrollPeriodId: item.payrollPeriodId ?? null })));
  return { created: fresh.length, open: openAlerts.length + fresh.length };
}

export const payrollTables = {
  advanceRepayments,
  attendanceRecords,
  employeeAdvances,
  employeeSalarySettings,
  employees,
  overtimeRecords,
  payrollAlerts,
  payrollAuditLogs,
  payrollBonuses,
  payrollDeductions,
  payrollLineItems,
  payrollPayments,
  payrollPeriods,
  payrollRuns,
  workSchedules,
};
