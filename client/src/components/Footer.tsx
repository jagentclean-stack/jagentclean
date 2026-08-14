import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Facebook, Mail, Phone, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

type QuickLink = { label?: string; href?: string };

function parseQuickLinks(value: unknown): QuickLink[] {
  return Array.isArray(value) ? value.filter((item): item is QuickLink => Boolean(item) && typeof item === "object" && typeof (item as QuickLink).label === "string" && typeof (item as QuickLink).href === "string") : [];
}

export default function Footer() {
  const { data: footer } = trpc.cms.publicContent.footer.useQuery();
  const { data: siteSettings } = trpc.cms.publicContent.siteSettings.useQuery();
  const quickLinks = parseQuickLinks(footer?.quickLinks);
  const siteName = siteSettings?.siteName?.trim() || "";
  const logoUrl = siteSettings?.logoUrl?.trim() || "";
  const phone = siteSettings?.companyPhone?.trim() || "";
  const email = siteSettings?.companyEmail?.trim() || "";
  const address = siteSettings?.companyAddress?.trim() || "";
  const facebookUrl = siteSettings?.facebookUrl?.trim() || "";
  const lineUrl = siteSettings?.lineUrl?.trim() || "";
  const copyrightText = siteSettings?.copyrightText?.trim() || footer?.copyrightText;

  return (
    <footer className="bg-primary py-12 text-primary-foreground">
      <div className="container grid grid-cols-1 gap-8 px-4 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4"><Link href="/" className="flex items-center space-x-2">{logoUrl && <img src={logoUrl} alt={siteName ? `${siteName} Logo` : "網站 Logo"} className="h-8" />}{siteName && <span className="text-xl font-bold">{siteName}</span>}</Link>{footer?.aboutText && <p className="text-sm leading-relaxed">{footer.aboutText}</p>}<div className="flex space-x-4">{facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-all duration-300 hover:scale-125 hover:text-secondary"><Facebook className="h-6 w-6" /></a>}{lineUrl && <a href={lineUrl} target="_blank" rel="noopener noreferrer" aria-label="LINE" className="transition-all duration-300 hover:scale-125 hover:text-secondary"><MessageCircle className="h-6 w-6" /></a>}</div></div>
        <div className="space-y-4"><h3 className="mb-2 text-lg font-semibold">快速連結</h3>{quickLinks.length ? <ul className="space-y-2">{quickLinks.map((item) => <li key={`${item.label}-${item.href}`}><Link href={item.href!} className="transition-colors duration-200 hover:text-secondary">{item.label}</Link></li>)}</ul> : <p className="text-sm text-primary-foreground/70">請於 CMS 頁尾管理設定快速連結。</p>}</div>
        <div className="space-y-4"><h3 className="mb-2 text-lg font-semibold">聯絡我們</h3><ul className="space-y-2">{phone && <li className="flex items-center space-x-2"><Phone className="h-5 w-5 text-secondary" /><a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="transition-colors hover:text-secondary">{phone}</a></li>}{email && <li className="flex items-center space-x-2"><Mail className="h-5 w-5 text-secondary" /><a href={`mailto:${email}`} className="transition-colors hover:text-secondary">{email}</a></li>}{address && <li className="text-sm leading-relaxed">地址：{address}</li>}</ul></div>
        <div className="space-y-4"><h3 className="mb-2 text-lg font-semibold">立即預約</h3><p className="text-sm leading-relaxed">{siteName ? `讓 ${siteName} 為您的空間帶來煥然一新的體驗。` : "為您的空間帶來煥然一新的體驗。"}</p><Link href="/contact"><Button variant="secondary" className="w-full soft-shadow transition-all duration-300 hover:scale-110 hover:shadow-lg">獲取免費報價</Button></Link></div>
      </div>
      <div className="container mt-8 border-t border-primary-foreground/20 px-4 pt-8 text-center text-sm lg:px-8">{copyrightText}</div>
    </footer>
  );
}
