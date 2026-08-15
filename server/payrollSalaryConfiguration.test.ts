import { describe, expect, it } from "vitest";
import { determineEmployeeDeletionMode, getNextEmployeeCodeFromExisting, oneDayBefore } from "./payroll";

describe("薪資設定版本化基礎規則", () => {
  it("以最高既有 EMP 編號產生下一個編號，且不重用已刪除或停用員工的號碼", () => {
    expect(getNextEmployeeCodeFromExisting([])).toBe("EMP-001");
    expect(getNextEmployeeCodeFromExisting(["EMP-001", "EMP-007", null, "legacy-8"])).toBe("EMP-008");
    expect(getNextEmployeeCodeFromExisting(["emp-099", "EMP-003"])).toBe("EMP-100");
  });

  it("建立新薪資版本時，以新生效日前一天作為前一版本截止日", () => {
    expect(oneDayBefore("2026-08-16")).toBe("2026-08-15");
    expect(oneDayBefore("2026-03-01")).toBe("2026-02-28");
    expect(oneDayBefore("2024-03-01")).toBe("2024-02-29");
  });

  it("只允許沒有任何關聯資料的員工永久刪除，避免薪資與出勤歷史遺失", () => {
    expect(determineEmployeeDeletionMode({ hasRelatedRecords: false, hasLockedPayroll: false }).mode).toBe("hard");
    expect(determineEmployeeDeletionMode({ hasRelatedRecords: true, hasLockedPayroll: false }).mode).toBe("soft");
    expect(determineEmployeeDeletionMode({ hasRelatedRecords: true, hasLockedPayroll: true })).toMatchObject({
      mode: "soft",
      reason: expect.stringContaining("已確認或已發薪"),
    });
  });
});
