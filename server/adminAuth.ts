import { timingSafeEqual } from "node:crypto";

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
