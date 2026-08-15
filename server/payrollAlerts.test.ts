import { describe, expect, it } from "vitest";
import { buildPayrollAlertCandidates } from "./payrollDb";

describe("buildPayrollAlertCandidates", () => {
  it("逐條建立薪資設定、銀行、出勤、加班、試算與借支異常警示", () => {
    const alerts = buildPayrollAlertCandidates({
      activeEmployees: [{ id: 7, name: "林小潔", bankAccountEncrypted: null }],
      payrollPeriodId: 55,
      salaryConfiguredEmployeeIds: new Set(),
      schedules: [{ employeeId: 7, status: "scheduled" }, { employeeId: 7, status: "scheduled" }],
      attendance: [{ employeeId: 7 }],
      overtime: [{ employeeId: 7, status: "pending" }],
      payrollRuns: [],
      advances: [{ employeeId: 7, outstandingAmount: "1200.00" }],
    });

    expect(alerts.map((item) => item.type)).toEqual([
      "salary_setting_missing",
      "bank_account_missing",
      "attendance_missing",
      "overtime_pending",
      "payroll_unreviewed",
      "advance_outstanding",
    ]);
    expect(alerts[0]).toMatchObject({ severity: "critical", payrollPeriodId: 55 });
    expect(alerts.at(-1)?.message).toContain("$1,200");
  });

  it("不為完整資料及已取消排班建立誤報警示", () => {
    const alerts = buildPayrollAlertCandidates({
      activeEmployees: [{ id: 8, name: "王小明", bankAccountEncrypted: "encrypted" }],
      payrollPeriodId: 56,
      salaryConfiguredEmployeeIds: new Set([8]),
      schedules: [{ employeeId: 8, status: "cancelled" }, { employeeId: 8, status: "scheduled" }],
      attendance: [{ employeeId: 8 }],
      overtime: [{ employeeId: 8, status: "approved" }],
      payrollRuns: [{ employeeId: 8 }],
      advances: [{ employeeId: 8, outstandingAmount: "0" }],
    });

    expect(alerts).toEqual([]);
  });
});
