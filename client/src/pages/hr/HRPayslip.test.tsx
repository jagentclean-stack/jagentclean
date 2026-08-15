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
      runs: {
        list: { useQuery: () => ({ data: [{ id: 44, employeeId: 8, netPay: 28800, status: "confirmed" }] }) },
        detail: { useQuery: () => ({ data: { run: { id: 44, employeeId: 8, grossPay: 30000, deductionTotal: 1200, netPay: 28800, status: "confirmed" }, items: [{ id: 91, label: "基本日薪", category: "base_pay", direction: "income", amount: 30000 }, { id: 92, label: "勞健保", category: "insurance", direction: "deduction", amount: 1200 }] } }) },
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
  it("選取已確認薪資條後顯示下載入口與完整明細", () => {
    render(<HRPayslip />);
    fireEvent.click(screen.getByRole("button", { name: /林小潔/ }));
    expect(screen.getByText("基本日薪")).toBeTruthy();
    expect(screen.getByText("勞健保")).toBeTruthy();
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
