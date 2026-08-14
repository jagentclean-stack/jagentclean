import type { Express, Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import {
  isAdminEmail,
  normalizeAdminEmail,
  verifyCmsUserPassword,
  verifyAdminPassword,
} from "./adminAuth";

export function registerAdminLoginRoutes(app: Express) {
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const normalizedEmail = normalizeAdminEmail(email);

    const existingUser = await db.getUserByEmail(normalizedEmail);
    const isHighestAdmin = isAdminEmail(normalizedEmail);
    const isAuthenticated = isHighestAdmin
      ? verifyAdminPassword(password)
      : await verifyCmsUserPassword(password, existingUser?.passwordHash);

    if (!isAuthenticated) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (existingUser && !existingUser.isActive) {
      res.status(403).json({ error: "This account has been deactivated" });
      return;
    }

    if (!existingUser && !isHighestAdmin) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    try {
      const openId = existingUser?.openId ?? `cms-admin:${normalizedEmail}`;

      await db.upsertUser({
        openId,
        email: normalizedEmail,
        name: existingUser?.name ?? normalizedEmail.split("@")[0],
        loginMethod: "cms_password",
        role: existingUser?.role ?? "super_admin",
        isActive: true,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        throw new Error("Unable to initialize administrator account");
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || normalizedEmail,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });
      res.json({ success: true, user: { email: user.email, name: user.name } });
    } catch (error) {
      console.error("[Admin Login] Authentication failed", error);
      res.status(500).json({ error: "Unable to sign in" });
    }
  });
}
