import { createCipheriv, createHash, randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import type { User } from "../drizzle/schema";
import { ENV } from "./_core/env";

export const PAYROLL_ADMIN_EMAILS = new Set(["jagentclean@gmail.com", "emilyku0jj@gmail.com"]);
export const PAYROLL_MANAGEMENT_ROLES = new Set<User["role"]>(["super_admin", "admin", "accountant"]);
export const PAYROLL_SUPERVISOR_ROLES = new Set<User["role"]>(["supervisor"]);

export function canManagePayroll(user: User) {
  return PAYROLL_MANAGEMENT_ROLES.has(user.role) || Boolean(user.email && PAYROLL_ADMIN_EMAILS.has(user.email.toLowerCase()));
}

export function canManageOperations(user: User) {
  return canManagePayroll(user) || PAYROLL_SUPERVISOR_ROLES.has(user.role);
}

export function assertPayrollManager(user: User) {
  if (!canManagePayroll(user)) throw new TRPCError({ code: "FORBIDDEN", message: "僅限管理員或會計操作薪資資料" });
}

export function assertOperationsManager(user: User) {
  if (!canManageOperations(user)) throw new TRPCError({ code: "FORBIDDEN", message: "僅限管理員、會計或主管操作出勤資料" });
}

/** 敏感欄位採 AES-256-GCM 加密，資料庫及 API 均不回傳原始身分證／銀行帳號。 */
export function encryptPayrollSensitiveValue(value: string | undefined) {
  if (!value) return undefined;
  if (!ENV.cookieSecret) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "未設定伺服器加密金鑰，無法儲存敏感資料" });
  const key = createHash("sha256").update(ENV.cookieSecret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function maskSensitiveValue(value: string | null | undefined, trailingCharacters = 4) {
  if (!value) return null;
  const normalized = String(value).replace(/\s/g, "");
  return normalized.length <= trailingCharacters ? "••••" : `••••${normalized.slice(-trailingCharacters)}`;
}
