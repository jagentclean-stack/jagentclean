import { Express, Request, Response } from "express";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";

export function registerTestLoginRoutes(app: Express) {
  app.post("/api/test-login", async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "email is required" });
      return;
    }

    try {
      console.log("[Test Login] Processing test login for:", email);

      // Check if user exists, if not create them
      let user = await db.getUserByEmail(email);
      
      if (!user) {
        console.log("[Test Login] User not found, creating new user");
        // Create a test user with a generated openId
        const testOpenId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.upsertUser({
          openId: testOpenId,
          email,
          name: email.split("@")[0],
          loginMethod: "test",
          lastSignedIn: new Date(),
        });
        user = await db.getUserByOpenId(testOpenId);
      } else {
        // Update last signed in
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });
      }

      if (!user) {
        res.status(500).json({ error: "Failed to create/retrieve user" });
        return;
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || email,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[Test Login] Login successful for:", email);
      res.json({ sessionToken, user });
    } catch (error) {
      console.error("[Test Login] Error:", error);
      res.status(500).json({ error: "Test login failed" });
    }
  });
}
