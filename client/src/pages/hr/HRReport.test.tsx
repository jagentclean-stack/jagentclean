// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({ exportWorkbook: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    payroll: {
      periods: { list: { useQuery: () => ({ data: [{ id: 1, label: "115 年 7 月" }] }) } },
      employees: { list: { useQuery: () => ({ data: [{ id: 8, name: "林小潔" }, { id: 9, name: "王小明" }] }) } },
      runs: { list: { useQuery: () => ({ data: [
        { employeeId: 8, grossPay: 30000, deductionTotal: 1200, netPay: 28800, status: "paid" },
        { employeeId: 9, grossPay: 28000, deductionTotal: 500, netPay: 27500, status: "draft" },
      ] }) } },
    },
  },
}));

vi.mock("./hrExport", () => ({ downloadPayrollReportWorkbook: state.exportWorkbook }));
vi.mock("./HRLayout", () => ({
  HRLayout: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
  formatTwd: (amount?: number) => `$${Number(amount ?? 0).toLocaleString("zh-TW")}`,
}));

import HRReport from "./HRReport";

afterEach(() => cleanup());

describe("HRReport", () => {
  it("依姓名與發薪狀態篩選薪資列，並以篩選後資料匯出 Excel", () => {
    render(<HRReport />);
    expect(screen.getByText("共 2 筆")).toBeTruthy();
    expect(screen.getByText("$56,300")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("輸入員工姓名"), { target: { value: "林" } });
    expect(screen.getByText("共 1 筆")).toBeTruthy();
    expect(screen.getAllByText("$28,800").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "下載 Excel" }));
    expect(state.exportWorkbook).toHaveBeenCalledWith("115 年 7 月", [expect.objectContaining({ employeeName: "林小潔", netPay: 28800 })]);
  });

  it("可依發薪狀態顯示已發薪明細", () => {
    render(<HRReport />);
    const statusSelect = screen.getAllByDisplayValue("全部狀態").at(-1)!;
    fireEvent.change(statusSelect, { target: { value: "paid" } });
    expect(screen.getByRole("row", { name: /林小潔.*已發薪/ })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });
});
