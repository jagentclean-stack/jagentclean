import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { calculatePayroll } from "./payrollCalculation";
import {
  getEmployeeById,
  getEmployeeByUserId,
  getPayrollCalculationSources,
  getPayrollPeriod,
  getSalarySettingForPeriod,
  listAdvanceBalances,
  listPayrollAlerts,
  payrollTables,
  requirePayrollDb,
  resolvePayrollAlert,
  syncPayrollAlerts,
  writePayrollAudit,
} from "./payrollDb";
import {
  assertOperationsManager,
  assertPayrollManager,
  canManageOperations,
  canManagePayroll,
  encryptPayrollSensitiveValue,
  maskSensitiveValue,
} from "./payrollSecurity";
import { canTransitionPayrollPeriod, isPayrollPeriodLocked } from "./payrollWorkflow";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必須為 YYYY-MM-DD");
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "時間格式必須為 HH:mm");
const amountSchema = z.string().regex(/^\d+(?:\.\d{1,2})?$/, "金額格式不正確");
const optionalAmountSchema = amountSchema.optional().nullable();
const payrollStatusSchema = z.enum(["draft", "pending_review", "confirmed", "pending_payment", "paid"]);
const attendanceStatusSchema = z.enum(["present", "leave", "day_off", "absent", "late", "early_leave", "half_day", "emergency_overtime"]);
const payrollPeriodTypeSchema = z.enum(["first_half", "second_half", "monthly", "custom"]);

export function buildPayrollPeriodDefinition(year: number, month: number, periodType: "first_half" | "second_half" | "monthly") {
  const pad = (value: number) => String(value).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startDay = periodType === "second_half" ? 16 : 1;
  const endDay = periodType === "first_half" ? 15 : lastDay;
  const suffix = periodType === "first_half" ? "上半月" : periodType === "second_half" ? "下半月" : "整月";
  return { label: `${year} 年 ${pad(month)} 月${suffix}`, periodStart: `${year}-${pad(month)}-${pad(startDay)}`, periodEnd: `${year}-${pad(month)}-${pad(endDay)}`, periodType };
}

function sanitizeEmployee<T extends { nationalIdEncrypted?: string | null; bankAccountEncrypted?: string | null; bankAccountLast4?: string | null }>(employee: T) {
  const { nationalIdEncrypted: _nationalIdEncrypted, bankAccountEncrypted, bankAccountLast4, ...safe } = employee;
  return {
    ...safe,
    hasNationalId: Boolean(_nationalIdEncrypted),
    hasBankAccount: Boolean(bankAccountEncrypted),
    bankAccountMasked: bankAccountEncrypted ? `••••${bankAccountLast4 ?? ""}` : null,
  };
}

function assertPeriodIsMutable(status: string) {
  if (isPayrollPeriodLocked(status as Parameters<typeof isPayrollPeriodLocked>[0])) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "已確認或已發薪的薪資週期不可直接修改；請建立調整紀錄。" });
  }
}

async function resolveEmployeeScope(userId: number, requestedEmployeeId: number | undefined, canManage: boolean) {
  if (canManage) return requestedEmployeeId;
  const employee = await getEmployeeByUserId(userId);
  if (!employee) throw new TRPCError({ code: "FORBIDDEN", message: "目前帳號尚未綁定員工資料" });
  if (requestedEmployeeId && requestedEmployeeId !== employee.id) throw new TRPCError({ code: "FORBIDDEN", message: "您只能查看自己的資料" });
  return employee.id;
}

async function assertOperationEmployeeScope(userId: number, requestedEmployeeId: number, canManage: boolean) {
  const scopedEmployeeId = await resolveEmployeeScope(userId, requestedEmployeeId, canManage);
  if (scopedEmployeeId !== requestedEmployeeId) throw new TRPCError({ code: "FORBIDDEN", message: "您只能修改自己的資料" });
}

