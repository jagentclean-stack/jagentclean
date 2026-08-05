/**
 * Database Seed Script (ESM 版本)
 * 初始化 RBAC 系統、角色、權限等
 * 
 * 使用方式：
 * node server/seed.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL 未設定");
  process.exit(1);
}

// 定義所有角色
const ROLES_DATA = [
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
const ROLE_PERMISSIONS = {
  super_admin: {
    default: true,
  },
  admin: {
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
    const connection = await mysql.createConnection(DATABASE_URL);
    
    // 建立表結構（如果不存在）
    console.log("📝 建立資料表...");
    
    // roles 表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(64) NOT NULL UNIQUE,
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("  ✅ roles 表已建立");

    // permissions 表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roleId INT NOT NULL,
        resource VARCHAR(64) NOT NULL,
        canView BOOLEAN DEFAULT FALSE,
        canCreate BOOLEAN DEFAULT FALSE,
        canEdit BOOLEAN DEFAULT FALSE,
        canDelete BOOLEAN DEFAULT FALSE,
        canPublish BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE
      )
    `);
    console.log("  ✅ permissions 表已建立");

    const db = drizzle(connection);

    // ========== 第一步：建立角色 ==========
    console.log("\n📝 第一步：建立角色...");
    for (const roleData of ROLES_DATA) {
      const [existingRole] = await connection.query(
        "SELECT id FROM roles WHERE name = ?",
        [roleData.name]
      );

      if (existingRole.length === 0) {
        await connection.query(
          "INSERT INTO roles (name, description) VALUES (?, ?)",
          [roleData.name, roleData.description]
        );
        console.log(`  ✅ 角色已建立: ${roleData.name}`);
      } else {
        console.log(`  ⏭️  角色已存在: ${roleData.name}`);
      }
    }

    // ========== 第二步：建立權限 ==========
    console.log("\n📝 第二步：建立權限...");
    for (const roleData of ROLES_DATA) {
      const [roleRecord] = await connection.query(
        "SELECT id FROM roles WHERE name = ?",
        [roleData.name]
      );

      if (roleRecord.length === 0) continue;

      const roleId = roleRecord[0].id;
      const rolePerms = ROLE_PERMISSIONS[roleData.name];

      for (const resource of RESOURCES) {
        const [existingPerm] = await connection.query(
          "SELECT id FROM permissions WHERE roleId = ? AND resource = ?",
          [roleId, resource]
        );

        if (existingPerm.length === 0) {
          const hasPermission =
            rolePerms.default === true || rolePerms[resource] === true;

          await connection.query(
            `INSERT INTO permissions 
             (roleId, resource, canView, canCreate, canEdit, canDelete, canPublish) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [roleId, resource, hasPermission, hasPermission, hasPermission, hasPermission, hasPermission]
          );

          console.log(
            `  ✅ 權限已建立: ${roleData.name} -> ${resource} (${hasPermission ? "允許" : "禁止"})`
          );
        }
      }
    }

    console.log("\n✅ 資料庫初始化完成！\n");
    console.log("📊 初始化摘要：");
    console.log(`  - 角色數量: ${ROLES_DATA.length}`);
    console.log(`  - 資源數量: ${RESOURCES.length}`);
    console.log(`  - 權限配置: ${ROLES_DATA.length} 個角色 × ${RESOURCES.length} 個資源\n`);

    await connection.end();
  } catch (error) {
    console.error("❌ Seed 失敗:", error);
    process.exit(1);
  }
}

seed();
