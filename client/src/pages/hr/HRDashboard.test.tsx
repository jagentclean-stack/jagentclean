// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({
  summaryQuery: vi.fn((input?: { payrollPeriodId: number }) => ({
    data: {
      employeeCount: input?.payrollPeriodId === 2 ? 8 : 6,
      payrollRunCount: 5,
      pendingPayments: 2,
      netPay: input?.payrollPeriodId === 2 ? 72000 : 56500,
      selectedPeriod: { label: input?.payrollPeriodId === 2 ? "115 年 8 月" : "115 年 7 月", periodStart: "2026-07-01", periodEnd: "2026-07-31" },
      payrollTrend: [{ id: 1, label: "115 年 6 月", netPay: 52000 }, { id: 2, label: "115 年 7 月", netPay: 56500 }],
      unresolvedAlerts: [{ id: 3, type: "missing_attendance", message: "有 1 筆出勤尚未確認" }],
    },
  })),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    payroll: {
      periods: { list: { useQuery: () => ({ data: [{ id: 1, label: "115 年 7 月" }, { id: 2, label: "115 年 8 月" }] }) } },
      dashboard: { summary: { useQuery: state.summaryQuery } },
    },
  },
}));

vi.mock("./HRLayout", () => ({
  HRLayout: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
  formatTwd: (amount?: number) => `$${Number(amount ?? 0).toLocaleString("zh-TW")}`,
}));

import HRDashboard from "./HRDashboard";

describe("HRDashboard", () => {
  it("依選定薪資週期呈現本期指標、趨勢與未處理異常", () => {
    render(<HRDashboard />);
    expect(screen.getByText("首頁 Dashboard")).toBeTruthy();
    expect(screen.getAllByText("$56,500").length).toBeGreaterThan(0);
    expect(screen.getByText("有 1 筆出勤尚未確認")).toBeTruthy();
    expect(screen.getByText("115 年 6 月")).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    expect(state.summaryQuery).toHaveBeenLastCalledWith({ payrollPeriodId: 2 });
    expect(screen.getByText("$72,000")).toBeTruthy();
  });
});
