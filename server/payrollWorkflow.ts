export type PayrollPeriodStatus = "draft" | "pending_review" | "confirmed" | "pending_payment" | "paid";

export const PAYROLL_PERIOD_TRANSITIONS: Record<PayrollPeriodStatus, PayrollPeriodStatus[]> = {
  draft: ["pending_review"],
  pending_review: ["confirmed", "draft"],
  confirmed: ["pending_payment"],
  pending_payment: ["paid"],
  paid: [],
};

export function isPayrollPeriodLocked(status: PayrollPeriodStatus) {
  return status === "confirmed" || status === "pending_payment" || status === "paid";
}

export function canTransitionPayrollPeriod(from: PayrollPeriodStatus, to: PayrollPeriodStatus) {
  return PAYROLL_PERIOD_TRANSITIONS[from].includes(to);
}
