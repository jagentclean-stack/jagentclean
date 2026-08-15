import { describe, expect, it } from "vitest";
import { shouldShowHrLoading } from "./HRLayout";

describe("shouldShowHrLoading", () => {
  it("僅在登入資訊或已啟用的權限查詢尚未完成時維持載入畫面", () => {
    expect(shouldShowHrLoading(true, false, false)).toBe(true);
    expect(shouldShowHrLoading(false, true, true)).toBe(true);
    expect(shouldShowHrLoading(false, false, true)).toBe(false);
    expect(shouldShowHrLoading(false, true, false)).toBe(false);
  });
});