async function calculatePayrollRun(actorUserId: number, payrollPeriodId: number, employeeId: number) {
  const period = await getPayrollPeriod(payrollPeriodId);
  if (!period) throw new TRPCError({ code: "NOT_FOUND", message: "找不到薪資週期" });
  assertPeriodIsMutable(period.status);
  const [employee, salary, source] = await Promise.all([getEmployeeById(employeeId), getSalarySettingForPeriod(employeeId, period.periodStart), getPayrollCalculationSources(employeeId, period.periodStart, period.periodEnd, period.id)]);
  if (!employee) throw new TRPCError({ code: "NOT_FOUND", message: "找不到員工資料" });
  if (!salary) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `員工 ${employee.name} 在此薪資期間找不到有效的薪資設定` });
  const result = calculatePayroll({
    salary,
    attendance: source.attendance.map((item) => ({ status: item.status, workHours: Number(item.workHours), lateMinutes: item.lateMinutes, earlyLeaveMinutes: item.earlyLeaveMinutes })),
    overtime: source.overtime.map((item) => ({ status: item.status, hours: Number(item.hours), calculatedAmount: item.calculatedAmount, manualAmount: item.manualAmount })),
    bonuses: source.bonuses.map((item) => ({ label: item.name, amount: item.amount })),
    deductions: source.deductions.filter((item) => item.type !== "advance" && item.type !== "salary_advance").map((item) => ({ label: item.type, amount: item.amount })),
    advanceDeductions: source.deductions.filter((item) => item.type === "advance" || item.type === "salary_advance").map((item) => ({ label: item.type, amount: item.amount })),
  });
  const db = await requirePayrollDb();
  const existing = (await db.select().from(payrollTables.payrollRuns).where(and(eq(payrollTables.payrollRuns.payrollPeriodId, payrollPeriodId), eq(payrollTables.payrollRuns.employeeId, employeeId))).limit(1))[0];
  if (existing && ["confirmed", "pending_payment", "paid"].includes(existing.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "已確認或已發薪的薪資條不可重新計算" });
  const now = new Date();
  const runId = await db.transaction(async (tx) => {
    let id = existing?.id;
    if (id) {
      await tx.update(payrollTables.payrollRuns).set({ grossPay: result.grossPay, deductionTotal: result.deductionTotal, netPay: result.netPay, calculatedAt: now, status: "draft" }).where(eq(payrollTables.payrollRuns.id, id));
      await tx.delete(payrollTables.payrollLineItems).where(eq(payrollTables.payrollLineItems.payrollRunId, id));
    } else {
      const created = await tx.insert(payrollTables.payrollRuns).values({ payrollPeriodId, employeeId, grossPay: result.grossPay, deductionTotal: result.deductionTotal, netPay: result.netPay, calculatedAt: now });
      id = Number(created[0].insertId);
    }
    await tx.insert(payrollTables.payrollLineItems).values(result.lines.map((item) => ({ ...item, payrollRunId: id!, sourceType: "calculation", metadata: { salarySettingId: salary.id, calculatedAt: now.toISOString() } })));
    return id!;
  });
  await writePayrollAudit({ actorUserId, entityType: "payroll_run", entityId: runId, action: existing ? "recalculate" : "calculate", beforeData: existing, afterData: { ...result, salarySettingId: salary.id } });
  return { id: runId, employeeId, ...result };
}

