// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({ updateSalary: vi.fn(), updateEmployee: vi.fn(), deleteEmployee: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ payroll: {
      employees: {
        list: { invalidate: vi.fn() },
        salaryConfig: { invalidate: vi.fn() },
        salaryAdjustmentHistory: { invalidate: vi.fn() },
      },
      periods: { invalidate: vi.fn() },
    } }),
    payroll: {
      access: { useQuery: () => ({ data: { canManageOperations: true, canManagePayroll: true } }) },
      employees: {
        list: { useQuery: () => ({ data: [{
          id: 21,
          name: "林小潔",
          employeeCode: "EMP-001",
          jobTitle: "清潔專員",
          phone: "0912345678",
          bankName: "合作金庫",
          bankAccountMasked: "****5678",
          hireDate: "2026-01-01",
          employmentStatus: "active",
        }], isLoading: false }) },
        salaryConfig: { useQuery: () => ({ data: [{
          id: 7,
          effectiveFrom: "2026-08-01",
          salaryType: "daily",
          dailyRate: "1800.00",
          mealAllowance: "100.00",
          supervisorAllowance: "0.00",
          drivingAllowance: "0.00",
          transportationAllowance: "0.00",
          otherAllowance: "0.00",
          overtimeMode: "hourly_multiplier",
          overtimeMultiplier: "1.50",
        }] }) },
        salaryAdjustmentHistory: { useQuery: () => ({ data: [{
          id: 8,
          effectiveDate: "2026-08-01",
          createdAt: "2026-08-01T00:00:00.000Z",
          operatorName: "會計主管",
          reason: "通過試用期調整日薪",
          previousConfig: { dailyRate: "1600.00", monthlyRate: null },
          newConfig: { dailyRate: "1800.00", monthlyRate: null },
        }], isLoading: false }) },
        payslipHistory: { useQuery: () => ({ data: [{
          run: { id: 9, netPay: "25600.00", status: "paid" },
          period: { label: "2026 年 07 月", periodStart: "2026-07-01", periodEnd: "2026-07-31" },
          payment: { status: "transferred" },
        }], isLoading: false }) },
        create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        update: { useMutation: () => ({ isPending: false, mutate: state.updateEmployee }) },
        delete: { useMutation: () => ({ isPending: false, mutate: state.deleteEmployee }) },
        updateSalaryConfig: { useMutation: () => ({ isPending: false, mutate: state.updateSalary }) },
      },
    },
  },
}));

vi.mock("./HRLayout", () => ({
  HRLayout: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import HREmployees from "./HREmployees";

afterEach(() => {
  cleanup();
  state.updateSalary.mockReset();
  state.updateEmployee.mockReset();
  state.deleteEmployee.mockReset();
});

describe("HREmployees 員工薪資管理", () => {
  it("可從員工明細輸入薪資設定、檢視調整前後與已領薪資歷史", () => {
    render(<HREmployees />);

    fireEvent.click(screen.getByText("林小潔"));
    expect(screen.getByText("EMP-001 · 清潔專員")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "薪資設定" }));
    expect(screen.getByText("基本日薪")).toBeTruthy();
    expect(screen.getByText("餐費（符合出勤條件）")).toBeTruthy();
    expect(screen.getByRole("button", { name: "儲存薪資設定並建立調整紀錄" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "調整紀錄" }));
    expect(screen.getByText("2026-08-01 生效")).toBeTruthy();
    expect(screen.getByText(/操作人：會計主管/)).toBeTruthy();
    expect(screen.getByText("$1,600 ／ —")).toBeTruthy();
    expect(screen.getByText("$1,800 ／ —")).toBeTruthy();
    expect(screen.getByText("原因：通過試用期調整日薪")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "薪資歷史" }));
    expect(screen.getByText("2026 年 07 月")).toBeTruthy();
    expect(screen.getByText("$25,600")).toBeTruthy();
    expect(screen.getByText(/已匯款/)).toBeTruthy();
  });

  it("可編輯員工主檔，且刪除動作會先確認並交由安全刪除流程判斷", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<HREmployees />);

    fireEvent.click(screen.getByText("林小潔"));
    fireEvent.click(screen.getByRole("button", { name: "編輯資料" }));
    const nameInput = screen.getByDisplayValue("林小潔");
    fireEvent.change(nameInput, { target: { value: "林小潔（更新）" } });
    fireEvent.submit(screen.getByRole("button", { name: "儲存基本資料" }).closest("form")!);
    expect(state.updateEmployee).toHaveBeenCalledWith(expect.objectContaining({ id: 21, name: "林小潔（更新）" }));

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    fireEvent.click(screen.getByRole("button", { name: "刪除／停用員工" }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(state.deleteEmployee).toHaveBeenCalledWith({ id: 21 });
    confirmSpy.mockRestore();
  });
});
