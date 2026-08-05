/**
 * Database Seed Script
 * 初始化 RBAC 系統、角色、權限等
 * 
 * 使用方式：
 * node seed.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import { roles, permissions, users } from "../drizzle/schema";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL 未設定");
  process.exit(1);
}

// 定義所有角色
const ROLES_DATA: Array<{ name: string; description: string }> = [
  { name: "super_admin", description: "超級管理員 - 擁有所有權限" },
  { name: "admin", description: "管理員 - 管理大部分功能" },
  { name: "editor", description: "編輯 - 可以編輯內容" },
  { name: "marketing", description: "行銷 - 管理行銷相關內容" },
  { name: "customer_service", description: "客服 - 處理客戶相關事務" },
];

// 定義所有資源
const RESOURCES = [
  "pages",
  "sections",
  "menus",
  "services",
  "cases",
  "blogs",
  "categories",
  "faqs",
  "reviews",
  "banners",
  "media",
  "contacts",
  "bookings",
  "settings",
  "seo",
  "users",
  "roles",
  "permissions",
];

// 定義每個角色的權限
const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  super_admin: {
    // Super Admin 擁有所有權限
    default: true,
  },
  admin: {
    // Admin 擁有大部分權限，除了 users/roles/permissions
    pages: true,
    sections: true,
    menus: true,
    services: true,
    cases: true,
    blogs: true,
    categories: true,
    faqs: true,
    reviews: true,
    banners: true,
    media: true,
    contacts: true,
    bookings: true,
    settings: true,
    seo: true,
    users: false,
    roles: false,
    permissions: false,
  },
  editor: {
    pages: true,
    sections: true,
    menus: false,
    services: false,
    cases: false,
    blogs: true,
    categories: true,
    faqs: true,
    reviews: false,
    banners: false,
    media: true,
    contacts: false,
    bookings: false,
    settings: false,
    seo: true,
    users: false,
    roles: false,
    permissions: false,
  },
  marketing: {
    pages: false,
    sections: false,
    menus: false,
    services: true,
    cases: true,
    blogs: true,
    categories: true,
    faqs: false,
    reviews: true,
    banners: true,
    media: true,
    contacts: false,
    bookings: false,
    settings: false,
    seo: true,
    users: false,
    roles: false,
    permissions: false,
  },
  customer_service: {
    pages: false,
    sections: false,
    menus: false,
    services: true,
    cases: false,
    blogs: false,
    categories: false,
    faqs: true,
    reviews: false,
    banners: false,
    media: false,
    contacts: true,
    bookings: true,
    settings: false,
    seo: false,
    users: false,
    roles: false,
    permissions: false,
  },
};

async function seed() {
  try {
    console.log("🌱 開始初始化資料庫...\n");

    // 建立連接
    const connection = await mysql.createConnection(DATABASE_URL as any);
    const db = drizzle(connection);

    // ========== 第一步：建立角色 ==========
    console.log("📝 第一步：建立角色...");
    for (const roleData of ROLES_DATA) {
      const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleData.name as any))
        .limit(1);

      if (existingRole.length === 0) {
        await db.insert(roles).values(roleData);
        console.log(`  ✅ 角色已建立: ${roleData.name}`);
      } else {
        console.log(`  ⏭️  角色已存在: ${roleData.name}`);
      }
    }

    // ========== 第二步：建立權限 ==========
    console.log("\n📝 第二步：建立權限...");
    for (const roleData of ROLES_DATA) {
      const roleRecord = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleData.name))
        .limit(1);

      if (roleRecord.length === 0) continue;

      const roleId = roleRecord[0].id;
      const rolePerms = ROLE_PERMISSIONS[roleData.name];

      for (const resource of RESOURCES) {
        // 檢查權限是否已存在
        const existingPerm = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.roleId, roleId),
            eq(permissions.resource, resource)
          )
        )
        .limit(1);

        if (existingPerm.length === 0) {
          // 判斷該資源是否有權限
          const hasPermission =
            rolePerms.default === true || rolePerms[resource] === true;

          await db.insert(permissions).values({
            roleId,
            resource,
            canView: hasPermission,
            canCreate: hasPermission,
            canEdit: hasPermission,
            canDelete: hasPermission,
            canPublish: hasPermission,
          });

          console.log(
            `  ✅ 權限已建立: ${roleData.name} -> ${resource} (${hasPermission ? "允許" : "禁止"})`
          );
        }
      }
    }

    // ========== 第三步：建立超級管理員帳號 ==========
    console.log("\n📝 第三步：檢查超級管理員帳號...");
    const adminEmails = ["jagentclean@gmail.com", "emilyku0jj@gmail.com"];

    for (const email of adminEmails) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length === 0) {
        // 建立虛擬 openId（用於 seed）
        const openId = `seed_${email.replace("@", "_").replace(".", "_")}`;

        await db.insert(users).values({
          openId,
          email,
          name: email.split("@")[0],
          role: "admin",
          loginMethod: "seed",
        });

        console.log(`  ✅ 超級管理員帳號已建立: ${email}`);
      } else {
        console.log(`  ⏭️  帳號已存在: ${email}`);
      }
    }

    console.log("\n✅ 資料庫初始化完成！\n");
    console.log("📊 初始化摘要：");
    console.log(`  - 角色數量: ${ROLES_DATA.length}`);
    console.log(`  - 資源數量: ${RESOURCES.length}`);
    console.log(`  - 權限配置: ${ROLES_DATA.length} 個角色 × ${RESOURCES.length} 個資源`);
    console.log(`  - 超級管理員帳號: ${adminEmails.length} 個\n`);

    await connection.end();
  } catch (error) {
    console.error("❌ Seed 失敗:", error);
    process.exit(1);
  }
}

seed();