export const payrollRouter = router({
  access: protectedProcedure.query(({ ctx }) => ({
    canManagePayroll: canManagePayroll(ctx.user),
    canManageOperations: canManageOperations(ctx.user),
    role: ctx.user.role,
  })),

  employees: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canManageOperations(ctx.user)) throw new TRPCError({ code: "FORBIDDEN", message: "您沒有查看員工資料的權限" });
      const db = await requirePayrollDb();
      const items = await db.select().from(payrollTables.employees).orderBy(asc(payrollTables.employees.name));
      return items.map(sanitizeEmployee);
    }),
    me: protectedProcedure.query(async ({ ctx }) => {
      const employee = await getEmployeeByUserId(ctx.user.id);
      return employee ? sanitizeEmployee(employee) : null;
    }),
    create: protectedProcedure.input(z.object({
      userId: z.number().int().positive().optional().nullable(), employeeCode: z.string().max(32).optional().nullable(), name: z.string().min(1).max(120), nickname: z.string().max(120).optional().nullable(), phone: z.string().max(32).optional().nullable(), email: z.string().email().optional().nullable(), nationalId: z.string().max(32).optional().nullable(), gender: z.enum(["female", "male", "other", "unspecified"]).optional().nullable(), birthDate: dateSchema.optional().nullable(), address: z.string().max(2000).optional().nullable(), emergencyContactName: z.string().max(120).optional().nullable(), emergencyContactPhone: z.string().max(32).optional().nullable(), departmentId: z.number().int().positive().optional().nullable(), positionId: z.number().int().positive().optional().nullable(), jobTitle: z.string().max(120).optional().nullable(), hireDate: dateSchema, bankName: z.string().max(120).optional().nullable(), bankAccount: z.string().max(64).optional().nullable(), notes: z.string().max(5000).optional().nullable(),
    })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const db = await requirePayrollDb();
      const { nationalId, bankAccount, ...employeeInput } = input;
      const result = await db.insert(payrollTables.employees).values({
        ...employeeInput,
        nationalIdEncrypted: encryptPayrollSensitiveValue(nationalId ?? undefined),
        bankAccountEncrypted: encryptPayrollSensitiveValue(bankAccount ?? undefined),
        bankAccountLast4: bankAccount ? bankAccount.replace(/\s/g, "").slice(-4) : null,
      });
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "employee", entityId: id, action: "create", afterData: { name: input.name, employeeCode: input.employeeCode } });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number().int().positive(), name: z.string().min(1).max(120).optional(), nickname: z.string().max(120).nullable().optional(), phone: z.string().max(32).nullable().optional(), email: z.string().email().nullable().optional(), address: z.string().max(2000).nullable().optional(), departmentId: z.number().int().positive().nullable().optional(), positionId: z.number().int().positive().nullable().optional(), jobTitle: z.string().max(120).nullable().optional(), employmentStatus: z.enum(["active", "inactive", "leave_of_absence", "terminated"]).optional(), terminationDate: dateSchema.nullable().optional(), bankName: z.string().max(120).nullable().optional(), bankAccount: z.string().max(64).nullable().optional(), notes: z.string().max(5000).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const current = await getEmployeeById(input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "找不到員工資料" });
      const { id, bankAccount, ...updates } = input;
      const db = await requirePayrollDb();
      await db.update(payrollTables.employees).set({ ...updates, ...(bankAccount !== undefined ? {
        bankAccountEncrypted: bankAccount ? encryptPayrollSensitiveValue(bankAccount) : null,
        bankAccountLast4: bankAccount ? bankAccount.replace(/\s/g, "").slice(-4) : null,
      } : {}) }).where(eq(payrollTables.employees.id, id));
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "employee", entityId: id, action: "update", beforeData: sanitizeEmployee(current), afterData: updates });
      return { success: true };
    }),
  }),

  salarySettings: router({
    list: protectedProcedure.input(z.object({ employeeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const db = await requirePayrollDb();
      return db.select().from(payrollTables.employeeSalarySettings).where(eq(payrollTables.employeeSalarySettings.employeeId, input.employeeId)).orderBy(desc(payrollTables.employeeSalarySettings.effectiveFrom));
    }),
    create: protectedProcedure.input(z.object({ employeeId: z.number().int().positive(), effectiveFrom: dateSchema, effectiveTo: dateSchema.nullable().optional(), salaryType: z.enum(["daily", "hourly", "monthly", "special"]), dailyRate: optionalAmountSchema, hourlyRate: optionalAmountSchema, monthlyRate: optionalAmountSchema, mealAllowance: amountSchema.default("100.00"), supervisorAllowance: amountSchema.default("0.00"), drivingAllowance: amountSchema.default("0.00"), transportationAllowance: amountSchema.default("0.00"), otherAllowance: amountSchema.default("0.00"), overtimeMode: z.enum(["manual", "hourly_multiplier", "fixed"]).default("manual"), overtimeMultiplier: amountSchema.default("1.00"), overtimeFixedRate: optionalAmountSchema,
    })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.employeeSalarySettings).values(input);
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "salary_setting", entityId: id, action: "create", afterData: input });
      return { id };
    }),
  }),

  schedules: router({
    list: protectedProcedure.input(z.object({ startDate: dateSchema, endDate: dateSchema, employeeId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeScope(ctx.user.id, input.employeeId, canManageOperations(ctx.user));
      const db = await requirePayrollDb();
      const conditions = [gte(payrollTables.workSchedules.workDate, input.startDate), lte(payrollTables.workSchedules.workDate, input.endDate)];
      if (employeeId) conditions.push(eq(payrollTables.workSchedules.employeeId, employeeId));
      return db.select().from(payrollTables.workSchedules).where(and(...conditions)).orderBy(asc(payrollTables.workSchedules.workDate), asc(payrollTables.workSchedules.startTime));
    }),
    create: protectedProcedure.input(z.object({ employeeId: z.number().int().positive(), workDate: dateSchema, startTime: timeSchema, endTime: timeSchema, location: z.string().max(500).optional().nullable(), jobDescription: z.string().max(5000).optional().nullable(), breakMinutes: z.number().int().min(0).max(480).default(0), expectedWorkHours: optionalAmountSchema, notes: z.string().max(5000).optional().nullable(),
    })).mutation(async ({ ctx, input }) => {
      assertOperationsManager(ctx.user);
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.workSchedules).values({ ...input, createdByUserId: ctx.user.id });
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "schedule", entityId: id, action: "create", afterData: input });
      return { id };
    }),
    createBatch: protectedProcedure.input(z.object({ entries: z.array(z.object({ employeeId: z.number().int().positive(), workDate: dateSchema, startTime: timeSchema, endTime: timeSchema, location: z.string().max(500).optional().nullable(), jobDescription: z.string().max(5000).optional().nullable(), breakMinutes: z.number().int().min(0).max(480).default(0), expectedWorkHours: optionalAmountSchema, notes: z.string().max(5000).optional().nullable() })).min(1).max(200) })).mutation(async ({ ctx, input }) => {
      assertOperationsManager(ctx.user);
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.workSchedules).values(input.entries.map((entry) => ({ ...entry, createdByUserId: ctx.user.id })));
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "schedule_batch", entityId: 0, action: "create", afterData: { count: Number(result[0].affectedRows), entries: input.entries } });
      return { created: Number(result[0].affectedRows) };
    }),
  }),

  attendance: router({
    list: protectedProcedure.input(z.object({ startDate: dateSchema, endDate: dateSchema, employeeId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeScope(ctx.user.id, input.employeeId, canManageOperations(ctx.user));
      const db = await requirePayrollDb();
      const conditions = [gte(payrollTables.attendanceRecords.workDate, input.startDate), lte(payrollTables.attendanceRecords.workDate, input.endDate)];
      if (employeeId) conditions.push(eq(payrollTables.attendanceRecords.employeeId, employeeId));
      return db.select().from(payrollTables.attendanceRecords).where(and(...conditions)).orderBy(asc(payrollTables.attendanceRecords.workDate));
    }),
    create: protectedProcedure.input(z.object({ employeeId: z.number().int().positive(), scheduleId: z.number().int().positive().nullable().optional(), workDate: dateSchema, scheduledStartTime: timeSchema.nullable().optional(), scheduledEndTime: timeSchema.nullable().optional(), actualStartTime: timeSchema.nullable().optional(), actualEndTime: timeSchema.nullable().optional(), workHours: amountSchema, status: attendanceStatusSchema, lateMinutes: z.number().int().min(0).default(0), earlyLeaveMinutes: z.number().int().min(0).default(0), mealAllowance: amountSchema.default("0.00"), notes: z.string().max(5000).optional().nullable(),
    })).mutation(async ({ ctx, input }) => {
      assertOperationsManager(ctx.user);
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.attendanceRecords).values({ ...input, createdByUserId: ctx.user.id });
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "attendance", entityId: id, action: "create", afterData: input });
      return { id };
    }),
    createBatch: protectedProcedure.input(z.object({ entries: z.array(z.object({ employeeId: z.number().int().positive(), scheduleId: z.number().int().positive().nullable().optional(), workDate: dateSchema, scheduledStartTime: timeSchema.nullable().optional(), scheduledEndTime: timeSchema.nullable().optional(), actualStartTime: timeSchema.nullable().optional(), actualEndTime: timeSchema.nullable().optional(), workHours: amountSchema, status: attendanceStatusSchema, lateMinutes: z.number().int().min(0).default(0), earlyLeaveMinutes: z.number().int().min(0).default(0), mealAllowance: amountSchema.default("0.00"), notes: z.string().max(5000).optional().nullable() })).min(1).max(200) })).mutation(async ({ ctx, input }) => {
      assertOperationsManager(ctx.user);
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.attendanceRecords).values(input.entries.map((entry) => ({ ...entry, createdByUserId: ctx.user.id })));
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "attendance_batch", entityId: 0, action: "create", afterData: { count: Number(result[0].affectedRows), entries: input.entries } });
      return { created: Number(result[0].affectedRows) };
    }),
  }),

  overtime: router({
    list: protectedProcedure.input(z.object({ startDate: dateSchema, endDate: dateSchema, employeeId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeScope(ctx.user.id, input.employeeId, canManageOperations(ctx.user));
      const db = await requirePayrollDb();
      const conditions = [gte(payrollTables.overtimeRecords.workDate, input.startDate), lte(payrollTables.overtimeRecords.workDate, input.endDate)];
      if (employeeId) conditions.push(eq(payrollTables.overtimeRecords.employeeId, employeeId));
      return db.select().from(payrollTables.overtimeRecords).where(and(...conditions)).orderBy(desc(payrollTables.overtimeRecords.workDate));
    }),
    create: protectedProcedure.input(z.object({ employeeId: z.number().int().positive(), workDate: dateSchema, startTime: timeSchema, endTime: timeSchema, hours: amountSchema, multiplier: amountSchema.default("1.00"), calculatedAmount: amountSchema, manualAmount: optionalAmountSchema, notes: z.string().max(5000).optional().nullable(),
    })).mutation(async ({ ctx, input }) => {
      await assertOperationEmployeeScope(ctx.user.id, input.employeeId, canManageOperations(ctx.user));
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.overtimeRecords).values({ ...input, createdByUserId: ctx.user.id });
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "overtime", entityId: id, action: "create", afterData: input });
      return { id };
    }),
    review: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]), reason: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      assertOperationsManager(ctx.user);
      const db = await requirePayrollDb();
      const current = (await db.select().from(payrollTables.overtimeRecords).where(eq(payrollTables.overtimeRecords.id, input.id)).limit(1))[0];
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "找不到加班紀錄" });
      await db.update(payrollTables.overtimeRecords).set({ status: input.status, approvedByUserId: ctx.user.id, approvedAt: new Date() }).where(eq(payrollTables.overtimeRecords.id, input.id));
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "overtime", entityId: input.id, action: input.status, reason: input.reason, beforeData: current, afterData: { status: input.status } });
      return { success: true };
    }),
    reviewBatch: protectedProcedure.input(z.object({ ids: z.array(z.number().int().positive()).min(1).max(200), status: z.enum(["approved", "rejected"]), reason: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      assertOperationsManager(ctx.user);
      const db = await requirePayrollDb();
      const all = await db.select().from(payrollTables.overtimeRecords);
      const targets = all.filter((item) => input.ids.includes(item.id));
      if (targets.length !== input.ids.length) throw new TRPCError({ code: "NOT_FOUND", message: "部分加班紀錄不存在" });
      const now = new Date();
      await Promise.all(targets.map((item) => db.update(payrollTables.overtimeRecords).set({ status: input.status, approvedByUserId: ctx.user.id, approvedAt: now }).where(eq(payrollTables.overtimeRecords.id, item.id))));
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "overtime_batch", entityId: 0, action: input.status, reason: input.reason, beforeData: targets, afterData: { ids: input.ids, status: input.status } });
      return { updated: targets.length };
    }),
  }),

  periods: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      assertPayrollManager(ctx.user);
      const db = await requirePayrollDb();
      return db.select().from(payrollTables.payrollPeriods).orderBy(desc(payrollTables.payrollPeriods.periodStart));
    }),
    create: protectedProcedure.input(z.object({ label: z.string().min(1).max(32), periodStart: dateSchema, periodEnd: dateSchema, periodType: payrollPeriodTypeSchema.default("custom") })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      if (input.periodEnd < input.periodStart) throw new TRPCError({ code: "BAD_REQUEST", message: "薪資結束日不可早於開始日" });
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.payrollPeriods).values(input);
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "payroll_period", entityId: id, action: "create", afterData: input });
      return { id };
    }),
    createByType: protectedProcedure.input(z.object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12), periodType: z.enum(["first_half", "second_half", "monthly"]), label: z.string().min(1).max(32).optional() })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const definition = buildPayrollPeriodDefinition(input.year, input.month, input.periodType);
      const db = await requirePayrollDb();
      const existing = (await db.select().from(payrollTables.payrollPeriods).where(and(eq(payrollTables.payrollPeriods.periodStart, definition.periodStart), eq(payrollTables.payrollPeriods.periodEnd, definition.periodEnd))).limit(1))[0];
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "此薪資週期已建立" });
      const values = { ...definition, label: input.label ?? definition.label };
      const result = await db.insert(payrollTables.payrollPeriods).values(values);
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "payroll_period", entityId: id, action: "create_by_type", afterData: values });
      return { id, ...values };
    }),
    transition: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: payrollStatusSchema, reason: z.string().min(1).max(1000).optional() })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const current = await getPayrollPeriod(input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "找不到薪資週期" });
      if (!canTransitionPayrollPeriod(current.status, input.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "不允許的薪資狀態轉換" });
      const db = await requirePayrollDb();
      const now = new Date();
      const runs = await db.select().from(payrollTables.payrollRuns).where(eq(payrollTables.payrollRuns.payrollPeriodId, input.id));
      if (input.status === "confirmed" && runs.length === 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "至少須完成一筆薪資試算後才能確認薪資週期" });
      }
      await db.update(payrollTables.payrollPeriods).set({ status: input.status, ...(input.status === "confirmed" ? { confirmedAt: now, confirmedByUserId: ctx.user.id } : {}), ...(input.status === "paid" ? { paidAt: now } : {}) }).where(eq(payrollTables.payrollPeriods.id, input.id));
      await db.update(payrollTables.payrollRuns).set({
        status: input.status,
        ...(input.status === "confirmed" ? { confirmedAt: now, confirmedByUserId: ctx.user.id, lockedAt: now } : {}),
        ...(input.status === "pending_payment" || input.status === "paid" ? { lockedAt: now } : {}),
      }).where(eq(payrollTables.payrollRuns.payrollPeriodId, input.id));
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "payroll_period", entityId: input.id, action: `transition_${input.status}`, reason: input.reason, beforeData: current, afterData: { status: input.status } });
      return { success: true };
    }),
  }),

  bonuses: router({
    create: protectedProcedure.input(z.object({ employeeId: z.number().int().positive(), payrollPeriodId: z.number().int().positive(), bonusDate: dateSchema, name: z.string().min(1).max(120), amount: amountSchema, notes: z.string().max(5000).optional().nullable() })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const period = await getPayrollPeriod(input.payrollPeriodId);
      if (!period) throw new TRPCError({ code: "NOT_FOUND", message: "找不到薪資週期" });
      assertPeriodIsMutable(period.status);
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.payrollBonuses).values({ ...input, createdByUserId: ctx.user.id });
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "bonus", entityId: id, action: "create", afterData: input });
      return { id };
    }),
  }),

  deductions: router({
    create: protectedProcedure.input(z.object({ employeeId: z.number().int().positive(), payrollPeriodId: z.number().int().positive(), deductionDate: dateSchema, type: z.enum(["advance", "salary_advance", "labor_insurance", "health_insurance", "late", "early_leave", "absence", "other"]), amount: amountSchema, notes: z.string().max(5000).optional().nullable() })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const period = await getPayrollPeriod(input.payrollPeriodId);
      if (!period) throw new TRPCError({ code: "NOT_FOUND", message: "找不到薪資週期" });
      assertPeriodIsMutable(period.status);
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.payrollDeductions).values({ ...input, createdByUserId: ctx.user.id });
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "deduction", entityId: id, action: "create", afterData: input });
      return { id };
    }),
  }),

  advances: router({
    list: protectedProcedure.input(z.object({ employeeId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeScope(ctx.user.id, input?.employeeId, canManagePayroll(ctx.user));
      return listAdvanceBalances(employeeId);
    }),
    create: protectedProcedure.input(z.object({ employeeId: z.number().int().positive(), advanceDate: dateSchema, originalAmount: amountSchema, notes: z.string().max(5000).optional().nullable() })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const db = await requirePayrollDb();
      const result = await db.insert(payrollTables.employeeAdvances).values({ ...input, createdByUserId: ctx.user.id });
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "advance", entityId: id, action: "create", afterData: input });
      return { id };
    }),
    repay: protectedProcedure.input(z.object({ advanceId: z.number().int().positive(), payrollPeriodId: z.number().int().positive().optional().nullable(), repaymentDate: dateSchema, amount: amountSchema, notes: z.string().max(5000).optional().nullable() })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const db = await requirePayrollDb();
      const advance = (await db.select().from(payrollTables.employeeAdvances).where(eq(payrollTables.employeeAdvances.id, input.advanceId)).limit(1))[0];
      if (!advance) throw new TRPCError({ code: "NOT_FOUND", message: "找不到借支資料" });
      const balance = (await listAdvanceBalances(advance.employeeId)).find((item) => item.id === advance.id);
      if (!balance || Number(input.amount) > Number(balance.outstandingAmount)) throw new TRPCError({ code: "BAD_REQUEST", message: "扣回金額不可大於尚欠金額" });
      const result = await db.insert(payrollTables.advanceRepayments).values({ ...input, createdByUserId: ctx.user.id });
      if (Number(input.amount) === Number(balance.outstandingAmount)) await db.update(payrollTables.employeeAdvances).set({ status: "settled" }).where(eq(payrollTables.employeeAdvances.id, advance.id));
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "advance_repayment", entityId: id, action: "create", afterData: input });
      return { id };
    }),
  }),

  runs: router({
    list: protectedProcedure.input(z.object({ payrollPeriodId: z.number().int().positive(), employeeId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeScope(ctx.user.id, input.employeeId, canManagePayroll(ctx.user));
      const db = await requirePayrollDb();
      const conditions = [eq(payrollTables.payrollRuns.payrollPeriodId, input.payrollPeriodId)];
      if (employeeId) conditions.push(eq(payrollTables.payrollRuns.employeeId, employeeId));
      return db.select().from(payrollTables.payrollRuns).where(and(...conditions)).orderBy(asc(payrollTables.payrollRuns.employeeId));
    }),
    calculate: protectedProcedure.input(z.object({ payrollPeriodId: z.number().int().positive(), employeeId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      return calculatePayrollRun(ctx.user.id, input.payrollPeriodId, input.employeeId);
    }),
    calculateBatch: protectedProcedure.input(z.object({ payrollPeriodId: z.number().int().positive(), employeeIds: z.array(z.number().int().positive()).min(1).max(200) })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const results = [] as Awaited<ReturnType<typeof calculatePayrollRun>>[];
      const failures: Array<{ employeeId: number; message: string }> = [];
      for (const employeeId of input.employeeIds) {
        try { results.push(await calculatePayrollRun(ctx.user.id, input.payrollPeriodId, employeeId)); }
        catch (error) { failures.push({ employeeId, message: error instanceof Error ? error.message : "薪資試算失敗" }); }
      }
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "payroll_run_batch", entityId: input.payrollPeriodId, action: "calculate", afterData: { employeeIds: input.employeeIds, calculated: results.map((item) => item.employeeId), failures } });
      return { calculated: results.length, failures };
    }),
    detail: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await requirePayrollDb();
      const run = (await db.select().from(payrollTables.payrollRuns).where(eq(payrollTables.payrollRuns.id, input.id)).limit(1))[0];
      if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "找不到薪資條" });
      await resolveEmployeeScope(ctx.user.id, run.employeeId, canManagePayroll(ctx.user));
      const [items, payment] = await Promise.all([
        db.select().from(payrollTables.payrollLineItems).where(eq(payrollTables.payrollLineItems.payrollRunId, input.id)),
        db.select().from(payrollTables.payrollPayments).where(eq(payrollTables.payrollPayments.payrollRunId, input.id)).limit(1),
      ]);
      return { run, items, payment: payment[0] ?? null };
    }),
  }),

  payments: router({
    list: protectedProcedure.input(z.object({ payrollPeriodId: z.number().int().positive().optional(), employeeId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeScope(ctx.user.id, input?.employeeId, canManagePayroll(ctx.user));
      const db = await requirePayrollDb();
      const conditions = [];
      if (input?.payrollPeriodId) conditions.push(eq(payrollTables.payrollPayments.payrollPeriodId, input.payrollPeriodId));
      if (employeeId) conditions.push(eq(payrollTables.payrollPayments.employeeId, employeeId));
      return conditions.length ? db.select().from(payrollTables.payrollPayments).where(and(...conditions)).orderBy(desc(payrollTables.payrollPayments.createdAt)) : db.select().from(payrollTables.payrollPayments).orderBy(desc(payrollTables.payrollPayments.createdAt));
    }),
    upsert: protectedProcedure.input(z.object({ payrollRunId: z.number().int().positive(), paymentMethod: z.enum(["pending", "transfer", "cash", "other"]), status: z.enum(["pending", "transferred", "cash", "other"]), paidAt: z.coerce.date().nullable().optional(), notes: z.string().max(5000).nullable().optional() })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const db = await requirePayrollDb();
      const run = (await db.select().from(payrollTables.payrollRuns).where(eq(payrollTables.payrollRuns.id, input.payrollRunId)).limit(1))[0];
      if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "找不到薪資條" });
      if (!["confirmed", "pending_payment", "paid"].includes(run.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "薪資條確認後才能建立發薪紀錄" });
      const employee = await getEmployeeById(run.employeeId);
      const existing = (await db.select().from(payrollTables.payrollPayments).where(eq(payrollTables.payrollPayments.payrollRunId, run.id)).limit(1))[0];
      const paidAt = input.status === "pending" ? null : (input.paidAt ?? new Date());
      const values = { paymentMethod: input.paymentMethod, status: input.status, paidAt, notes: input.notes ?? null, recordedByUserId: ctx.user.id };
      if (existing) {
        await db.update(payrollTables.payrollPayments).set(values).where(eq(payrollTables.payrollPayments.id, existing.id));
        await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "payment", entityId: existing.id, action: "update", beforeData: existing, afterData: values });
        return { id: existing.id };
      }
      const result = await db.insert(payrollTables.payrollPayments).values({ payrollRunId: run.id, employeeId: run.employeeId, payrollPeriodId: run.payrollPeriodId, netAmount: run.netPay, bankNameSnapshot: employee?.bankName ?? null, bankAccountMaskedSnapshot: employee?.bankAccountLast4 ? `••••${employee.bankAccountLast4}` : null, ...values });
      const id = Number(result[0].insertId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "payment", entityId: id, action: "create", afterData: { payrollRunId: run.id, ...values } });
      return { id };
    }),
  }),

  audit: router({
    list: protectedProcedure.input(z.object({ entityType: z.string().max(64).optional(), entityId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(200).default(100) }).optional()).query(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const db = await requirePayrollDb();
      const conditions = [];
      if (input?.entityType) conditions.push(eq(payrollTables.payrollAuditLogs.entityType, input.entityType));
      if (input?.entityId) conditions.push(eq(payrollTables.payrollAuditLogs.entityId, input.entityId));
      const query = conditions.length ? db.select().from(payrollTables.payrollAuditLogs).where(and(...conditions)) : db.select().from(payrollTables.payrollAuditLogs);
      return query.orderBy(desc(payrollTables.payrollAuditLogs.createdAt)).limit(input?.limit ?? 100);
    }),
  }),

  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      assertPayrollManager(ctx.user);
      return listPayrollAlerts();
    }),
    refresh: protectedProcedure.input(z.object({ payrollPeriodId: z.number().int().positive().optional() }).optional()).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const result = await syncPayrollAlerts(input?.payrollPeriodId);
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "payroll_alert", entityId: input?.payrollPeriodId ?? 0, action: "refresh", afterData: result });
      return result;
    }),
    resolve: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const current = await resolvePayrollAlert(input.id, ctx.user.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "找不到薪資警示" });
      await writePayrollAudit({ actorUserId: ctx.user.id, entityType: "payroll_alert", entityId: input.id, action: "resolve", beforeData: current, afterData: { isResolved: true } });
      return { success: true };
    }),
  }),

  dashboard: router({
    summary: protectedProcedure.input(z.object({ payrollPeriodId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      assertPayrollManager(ctx.user);
      const db = await requirePayrollDb();
      const periods = await db.select().from(payrollTables.payrollPeriods).orderBy(desc(payrollTables.payrollPeriods.periodStart));
      const selected = input?.payrollPeriodId ? periods.find((item) => item.id === input.payrollPeriodId) : periods[0];
      const [employees, alerts, runs] = await Promise.all([
        db.select().from(payrollTables.employees).where(eq(payrollTables.employees.employmentStatus, "active")),
        listPayrollAlerts(),
        selected ? db.select().from(payrollTables.payrollRuns).where(eq(payrollTables.payrollRuns.payrollPeriodId, selected.id)) : Promise.resolve([]),
      ]);
      const payrollTrend = await Promise.all(periods.slice(0, 12).reverse().map(async (period) => {
        const periodRuns = await db.select().from(payrollTables.payrollRuns).where(eq(payrollTables.payrollRuns.payrollPeriodId, period.id));
        return {
          id: period.id,
          label: period.label,
          periodStart: period.periodStart,
          grossPay: periodRuns.reduce((total, item) => total + Number(item.grossPay), 0).toFixed(2),
          netPay: periodRuns.reduce((total, item) => total + Number(item.netPay), 0).toFixed(2),
        };
      }));
      return {
        selectedPeriod: selected ?? null,
        employeeCount: employees.length,
        payrollRunCount: runs.length,
        grossPay: runs.reduce((total, item) => total + Number(item.grossPay), 0).toFixed(2),
        netPay: runs.reduce((total, item) => total + Number(item.netPay), 0).toFixed(2),
        pendingPayments: runs.filter((item) => item.status === "pending_payment").length,
        unresolvedAlerts: alerts.filter((item) => !item.isResolved),
        payrollTrend,
      };
    }),
  }),
});
