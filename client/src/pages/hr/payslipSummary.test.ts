import { describe, expect, it } from "vitest";
import { buildPayslipSummary } from "./payslipSummary";

describe("buildPayslipSummary", () => {
  it("將薪資條長明細歸納為基本薪資、餐費、加班、獎金、借支扣款與尚欠借支", () => {
    const summary = buildPayslipSummary([
      { category: "daily_wage", direction: "income", amount: "24000.00" },
      { category: "meal", direction: "income", amount: "2100.00" },
      { category: "overtime", direction: "income", amount: "1600.00" },
      { category: "bonus", direction: "income", amount: "3000.00" },
      { category: "other_income", direction: "income", amount: "500.00" },
      { category: "advance", direction: "deduction", amount: "2000.00" },
      { category: "other_deduction", direction: "deduction", amount: "800.00" },
    ], { grossPay: "31200.00", deductionTotal: "2800.00", netPay: "28400.00" }, "6500.00");

    expect(summary).toMatchObject({
      basePay: 24000,
      mealAllowance: 2100,
      overtimePay: 1600,
      bonusPay: 3000,
      otherIncome: 500,
      advanceDeduction: 2000,
      otherDeductions: 800,
      outstandingAdvance: 6500,
      netPay: 28400,
    });
  });

  it("不因無效金額或負數尚欠金額產生錯誤的薪資條摘要", () => {
    const summary = buildPayslipSummary([{ category: "meal", direction: "income", amount: "not-a-number" }], { grossPay: 0, deductionTotal: 0, netPay: 0 }, -100);
    expect(summary.mealAllowance).toBe(0);
    expect(summary.outstandingAdvance).toBe(0);
  });
});
