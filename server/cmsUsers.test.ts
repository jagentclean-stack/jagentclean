import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getAllUsers: vi.fn(async () => [
    { id: 1, name: "Owner", email: "jagentclean@gmail.com", role: "super_admin", isActive: true, openId: "owner", lastSignedIn: null },
    { id: 2, name: "Editor", email: "editor@example.com", role: "editor", isActive: true, openId: "editor", lastSignedIn: null },
  ]),
  getUserByEmail: vi.fn(async (email: string) => email === "editor@example.com" ? { id: 2, name: "Editor", email, role: "editor", isActive: true, openId: "editor" } : undefined),
  createCmsUser: vi.fn(async () => ({ success: true })),
  updateUserRoleAndStatus: vi.fn(async () => ({ success: true })),
  updateCmsUserProfile: vi.fn(async () => ({ success: true })),
}));

vi.mock("./db", () => dbMock);
vi.mock("./adminAuth", () => ({ hashCmsUserPassword: vi.fn(async () => "scrypt$test$hash") }));

import { cmsRouter } from "./cms";

const createCaller = (role: string, email: string) => cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 99, openId: "caller", name: "Caller", email, role, isActive: true } as never,
});

describe("CMS users router", () => {
  it("允許管理員建立非最高權限員工帳號", async () => {
    const caller = createCaller("admin", "manager@example.com");
    await expect(caller.users.create({ name: "客服人員", email: "service@example.com", role: "customer_service", initialPassword: "long-enough-password" })).resolves.toEqual({ success: true });
    expect(dbMock.createCmsUser).toHaveBeenCalledWith(expect.objectContaining({
      email: "service@example.com",
      role: "customer_service",
      isActive: true,
      passwordHash: "scrypt$test$hash",
    }));
  });

  it("拒絕一般管理員建立或調整最高權限帳號", async () => {
    const caller = createCaller("admin", "manager@example.com");
    await expect(caller.users.create({ name: "非法", email: "invalid@example.com", role: "super_admin", initialPassword: "long-enough-password" })).rejects.toThrow("只有最高權限管理員");
    await expect(caller.users.updateRole({ id: 1, role: "editor" })).rejects.toThrow("只有最高權限管理員");
  });

  it("允許管理員編輯一般員工資料並在重設密碼時寫入新的雜湊", async () => {
    await expect(createCaller("admin", "manager@example.com").users.updateProfile({
      id: 2,
      name: "更新後編輯",
      email: "updated@example.com",
      newPassword: "another-long-password",
    })).resolves.toEqual({ success: true });
    expect(dbMock.updateCmsUserProfile).toHaveBeenCalledWith(2, expect.objectContaining({
      name: "更新後編輯",
      email: "updated@example.com",
      passwordHash: "scrypt$test$hash",
    }));
  });

  it("拒絕一般管理員編輯最高權限帳號", async () => {
    await expect(createCaller("admin", "manager@example.com").users.updateProfile({
      id: 1,
      name: "Owner",
      email: "jagentclean@gmail.com",
    })).rejects.toThrow("只有最高權限管理員");
  });

  it("拒絕非管理角色讀取員工清單，並保護最高權限帳號不被停用", async () => {
    await expect(createCaller("editor", "editor@example.com").users.list()).rejects.toThrow("Unauthorized");
    await expect(createCaller("super_admin", "jagentclean@gmail.com").users.setActive({ id: 1, isActive: false })).rejects.toThrow("最高權限管理員帳號不可停用");
  });
});
