import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getSeoDocument } from "../seoDocument";

function requestOrigin(req: { protocol?: string; get?: (name: string) => string | undefined }) {
  const host = req.get?.("host");
  return host ? `${req.protocol || "https"}://${host}` : "https://jagentclean-lnbtuo7t.manus.space";
}

export function isHtmlNavigationRequest(req: { headers?: { accept?: string | undefined } }) {
  return (req.headers?.accept || "").includes("text/html");
}

async function renderSeoTemplate(template: string, requestUrl: string, origin: string) {
  const seo = await getSeoDocument(requestUrl, origin);
  return template.replace("<!--ssr-head-->", seo.head).replace("<!--ssr-content-->", seo.content);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use("*", async (req, res, next) => {
    if (!isHtmlNavigationRequest(req)) {
      next();
      return;
    }

    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const seo = await getSeoDocument(url, requestOrigin(req));
      const html = template.replace("<!--ssr-head-->", seo.head).replace("<!--ssr-content-->", seo.content);
      const page = await vite.transformIndexHtml(url, html);
      res.status(seo.isPublicRoute || seo.isAdminRoute ? 200 : 404).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Do not let Express serve index.html directly. Public navigations must fall
  // through to the SEO renderer below so canonical tags and JSON-LD are present
  // in the initial response, while static assets remain cacheable as usual.
  app.use(express.static(distPath, { index: false }));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      const seo = await getSeoDocument(req.originalUrl, requestOrigin(req));
      res.status(seo.isPublicRoute || seo.isAdminRoute ? 200 : 404).type("html").send(template.replace("<!--ssr-head-->", seo.head).replace("<!--ssr-content-->", seo.content));
    } catch (error) {
      next(error);
    }
  });
}
