import { describe, expect, it } from "vitest";
import { canTransitionPayrollPeriod, isPayrollPeriodLocked } from "./payrollWorkflow";

describe("薪資週期工作流", () => {
  it("只允許已定義的審核與發薪順序", () => {
    expect(canTransitionPayrollPeriod("draft", "pending_review")).toBe(true);
    expect(canTransitionPayrollPeriod("pending_review", "confirmed")).toBe(true);
    expect(canTransitionPayrollPeriod("confirmed", "pending_payment")).toBe(true);
    expect(canTransitionPayrollPeriod("pending_payment", "paid")).toBe(true);
    expect(canTransitionPayrollPeriod("draft", "paid")).toBe(false);
    expect(canTransitionPayrollPeriod("paid", "draft")).toBe(false);
  });

  it("確認、待發薪與已發薪週期皆不可直接重算或修改", () => {
    expect(isPayrollPeriodLocked("draft")).toBe(false);
    expect(isPayrollPeriodLocked("pending_review")).toBe(false);
    expect(isPayrollPeriodLocked("confirmed")).toBe(true);
    expect(isPayrollPeriodLocked("pending_payment")).toBe(true);
    expect(isPayrollPeriodLocked("paid")).toBe(true);
  });
});
