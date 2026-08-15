import { describe, expect, it } from "vitest";
import type { User } from "../drizzle/schema";
import { canManageOperations, canManagePayroll, maskSensitiveValue } from "./payrollSecurity";

function user(role: User["role"], email = "staff@example.com") {
  return { id: 1, role, email } as User;
}

describe("人事薪資權限隔離", () => {
  it("僅最高權限、管理員與會計可管理薪資", () => {
    expect(canManagePayroll(user("super_admin"))).toBe(true);
    expect(canManagePayroll(user("admin"))).toBe(true);
    expect(canManagePayroll(user("accountant"))).toBe(true);
    expect(canManagePayroll(user("supervisor"))).toBe(false);
    expect(canManagePayroll(user("employee"))).toBe(false);
  });

  it("主管可管理排班與出勤，但一般員工不可", () => {
    expect(canManageOperations(user("supervisor"))).toBe(true);
    expect(canManageOperations(user("employee"))).toBe(false);
  });

  it("指定最高權限 Email 維持薪資管理能力", () => {
    expect(canManagePayroll(user("employee", "jagentclean@gmail.com"))).toBe(true);
    expect(canManagePayroll(user("employee", "emilyku0jj@gmail.com"))).toBe(true);
  });

  it("敏感帳號僅呈現末四碼", () => {
    expect(maskSensitiveValue("1234 5678 9012")).toBe("••••9012");
    expect(maskSensitiveValue(null)).toBeNull();
  });
});
