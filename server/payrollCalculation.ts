/**
 * 人事薪資 V1.0 的單一計算來源。
 *
 * 所有金額均在「分」層級計算，僅在進入資料庫或呈現時轉為兩位小數字串，
 * 避免 JavaScript 浮點數影響薪資結果。React 前端不得實作或複製本處公式。
 */
export type PayrollMoney = string | number | null | undefined;

export type PayrollAttendanceInput = {
  status: "present" | "leave" | "day_off" | "absent" | "late" | "early_leave" | "half_day" | "emergency_overtime";
  workHours: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
};

export type PayrollOvertimeInput = {
  hours: number;
  calculatedAmount: PayrollMoney;
  manualAmount?: PayrollMoney;
  status: "pending" | "approved" | "rejected";
};

export type PayrollAdjustmentInput = {
  label: string;
  amount: PayrollMoney;
};

export type PayrollSalarySnapshot = {
  salaryType: "daily" | "hourly" | "monthly" | "special";
  dailyRate?: PayrollMoney;
  hourlyRate?: PayrollMoney;
  monthlyRate?: PayrollMoney;
  /** 已保留為薪資設定快照欄位；V1.0 計算規則固定每餐費 $100。 */
  mealAllowance?: PayrollMoney;
  supervisorAllowance?: PayrollMoney;
};

export type PayrollCalculationInput = {
  salary: PayrollSalarySnapshot;
  attendance: PayrollAttendanceInput[];
  overtime: PayrollOvertimeInput[];
  bonuses?: PayrollAdjustmentInput[];
  otherIncome?: PayrollAdjustmentInput[];
  deductions?: PayrollAdjustmentInput[];
  advanceDeductions?: PayrollAdjustmentInput[];
};

export type PayrollCalculatedLine = {
  category: "base_salary" | "daily_wage" | "hourly_wage" | "overtime" | "meal" | "supervisor_allowance" | "bonus" | "other_income" | "advance" | "late" | "early_leave" | "other_deduction";
  direction: "income" | "deduction";
  label: string;
  amount: string;
};

export type PayrollCalculationResult = {
  totalWorkDays: number;
  halfDays: number;
  totalWorkHours: number;
  overtimeHours: number;
  grossPay: string;
  deductionTotal: string;
  netPay: string;
  lines: PayrollCalculatedLine[];
};

const TWD_SCALE = 100;

export function toCents(value: PayrollMoney): number {
  if (value === null || value === undefined || value === "") return 0;
  const normalized = typeof value === "number" ? value.toFixed(2) : String(value).trim().replace(/,/g, "");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`無效的金額：${String(value)}`);
  }
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ""] = unsigned.split(".");
  const cents = Number(whole) * TWD_SCALE + Number((fraction + "00").slice(0, 2));
  return negative ? -cents : cents;
}

export function fromCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const unsigned = Math.abs(Math.round(cents));
  return `${sign}${Math.floor(unsigned / TWD_SCALE)}.${String(unsigned % TWD_SCALE).padStart(2, "0")}`;
}

function multiplyCents(cents: number, multiplier: number): number {
  if (!Number.isFinite(multiplier)) throw new Error("薪資計算倍率必須為有效數字");
  return Math.round(cents * multiplier);
}

function line(
  category: PayrollCalculatedLine["category"],
  direction: PayrollCalculatedLine["direction"],
  label: string,
  cents: number,
): PayrollCalculatedLine | null {
  if (cents === 0) return null;
  return { category, direction, label, amount: fromCents(cents) };
}

function baseHourlyRateCents(snapshot: PayrollSalarySnapshot): number {
  if (snapshot.salaryType === "daily") return Math.round(toCents(snapshot.dailyRate) / 8);
  if (snapshot.salaryType === "hourly") return toCents(snapshot.hourlyRate);
  return snapshot.dailyRate ? Math.round(toCents(snapshot.dailyRate) / 8) : toCents(snapshot.hourlyRate);
}

