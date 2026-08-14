export const SITE_NAME = "潔特務清潔｜J-Agent Cleaning";

export const PAGE_LABELS: Record<string, string> = {
  "/": "首頁",
  "/services": "服務項目",
  "/cases": "清潔案例",
  "/blog": "清潔知識中心",
  "/about": "關於我們",
  "/process": "服務流程",
  "/testimonials": "客戶評價",
  "/faq": "常見問題",
  "/contact": "聯絡我們",
};

export function seoSlugFromPath(pathname: string) {
  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  return normalized || "home";
}

export function safeCanonical(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function buildBreadcrumbSchema(origin: string, pathname: string) {
  const currentLabel = PAGE_LABELS[pathname];
  if (!currentLabel || pathname === "/") return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: `${origin}/` },
      { "@type": "ListItem", position: 2, name: currentLabel, item: `${origin}${pathname}` },
    ],
  };
}

export function buildFaqSchema(items: Array<{ question: string; answer: string | null }>) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer || "" },
    })),
  };
}
