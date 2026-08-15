import { describe, expect, it } from "vitest";
import { buildPayrollPeriodDefinition } from "./payroll";

describe("buildPayrollPeriodDefinition", () => {
  it("正確建立上半月、下半月與整月薪資週期，並處理閏年二月", () => {
    expect(buildPayrollPeriodDefinition(2026, 7, "first_half")).toMatchObject({ periodStart: "2026-07-01", periodEnd: "2026-07-15", periodType: "first_half" });
    expect(buildPayrollPeriodDefinition(2026, 7, "second_half")).toMatchObject({ periodStart: "2026-07-16", periodEnd: "2026-07-31", periodType: "second_half" });
    expect(buildPayrollPeriodDefinition(2024, 2, "monthly")).toMatchObject({ periodStart: "2024-02-01", periodEnd: "2024-02-29", periodType: "monthly" });
  });
});
