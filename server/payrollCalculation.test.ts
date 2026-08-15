import { describe, expect, it } from "vitest";
import { calculatePayroll } from "./payrollCalculation";

const dailySalary = {
  salaryType: "daily" as const,
  dailyRate: "1600.00",
  mealAllowance: "100.00",
  supervisorAllowance: "300.00",
};

describe("人事薪資 V1.0 計算引擎", () => {
  it("日薪 $1,600 的整日 8 小時包含 $100 餐費與主管津貼", () => {
    const result = calculatePayroll({ salary: dailySalary, attendance: [{ status: "present", workHours: 8 }], overtime: [] });
    expect(result.grossPay).toBe("2000.00");
    expect(result.netPay).toBe("2000.00");
    expect(result.totalWorkDays).toBe(1);
  });

  it("未滿 5 小時不發餐費", () => {
    const result = calculatePayroll({ salary: dailySalary, attendance: [{ status: "present", workHours: 4 }], overtime: [] });
    expect(result.lines.some((item) => item.category === "meal")).toBe(false);
  });

  it("半日為日薪一半且不發主管津貼", () => {
    const result = calculatePayroll({ salary: dailySalary, attendance: [{ status: "half_day", workHours: 4 }], overtime: [] });
    expect(result.grossPay).toBe("800.00");
    expect(result.halfDays).toBe(1);
    expect(result.lines.some((item) => item.category === "supervisor_allowance")).toBe(false);
  });

  it("僅把已核准的加班納入薪資，且可人工覆寫金額", () => {
    const result = calculatePayroll({
      salary: dailySalary,
      attendance: [],
      overtime: [
        { status: "approved", hours: 2, calculatedAmount: "400.00" },
        { status: "pending", hours: 3, calculatedAmount: "600.00" },
        { status: "approved", hours: 1, calculatedAmount: "200.00", manualAmount: "250.00" },
      ],
    });
    expect(result.overtimeHours).toBe(3);
    expect(result.grossPay).toBe("650.00");
  });

  it("以日薪除以 8 計算遲到與早退扣款", () => {
    const result = calculatePayroll({
      salary: dailySalary,
      attendance: [{ status: "late", workHours: 8, lateMinutes: 60, earlyLeaveMinutes: 30 }],
      overtime: [],
    });
    expect(result.deductionTotal).toBe("300.00");
    expect(result.netPay).toBe("1700.00");
  });

  it("正確累加借支與其他扣款", () => {
    const result = calculatePayroll({
      salary: { salaryType: "daily", dailyRate: "1600.00" },
      attendance: [{ status: "present", workHours: 8 }],
      overtime: [],
      advanceDeductions: [{ label: "借支扣回", amount: "1000.00" }],
      deductions: [{ label: "勞保自付", amount: "300.00" }],
    });
    expect(result.deductionTotal).toBe("1300.00");
    expect(result.netPay).toBe("400.00");
  });
});
