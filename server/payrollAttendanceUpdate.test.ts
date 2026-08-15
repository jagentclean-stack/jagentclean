import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  selectResults: [] as Array<Array<Record<string, unknown>>>,
  writeAudit: vi.fn(async () => undefined),
  updateSet: vi.fn(),
}));

const dbMock = vi.hoisted(() => ({
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({ limit: vi.fn(async () => state.selectResults.shift() || []) })),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn((values) => {
      state.updateSet(values);
      return { where: vi.fn(async () => undefined) };
    }),
  })),
}));

vi.mock("./payrollDb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./payrollDb")>();
  return { ...actual, requirePayrollDb: vi.fn(async () => dbMock), writePayrollAudit: state.writeAudit };
});

import { payrollRouter } from "./payroll";

const input = {
  id: 9,
  employeeId: 3,
  scheduleId: 14,
  workDate: "2026-08-10",
  scheduledStartTime: null,
  scheduledEndTime: null,
  actualStartTime: "09:00",
  actualEndTime: "17:30",
  workHours: "8.00",
  status: "present" as const,
  lateMinutes: 0,
  earlyLeaveMinutes: 0,
  mealAllowance: "120.00",
  notes: "補登完成",
};

const existing = { id: 9, employeeId: 3, workDate: "2026-08-10", workHours: "7.50", status: "late", notes: "原始資料" };
const createCaller = (role: string) => payrollRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 70, openId: "payroll-attendance-route", name: "Tester", email: "tester@example.com", role, isActive: true } as never,
});

beforeEach(() => {
  state.selectResults = [];
  state.writeAudit.mockClear();
  state.updateSet.mockClear();
  dbMock.select.mockClear();
  dbMock.update.mockClear();
});

describe("payroll.attendance.update", () => {
  it("拒絕沒有出勤管理權限的使用者", async () => {
    await expect(createCaller("employee").attendance.update(input)).rejects.toThrow();
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(state.writeAudit).not.toHaveBeenCalled();
  });

  it("拒絕修改落在已確認或已發薪薪資週期的出勤紀錄", async () => {
    state.selectResults = [[existing], [{ status: "confirmed" }]];
    await expect(createCaller("supervisor").attendance.update(input)).rejects.toThrow("已確認或已發薪的薪資週期不可直接修改");
    expect(dbMock.update).not.toHaveBeenCalled();
    expect(state.writeAudit).not.toHaveBeenCalled();
  });

  it("成功更新時保留修改前後資料的稽核紀錄", async () => {
    state.selectResults = [[existing], []];
    await expect(createCaller("supervisor").attendance.update(input)).resolves.toEqual({ success: true });
    expect(state.updateSet).toHaveBeenCalledWith(expect.objectContaining({ workHours: "8.00", notes: "補登完成" }));
    expect(state.writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: 70,
      entityType: "attendance",
      entityId: 9,
      action: "update",
      beforeData: existing,
      afterData: expect.objectContaining({ workHours: "8.00", notes: "補登完成" }),
    }));
  });
});
