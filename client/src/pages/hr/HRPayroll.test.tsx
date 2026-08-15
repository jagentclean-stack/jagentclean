// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({
  periodStatus: "draft",
  batchCalculate: vi.fn(),
  resolveAlert: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ payroll: {
      periods: { list: { invalidate: vi.fn() } },
      runs: { list: { invalidate: vi.fn() } },
      alerts: { list: { invalidate: vi.fn() } },
      dashboard: { summary: { invalidate: vi.fn() } },
    } }),
    payroll: {
      periods: {
        list: { useQuery: () => ({ data: [{ id: 11, label: "115 年 7 月", periodStart: "2026-07-01", periodEnd: "2026-07-31", periodType: "monthly", status: state.periodStatus }] }) },
        create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        createByType: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        transition: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      },
      employees: { list: { useQuery: () => ({ data: [{ id: 22, name: "林小潔" }] }) } },
      alerts: {
        list: { useQuery: () => ({ data: [{ id: 33, type: "missing_bank", message: "林小潔尚未設定銀行資料", isResolved: false }] }) },
        refresh: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        resolve: { useMutation: () => ({ isPending: false, mutate: state.resolveAlert }) },
      },
      runs: {
        list: { useQuery: () => ({ data: [] }) },
        calculate: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        calculateBatch: { useMutation: () => ({ isPending: false, mutate: state.batchCalculate }) },
      },
      dashboard: { summary: { useQuery: () => ({ data: null }) } },
    },
  },
}));

vi.mock("./HRLayout", () => ({
  HRLayout: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
  formatTwd: (amount: number) => `$${amount.toLocaleString("zh-TW")}`,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import HRPayroll from "./HRPayroll";

afterEach(() => {
  cleanup();
  state.periodStatus = "draft";
  state.batchCalculate.mockReset();
  state.resolveAlert.mockReset();
});

describe("HRPayroll 薪資工作台", () => {
  it("可從薪資週期執行全員批次試算，並處理異常警示", () => {
    render(<HRPayroll />);
    expect(screen.getAllByText("115 年 7 月").length).toBeGreaterThan(0);
    expect(screen.getByText("林小潔尚未設定銀行資料")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "批次試算全體員工" }));
    expect(state.batchCalculate).toHaveBeenCalledWith({ payrollPeriodId: 11, employeeIds: [22] });

    fireEvent.click(screen.getByRole("button", { name: "標記已處理" }));
    expect(state.resolveAlert).toHaveBeenCalledWith({ id: 33 });
  });

  it("已確認週期不提供重新試算按鈕，避免直接改寫已鎖定薪資", () => {
    state.periodStatus = "confirmed";
    render(<HRPayroll />);
    expect(screen.queryByRole("button", { name: "批次試算全體員工" })).toBeNull();
    expect(screen.queryByRole("button", { name: "試算" })).toBeNull();
    expect(screen.getByText("已鎖定")).toBeTruthy();
  });
});