/** 計算單一員工於指定薪資期間的完整收入／扣款明細。 */
export function calculatePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const lines: PayrollCalculatedLine[] = [];
  const salary = input.salary;
  const dailyRate = toCents(salary.dailyRate);
  const hourlyRate = baseHourlyRateCents(salary);
  // V1.0 已明定滿 5 小時固定餐費 $100，不可改以基本時薪或個別金額替代。
  const mealAllowance = toCents("100.00");
  const supervisorAllowance = toCents(salary.supervisorAllowance);

  let grossCents = 0;
  let deductionCents = 0;
  let totalWorkDays = 0;
  let halfDays = 0;
  let totalWorkHours = 0;

  for (const attendance of input.attendance) {
    const hours = Math.max(0, attendance.workHours || 0);
    totalWorkHours += hours;
    const isFullDay = ["present", "late", "early_leave", "emergency_overtime"].includes(attendance.status);
    const isHalfDay = attendance.status === "half_day";

    let baseCents = 0;
    if (isFullDay) {
      totalWorkDays += 1;
      if (salary.salaryType === "daily") baseCents = dailyRate;
      else if (salary.salaryType === "hourly") baseCents = multiplyCents(hourlyRate, hours);
    } else if (isHalfDay) {
      halfDays += 1;
      if (salary.salaryType === "daily") baseCents = Math.round(dailyRate / 2);
      else if (salary.salaryType === "hourly") baseCents = multiplyCents(hourlyRate, hours);
    }
    if (baseCents) {
      grossCents += baseCents;
      lines.push(line(salary.salaryType === "hourly" ? "hourly_wage" : "daily_wage", "income", isHalfDay ? "半日基本薪資" : "基本薪資", baseCents)!);
    }

    if (hours >= 5 && isFullDay) {
      grossCents += mealAllowance;
      lines.push(line("meal", "income", "餐費", mealAllowance)!);
    }
    if (isFullDay && supervisorAllowance > 0) {
      grossCents += supervisorAllowance;
      lines.push(line("supervisor_allowance", "income", "主管津貼", supervisorAllowance)!);
    }

    const lateCents = multiplyCents(hourlyRate, Math.max(0, attendance.lateMinutes ?? 0) / 60);
    const earlyCents = multiplyCents(hourlyRate, Math.max(0, attendance.earlyLeaveMinutes ?? 0) / 60);
    if (lateCents) {
      deductionCents += lateCents;
      lines.push(line("late", "deduction", "遲到扣款", lateCents)!);
    }
    if (earlyCents) {
      deductionCents += earlyCents;
      lines.push(line("early_leave", "deduction", "早退扣款", earlyCents)!);
    }
  }

  if (salary.salaryType === "monthly") {
    const monthlyCents = toCents(salary.monthlyRate);
    grossCents += monthlyCents;
    const monthlyLine = line("base_salary", "income", "固定月薪", monthlyCents);
    if (monthlyLine) lines.push(monthlyLine);
  }

  let overtimeHours = 0;
  input.overtime.filter((record) => record.status === "approved").forEach((record) => {
    overtimeHours += Math.max(0, record.hours);
    const cents = record.manualAmount === null || record.manualAmount === undefined
      ? toCents(record.calculatedAmount)
      : toCents(record.manualAmount);
    if (cents) {
      grossCents += cents;
      lines.push(line("overtime", "income", "加班費", cents)!);
    }
  });

  const appendAdjustments = (
    adjustments: PayrollAdjustmentInput[] | undefined,
    category: PayrollCalculatedLine["category"],
    direction: "income" | "deduction",
  ) => adjustments?.forEach((adjustment) => {
    const cents = toCents(adjustment.amount);
    if (!cents) return;
    if (direction === "income") grossCents += cents;
    else deductionCents += cents;
    lines.push(line(category, direction, adjustment.label, cents)!);
  });

  appendAdjustments(input.bonuses, "bonus", "income");
  appendAdjustments(input.otherIncome, "other_income", "income");
  appendAdjustments(input.advanceDeductions, "advance", "deduction");
  appendAdjustments(input.deductions, "other_deduction", "deduction");

  return {
    totalWorkDays,
    halfDays,
    totalWorkHours: Number(totalWorkHours.toFixed(2)),
    overtimeHours: Number(overtimeHours.toFixed(2)),
    grossPay: fromCents(grossCents),
    deductionTotal: fromCents(deductionCents),
    netPay: fromCents(grossCents - deductionCents),
    lines,
  };
}
