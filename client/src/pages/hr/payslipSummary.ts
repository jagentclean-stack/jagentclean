export type PayslipLine = {
  category: string;
  direction: "income" | "deduction";
  amount: string | number;
};

export type PayslipSummary = {
  basePay: number;
  mealAllowance: number;
  overtimePay: number;
  bonusPay: number;
  otherIncome: number;
  advanceDeduction: number;
  otherDeductions: number;
  deductionTotal: number;
  grossPay: number;
  netPay: number;
  outstandingAdvance: number;
};

const BASIC_PAY_CATEGORIES = new Set(["base_salary", "daily_wage", "hourly_wage"]);
const BONUS_CATEGORIES = new Set(["bonus", "perfect_attendance"]);

function toAmount(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 將薪資明細分類為薪資條所需的可讀彙總；不重複執行或改寫薪資計算。 */
export function buildPayslipSummary(
  items: PayslipLine[],
  run: { grossPay: string | number; deductionTotal: string | number; netPay: string | number },
  outstandingAdvance: string | number = 0,
): PayslipSummary {
  const summary: PayslipSummary = {
    basePay: 0,
    mealAllowance: 0,
    overtimePay: 0,
    bonusPay: 0,
    otherIncome: 0,
    advanceDeduction: 0,
    otherDeductions: 0,
    deductionTotal: toAmount(run.deductionTotal),
    grossPay: toAmount(run.grossPay),
    netPay: toAmount(run.netPay),
    outstandingAdvance: Math.max(0, toAmount(outstandingAdvance)),
  };

  for (const item of items) {
    const amount = toAmount(item.amount);
    if (item.direction === "deduction") {
      if (item.category === "advance") summary.advanceDeduction += amount;
      else summary.otherDeductions += amount;
      continue;
    }

    if (BASIC_PAY_CATEGORIES.has(item.category)) summary.basePay += amount;
    else if (item.category === "meal") summary.mealAllowance += amount;
    else if (item.category === "overtime") summary.overtimePay += amount;
    else if (BONUS_CATEGORIES.has(item.category)) summary.bonusPay += amount;
    else summary.otherIncome += amount;
  }

  return summary;
}
