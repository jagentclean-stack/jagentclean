import React, { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { buildBlogArticleBreadcrumbSchema, buildBlogArticleSchema, buildBreadcrumbSchema, buildFaqSchema, PAGE_LABELS, safeCanonical, seoSlugFromPath } from "@/lib/seo";

type SeoRecord = {
  title: string;
  description: string | null;
  keywords: string | null;
  canonical: string | null;
  ogImage: string | null;
  schema: unknown;
  index: boolean | null;
  noindex: boolean | null;
};

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
}

function setJsonLd(id: string, data: unknown) {
  let script = document.head.querySelector<HTMLScriptElement>(`script#${id}`);
  if (!data) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
}

function parseSchema(value: unknown) {
  if (!value) return null;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return null; }
  }
  return typeof value === "object" ? value : null;
}

export default function SEOHead({ pathname }: { pathname: string }) {
  const slug = seoSlugFromPath(pathname);
  const blogSlug = pathname.match(/^\/blog\/([^/]+)\/?$/)?.[1] || "";
  const { data: seo } = trpc.cms.publicContent.seo.useQuery({ slug }) as { data?: SeoRecord | null };
  const { data: blog } = trpc.cms.publicContent.blogBySlug.useQuery({ slug: blogSlug }, { enabled: Boolean(blogSlug), retry: false });
  const { data: faqs = [] } = trpc.cms.publicContent.faqs.useQuery(undefined, { enabled: pathname === "/faq" });
  const { data: siteSettings } = trpc.cms.publicContent.siteSettings.useQuery();

  useEffect(() => {
    const origin = window.location.origin;
    const siteName = siteSettings?.siteName?.trim() || "";
    const fallbackTitle = siteName ? `${PAGE_LABELS[pathname] || "頁面"}｜${siteName}` : PAGE_LABELS[pathname] || "頁面";
    const articleTitle = blog?.seoTitle || blog?.title;
    const title = articleTitle ? `${articleTitle}｜${siteName || "潔特務清潔"}` : seo?.title || fallbackTitle;
    const description = blog?.seoDescription || blog?.excerpt || seo?.description || siteSettings?.siteDescription || "";
    const canonical = safeCanonical(seo?.canonical, `${origin}${pathname}`);
    const ogImagePath = blog?.featuredImage || seo?.ogImage || siteSettings?.logoUrl || "";
    const ogImage = ogImagePath ? (/^https?:\/\//i.test(ogImagePath) ? ogImagePath : `${origin}${ogImagePath.startsWith("/") ? "" : "/"}${ogImagePath}`) : "";
    const robots = seo?.noindex || seo?.index === false ? "noindex, nofollow" : "index, follow, max-image-preview:large";

    document.title = title;
    setMeta('meta[name="description"]', { name: "description", content: description });
    setMeta('meta[name="keywords"]', { name: "keywords", content: blog?.seoKeywords || seo?.keywords || "" });
    setMeta('meta[name="robots"]', { name: "robots", content: robots });
    setMeta('meta[property="og:title"]', { property: "og:title", content: title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    setMeta('meta[property="og:image"]', { property: "og:image", content: ogImage });
    setMeta('meta[property="og:type"]', { property: "og:type", content: blog ? "article" : "website" });
    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    setMeta('meta[name="twitter:url"]', { name: "twitter:url", content: canonical });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: ogImage });

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    setJsonLd("cms-breadcrumb-schema", blog ? buildBlogArticleBreadcrumbSchema(origin, pathname, blog.title) : buildBreadcrumbSchema(origin, pathname));
    setJsonLd("cms-faq-schema", pathname === "/faq" ? buildFaqSchema(faqs) : null);
    setJsonLd("cms-page-schema", parseSchema(seo?.schema));
    setJsonLd("cms-article-schema", blog ? buildBlogArticleSchema({ origin, pathname, article: blog, description, image: ogImage }) : null);
  }, [blog, faqs, pathname, seo, siteSettings]);

  return null;
}
