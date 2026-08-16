import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const serverSource = readFileSync(new URL("./_core/index.ts", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");

describe("runtime hardening", () => {
  it("uses shallow query and URL-encoded body parsing", () => {
    expect(serverSource).toContain('app.set("query parser", "simple")');
    expect(serverSource).toContain("express.urlencoded({ limit: \"2mb\", extended: false })");
  });

  it("does not load CMS and HR pages with the public homepage module", () => {
    expect(appSource).toContain('import { lazy, Suspense } from "react"');
    expect(appSource).toContain('import Home from "./pages/Home"');
    expect(appSource).toContain('const CMSDashboard = lazy(() => import("./pages/CMSDashboard"))');
    expect(appSource).toContain('const HRDashboard = lazy(() => import("./pages/hr/HRDashboard"))');
  });
});
