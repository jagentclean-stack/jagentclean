import * as db from "./db";

const SITE_NAME = "潔特務清潔｜J-Agent Cleaning";
const DEFAULT_DESCRIPTION = "潔特務清潔提供專業、可靠的清潔服務，歡迎透過官方 LINE 進行諮詢。";
const DEFAULT_ORIGIN = "https://jagentclean-lnbtuo7t.manus.space";

const PAGE_DETAILS: Record<string, { label: string; summary: string }> = {
  "/": { label: "首頁", summary: "潔特務清潔提供專業、高品質、高信任感與高效率的企業級清潔服務。" },
  "/services": { label: "服務項目", summary: "探索居家、商業空間、裝潢細清與專業保養等清潔服務。" },
  "/about": { label: "關於我們", summary: "認識潔特務清潔的服務理念與專業團隊。" },
  "/process": { label: "清潔流程", summary: "了解從需求評估到專業執行的清潔服務流程。" },
  "/testimonials": { label: "客戶評價", summary: "了解客戶對潔特務清潔服務的回饋。" },
  "/faq": { label: "常見問題", summary: "查詢潔特務清潔服務、預約與報價的常見問題。" },
  "/contact": { label: "聯絡我們", summary: "透過潔特務清潔官方 LINE 取得專業諮詢。" },
  "/cases": { label: "清潔案例", summary: "瀏覽潔特務清潔的已發布專業施工案例。" },
  "/blog": { label: "清潔知識中心", summary: "閱讀潔特務清潔分享的專業清潔知識與服務文章。" },
};

type SeoRecord = {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  canonical?: string | null;
  ogImage?: string | null;
  schema?: unknown;
  index?: boolean | null;
  noindex?: boolean | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function escapeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function parseSchema(value: unknown) {
  if (!value) return null;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return null; }
  }
  return typeof value === "object" ? value : null;
}

export function getPublicPathname(requestUrl: string) {
  return new URL(requestUrl, DEFAULT_ORIGIN).pathname.replace(/\/$/, "") || "/";
}

export function getSeoSlug(pathname: string) {
  return pathname === "/" ? "home" : pathname.replace(/^\//, "");
}

function isSafeCanonical(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  try {
    const candidate = new URL(value, fallback);
    return candidate.protocol === "https:" || candidate.protocol === "http:" ? candidate.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function buildSeoHead({ origin, pathname, seo, faqs = [], noindex = false, gaId, metaPixelId }: { origin: string; pathname: string; seo?: SeoRecord | null; faqs?: Array<{ question: string; answer: string | null }>; noindex?: boolean; gaId?: string; metaPixelId?: string }) {
  const page = PAGE_DETAILS[pathname] ?? { label: "頁面", summary: DEFAULT_DESCRIPTION };
  const canonical = isSafeCanonical(seo?.canonical, `${origin}${pathname}`);
  const title = seo?.title || `${page.label}｜${SITE_NAME}`;
  const description = seo?.description || page.summary;
  const ogImage = seo?.ogImage || `${origin}/manus-storage/brand-logo_0f07bc46.png`;
  const robots = noindex || seo?.noindex || seo?.index === false ? "noindex, nofollow" : "index, follow, max-image-preview:large";
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ "@type": "ListItem", position: 1, name: "首頁", item: origin }, ...(pathname === "/" ? [] : [{ "@type": "ListItem", position: 2, name: page.label, item: canonical }])],
  };
  const localBusiness = pathname === "/" ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${origin}/#business`,
    name: "潔特務清潔 J-Agent Cleaning",
    image: `${origin}/manus-storage/brand-logo_0f07bc46.png`,
    url: origin,
    telephone: "06-3584567",
    faxNumber: "06-3583232",
    email: "jagentclean@gmail.com",
    address: { "@type": "PostalAddress", streetAddress: "國安街45巷12號", addressLocality: "台南市", addressRegion: "安南區", postalCode: "709", addressCountry: "TW" },
    sameAs: ["https://www.facebook.com/Jagentclean", "https://lin.ee/ynvoHjh"],
  } : null;
  const completeFaqs = faqs.filter((faq): faq is { question: string; answer: string } => Boolean(faq.question && faq.answer));
  const faqSchema = pathname === "/faq" && completeFaqs.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: completeFaqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  } : null;
  const customSchema = parseSchema(seo?.schema);
  const safeGaId = gaId && /^G-[A-Z0-9]{4,32}$/i.test(gaId) ? gaId.toUpperCase() : null;
  const safeMetaPixelId = metaPixelId && /^\d{5,20}$/.test(metaPixelId) ? metaPixelId : null;

  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta name="keywords" content="${escapeHtml(seo?.keywords || "潔特務清潔, J-Agent Cleaning, 台南清潔")}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}">`,
    `<script id="cms-breadcrumb-schema" type="application/ld+json">${escapeJson(breadcrumb)}</script>`,
    localBusiness ? `<script id="cms-local-business-schema" type="application/ld+json">${escapeJson(localBusiness)}</script>` : "",
    faqSchema ? `<script id="cms-faq-schema" type="application/ld+json">${escapeJson(faqSchema)}</script>` : "",
    customSchema ? `<script id="cms-page-schema" type="application/ld+json">${escapeJson(customSchema)}</script>` : "",
    safeGaId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${safeGaId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${safeGaId}');</script>` : "",
    safeMetaPixelId ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${safeMetaPixelId}');fbq('track','PageView');</script>` : "",
  ].join("\n");
}

export function buildSeoFallbackContent(pathname: string, title: string, description: string) {
  const page = PAGE_DETAILS[pathname];
  if (!page) return "";
  return `<article data-ssr-seo-summary="true" class="sr-only"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></article>`;
}

export async function getSeoDocument(requestUrl: string, origin: string) {
  const pathname = getPublicPathname(requestUrl);
  const isPublicRoute = Object.prototype.hasOwnProperty.call(PAGE_DETAILS, pathname);
  const isAdminRoute = pathname === "/admin/login" || pathname === "/admin/debug" || pathname.startsWith("/cms");
  const seo = isPublicRoute ? await db.getSEOBySlug(getSeoSlug(pathname)) : null;
  const faqs = pathname === "/faq" ? await db.getVisibleFAQs() : [];
  const trackingSettings = isPublicRoute ? await db.getSettingsByKeys(["ga_id", "meta_pixel_id"]) : [];
  const gaId = trackingSettings.find((setting) => setting.key === "ga_id")?.value ?? undefined;
  const metaPixelId = trackingSettings.find((setting) => setting.key === "meta_pixel_id")?.value ?? undefined;
  const head = buildSeoHead({ origin, pathname, seo, faqs, noindex: isAdminRoute || !isPublicRoute, gaId, metaPixelId });
  const title = seo?.title || `${PAGE_DETAILS[pathname]?.label || "頁面"}｜${SITE_NAME}`;
  const description = seo?.description || PAGE_DETAILS[pathname]?.summary || DEFAULT_DESCRIPTION;

  return { pathname, isPublicRoute, isAdminRoute, head, content: isPublicRoute ? buildSeoFallbackContent(pathname, title, description) : "" };
}
