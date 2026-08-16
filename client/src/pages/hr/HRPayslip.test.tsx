// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const upsertPayment = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ payroll: { payments: { list: { invalidate: vi.fn() } }, runs: { list: { invalidate: vi.fn() }, detail: { invalidate: vi.fn() } } } }),
    payroll: {
      periods: { list: { useQuery: () => ({ data: [{ id: 1, label: "115 年 7 月" }] }) } },
      employees: { list: { useQuery: () => ({ data: [{ id: 8, name: "林小潔" }] }) } },
      advances: { list: { useQuery: () => ({ data: [{ id: 7, employeeId: 8, outstandingAmount: "6500.00" }] }) } },
      runs: {
        list: { useQuery: () => ({ data: [{ id: 44, employeeId: 8, netPay: 28800, status: "confirmed" }] }) },
        detail: { useQuery: () => ({ data: { run: { id: 44, employeeId: 8, grossPay: 33700, deductionTotal: 3200, netPay: 30500, status: "confirmed" }, items: [{ id: 91, label: "基本日薪", category: "daily_wage", direction: "income", amount: 30000 }, { id: 92, label: "餐費", category: "meal", direction: "income", amount: 1200 }, { id: 93, label: "加班費", category: "overtime", direction: "income", amount: 1500 }, { id: 94, label: "獎金", category: "bonus", direction: "income", amount: 1000 }, { id: 95, label: "借支扣回", category: "advance", direction: "deduction", amount: 2000 }, { id: 96, label: "勞健保", category: "insurance", direction: "deduction", amount: 1200 }] } }) },
      },
      payments: {
        list: { useQuery: () => ({ data: [] }) },
        upsert: { useMutation: () => ({ isPending: false, error: null, mutate: upsertPayment }) },
      },
    },
  },
}));

vi.mock("./hrExport", () => ({ downloadCanvasAsPdf: vi.fn() }));
vi.mock("./HRLayout", () => ({
  HRLayout: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
  formatTwd: (amount?: number) => `$${Number(amount ?? 0).toLocaleString("zh-TW")}`,
}));

import HRPayslip from "./HRPayslip";

afterEach(() => { cleanup(); upsertPayment.mockReset(); });

describe("HRPayslip", () => {
  it("選取已確認薪資條後顯示收入、借支扣款與尚欠借支彙總", () => {
    render(<HRPayslip />);
    fireEvent.click(screen.getByRole("button", { name: /林小潔/ }));
    expect(screen.getByText("基本薪資總計")).toBeTruthy();
    expect(screen.getByText("餐費總計")).toBeTruthy();
    expect(screen.getByText("加班費總計")).toBeTruthy();
    expect(screen.getByText("獎金總計")).toBeTruthy();
    expect(screen.getByText("本期借支扣款")).toBeTruthy();
    expect(screen.getByText("目前尚欠借支")).toBeTruthy();
    expect(screen.getByText("$6,500")).toBeTruthy();
    expect(screen.getByRole("button", { name: "下載 PNG" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "下載 PDF" })).toBeTruthy();
  });

  it("可將已確認薪資條登錄為已匯款，且保留正確發薪方法與狀態", () => {
    render(<HRPayslip />);
    fireEvent.click(screen.getByRole("button", { name: /林小潔/ }));
    fireEvent.click(screen.getByRole("button", { name: "標記已匯款" }));
    expect(upsertPayment).toHaveBeenCalledWith(expect.objectContaining({ payrollRunId: 44, paymentMethod: "transfer", status: "transferred" }));
  });
});
