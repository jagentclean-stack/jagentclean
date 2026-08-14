import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

export const ADMIN_EMAILS = [
  "jagentclean@gmail.com",
  "emilyku0jj@gmail.com",
] as const;

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(
    normalizeAdminEmail(email) as (typeof ADMIN_EMAILS)[number]
  );
}

export function verifyAdminPassword(candidate: string): boolean {
  const configuredPassword = process.env.CMS_ADMIN_PASSWORD;
  if (!configuredPassword || !candidate) return false;

  const expected = Buffer.from(configuredPassword, "utf8");
  const provided = Buffer.from(candidate, "utf8");
  if (expected.length !== provided.length) return false;

  return timingSafeEqual(expected, provided);
}

export async function hashCmsUserPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyCmsUserPassword(candidate: string, storedHash: string | null | undefined): Promise<boolean> {
  const [algorithm, salt, storedKey] = storedHash?.split("$") ?? [];
  if (algorithm !== "scrypt" || !salt || !storedKey) return false;
  const expected = Buffer.from(storedKey, "hex");
  const provided = (await scrypt(candidate, salt, 64)) as Buffer;
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}
const scrypt = promisify(scryptCallback);
