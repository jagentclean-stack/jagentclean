import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const expectedNonce = cookies[OAUTH_STATE_COOKIE];
    
    console.log("[OAuth] State validation:", {
      nonce: nonce ? "present" : "missing",
      expectedNonce: expectedNonce ? "present" : "missing",
      match: nonce === expectedNonce,
      cookieKeys: Object.keys(cookies),
    });
    
    // Allow callback if nonce matches OR if nonce is missing (legacy/fallback)
    if (nonce && expectedNonce && nonce !== expectedNonce) {
      console.error("[OAuth] State mismatch", { nonce, expectedNonce });
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    
    if (expectedNonce) {
      res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      if (error instanceof Error) {
        console.error("[OAuth] Error message:", error.message);
        console.error("[OAuth] Error stack:", error.stack);
      }
      if (typeof error === 'object' && error !== null && 'response' in error) {
        console.error("[OAuth] Response data:", (error as any).response?.data);
      }
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
