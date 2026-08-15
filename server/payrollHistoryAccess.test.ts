import { describe, expect, it } from "vitest";
import { payrollRouter } from "./payroll";

function createCaller(role: "super_admin" | "admin" | "accountant" | "supervisor" | "employee", email = "staff@example.com") {
  return payrollRouter.createCaller({
    req: {} as never,
    res: {} as never,
    user: { id: 99, openId: "payroll-history-test", name: "測試使用者", email, role, isActive: true } as never,
  });
}

describe("薪資歷史 API 權限隔離", () => {
  it("拒絕主管查閱員工薪資調整紀錄及已領薪資歷史", async () => {
    const caller = createCaller("supervisor", "supervisor@example.com");
    await expect(caller.employees.salaryAdjustmentHistory({ employeeId: 21 })).rejects.toThrow("僅限管理員或會計操作薪資資料");
    await expect(caller.employees.payslipHistory({ employeeId: 21 })).rejects.toThrow("僅限管理員或會計操作薪資資料");
  });

  it("拒絕一般員工以任意員工編號查閱薪資調整與薪資條歷史", async () => {
    const caller = createCaller("employee", "employee@example.com");
    await expect(caller.employees.salaryAdjustmentHistory({ employeeId: 21 })).rejects.toThrow("僅限管理員或會計操作薪資資料");
    await expect(caller.employees.payslipHistory({ employeeId: 21 })).rejects.toThrow("僅限管理員或會計操作薪資資料");
  });
});
