import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getAllCmsRolePermissionOverrides: vi.fn(async () => []),
  getCmsRolePermissionOverrides: vi.fn(async () => [
    { permission: "SERVICES_DELETE", isAllowed: true, updatedAt: new Date("2026-08-15T00:00:00.000Z") },
  ]),
  setCmsRolePermissionOverride: vi.fn(async () => undefined),
  getCmsPermissionAudit: vi.fn(async () => []),
}));

vi.mock("./db", () => dbMock);

import { cmsRouter } from "./cms";

const createCaller = (role: string, email: string) => cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 77, openId: "role-permissions-tester", name: "Tester", email, role, isActive: true } as never,
});

describe("CMS role permission APIs", () => {
  it("只允許指定最高權限 Email 檢視預設值與資料庫覆寫", async () => {
    const permissions = await createCaller("user", "jagentclean@gmail.com").rolePermissions.list({ role: "editor" });
    expect(permissions.find((item) => item.permission === "SERVICES_DELETE")).toMatchObject({
      defaultAllowed: false,
      isAllowed: true,
      isOverridden: true,
    });
    expect(dbMock.getCmsRolePermissionOverrides).toHaveBeenCalledWith("editor");
  });

  it("記錄最高權限帳號的單項覆寫，並拒絕一般 CMS 角色讀寫或讀取稽核", async () => {
    await expect(createCaller("editor", "editor@example.com").rolePermissions.list({ role: "editor" }))
      .rejects.toThrow("只有最高權限管理員可檢視角色功能權限。");
    await expect(createCaller("editor", "editor@example.com").rolePermissions.update({
      role: "editor", permission: "SERVICES_DELETE", isAllowed: true,
    })).rejects.toThrow("只有最高權限管理員可調整角色功能權限。");
    await expect(createCaller("editor", "editor@example.com").rolePermissions.audit())
      .rejects.toThrow("只有最高權限管理員可檢視權限異動紀錄。");

    await expect(createCaller("admin", "emilyku0jj@gmail.com").rolePermissions.update({
      role: "editor", permission: "SERVICES_DELETE", isAllowed: true,
    })).resolves.toEqual({ success: true });
    expect(dbMock.setCmsRolePermissionOverride).toHaveBeenCalledWith({
      role: "editor", permission: "SERVICES_DELETE", isAllowed: true, updatedBy: 77,
    });
  });
});
