import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyCmsRolePermissionOverrides, canAccessCmsPermission, CMS_PERMISSIONS, normalizeCmsRole, resolveCmsPermission } from "./cms";

describe("CMS RBAC permission matrix", () => {
  it("保留歷史 manager 角色的 admin 別名", () => {
    expect(normalizeCmsRole("manager")).toBe("admin");
    expect(canAccessCmsPermission("manager", "manager@example.com", "SETTINGS_MANAGE")).toBe(true);
  });

  it("將所有既有路由使用的角色組合解析至中央權限矩陣", () => {
    expect(resolveCmsPermission(["admin", "manager"])).toBe("DASHBOARD_READ");
    expect(resolveCmsPermission(["admin", "editor"])).toBe("PAGES_READ");
    expect(resolveCmsPermission(["admin"])).toBe("DASHBOARD_READ");
    expect(resolveCmsPermission(["admin", "manager", "customer_service"])).toBe("BOOKINGS_MANAGE");
    expect(resolveCmsPermission(["admin", "customer_service"])).toBe("BOOKINGS_MANAGE");
    expect(resolveCmsPermission(["super_admin", "admin", "editor", "marketing"])).toBe("BLOGS_MANAGE");
    expect(resolveCmsPermission(["admin", "marketing"])).toBe("REVIEWS_MANAGE");
  });

  it("允許 editor 管理內容，但拒絕刪除內容、網站設定與員工帳號", () => {
    expect(canAccessCmsPermission("editor", "editor@example.com", "SERVICES_UPDATE")).toBe(true);
    expect(canAccessCmsPermission("editor", "editor@example.com", "CASES_MANAGE")).toBe(true);
    expect(canAccessCmsPermission("editor", "editor@example.com", "SEO_MANAGE")).toBe(true);
    expect(canAccessCmsPermission("editor", "editor@example.com", "SERVICES_DELETE")).toBe(false);
    expect(canAccessCmsPermission("editor", "editor@example.com", "SETTINGS_MANAGE")).toBe(false);
    expect(canAccessCmsPermission("editor", "editor@example.com", "USERS_MANAGE")).toBe(false);
  });

  it("將行銷權限限制於文章、分類與評價內容", () => {
    expect(canAccessCmsPermission("marketing", "marketing@example.com", "BLOGS_MANAGE")).toBe(true);
    expect(canAccessCmsPermission("marketing", "marketing@example.com", "CATEGORIES_MANAGE")).toBe(true);
    expect(canAccessCmsPermission("marketing", "marketing@example.com", "REVIEWS_MANAGE")).toBe(true);
    expect(canAccessCmsPermission("marketing", "marketing@example.com", "SERVICES_UPDATE")).toBe(false);
    expect(canAccessCmsPermission("marketing", "marketing@example.com", "USERS_MANAGE")).toBe(false);
  });

  it("將客服權限限制於預約與聯繫資料流程", () => {
    expect(canAccessCmsPermission("customer_service", "service@example.com", "BOOKINGS_MANAGE")).toBe(true);
    expect(canAccessCmsPermission("customer_service", "service@example.com", "CONTACTS_READ")).toBe(true);
    expect(canAccessCmsPermission("customer_service", "service@example.com", "CONTACTS_UPDATE")).toBe(true);
    expect(canAccessCmsPermission("customer_service", "service@example.com", "BLOGS_MANAGE")).toBe(false);
    expect(canAccessCmsPermission("customer_service", "service@example.com", "SETTINGS_MANAGE")).toBe(false);
  });

  it("讓 super_admin 與兩個最高權限 Email 繼承每一項 CMS 權限", () => {
    for (const permission of Object.keys(CMS_PERMISSIONS) as Array<keyof typeof CMS_PERMISSIONS>) {
      expect(canAccessCmsPermission("super_admin", "owner@example.com", permission)).toBe(true);
      expect(canAccessCmsPermission("user", "jagentclean@gmail.com", permission)).toBe(true);
      expect(canAccessCmsPermission("user", "emilyku0jj@gmail.com", permission)).toBe(true);
    }
  });

  it("不會將未知角色或一般使用者授權為 CMS 管理者", () => {
    expect(canAccessCmsPermission("user", "user@example.com", "DASHBOARD_READ")).toBe(false);
    expect(canAccessCmsPermission("unknown_role", "unknown@example.com", "BLOGS_MANAGE")).toBe(false);
  });

  it("優先套用資料庫角色權限覆寫，並在未設定項目安全回退中央預設值", () => {
    applyCmsRolePermissionOverrides([
      { role: "editor", permission: "SERVICES_DELETE", isAllowed: true },
      { role: "marketing", permission: "BLOGS_MANAGE", isAllowed: false },
    ]);
    expect(canAccessCmsPermission("editor", "editor@example.com", "SERVICES_DELETE")).toBe(true);
    expect(canAccessCmsPermission("marketing", "marketing@example.com", "BLOGS_MANAGE")).toBe(false);
    expect(canAccessCmsPermission("editor", "editor@example.com", "SERVICES_UPDATE")).toBe(true);
    applyCmsRolePermissionOverrides([]);
    expect(canAccessCmsPermission("editor", "editor@example.com", "SERVICES_DELETE")).toBe(false);
  });

  it("不得透過自訂覆寫降低 super_admin 或指定最高權限 Email 的功能權限", () => {
    applyCmsRolePermissionOverrides([
      { role: "super_admin", permission: "USERS_MANAGE", isAllowed: false },
      { role: "user", permission: "USERS_MANAGE", isAllowed: false },
    ]);
    expect(canAccessCmsPermission("super_admin", "owner@example.com", "USERS_MANAGE")).toBe(true);
    expect(canAccessCmsPermission("user", "jagentclean@gmail.com", "USERS_MANAGE")).toBe(true);
    applyCmsRolePermissionOverrides([]);
  });

  it("所有 CMS 路由均直接使用具名權限矩陣，而非分散角色白名單", () => {
    const cmsSource = readFileSync(resolve(import.meta.dirname, "cms.ts"), "utf8");
    expect(cmsSource).not.toMatch(/checkRole\(ctx\.user/);
    expect(cmsSource.match(/canAccessCmsPermission\(ctx\.user/g)?.length).toBeGreaterThan(60);
  });
});
