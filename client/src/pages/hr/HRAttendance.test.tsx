// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({
  update: vi.fn(),
  invalidate: vi.fn(),
  attendance: [{ id: 9, employeeId: 3, scheduleId: 14, workDate: "2026-08-10", workHours: "7.50", status: "late", actualStartTime: "09:15", actualEndTime: "17:45", lateMinutes: 15, earlyLeaveMinutes: 0, mealAllowance: "120.00", notes: "交通延誤" }],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ payroll: { attendance: { list: { invalidate: state.invalidate } } } }),
    payroll: {
      employees: { list: { useQuery: () => ({ data: [{ id: 3, name: "王小明" }] }) } },
      attendance: {
        list: { useQuery: () => ({ data: state.attendance }) },
        create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
        update: { useMutation: () => ({ mutate: state.update, isPending: false }) },
      },
    },
  },
}));

vi.mock("./HRLayout", () => ({
  HRLayout: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
  monthRange: () => ({ start: "2026-08-01", end: "2026-08-31" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import HRAttendance from "./HRAttendance";

afterEach(() => {
  cleanup();
  state.update.mockReset();
  state.invalidate.mockReset();
});

describe("HRAttendance", () => {
  it("可編輯既有出勤並將修改後資料送往受保護的更新程序", () => {
    render(<HRAttendance />);
    fireEvent.click(screen.getByRole("button", { name: "編輯 2026-08-10 出勤紀錄" }));

    expect(screen.getByRole("dialog", { name: "編輯出勤紀錄" })).toBeTruthy();
    expect((screen.getByLabelText("工時") as HTMLInputElement).value).toBe("7.50");
    expect((screen.getByLabelText("備註") as HTMLInputElement).value).toBe("交通延誤");

    fireEvent.change(screen.getByLabelText("工時"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("備註"), { target: { value: "補登完成" } });
    fireEvent.click(screen.getByRole("button", { name: "儲存變更" }));

    expect(state.update).toHaveBeenCalledWith({
      id: 9,
      employeeId: 3,
      scheduleId: 14,
      workDate: "2026-08-10",
      workHours: "8",
      status: "late",
      actualStartTime: "09:15",
      actualEndTime: "17:45",
      lateMinutes: 15,
      earlyLeaveMinutes: 0,
      mealAllowance: "120.00",
      notes: "補登完成",
    });
  });
});
