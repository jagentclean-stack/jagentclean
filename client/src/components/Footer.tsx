import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Facebook, Mail, Phone, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

type QuickLink = { label?: string; href?: string };
type SocialLinks = { facebook?: string; line?: string };

function parseQuickLinks(value: unknown): QuickLink[] {
  return Array.isArray(value) ? value.filter((item): item is QuickLink => Boolean(item) && typeof item === "object" && typeof (item as QuickLink).label === "string" && typeof (item as QuickLink).href === "string") : [];
}

export default function Footer() {
  const { data: footer } = trpc.cms.publicContent.footer.useQuery();
  const quickLinks = parseQuickLinks(footer?.quickLinks);
  const social = (footer?.socialLinks && typeof footer.socialLinks === "object" && !Array.isArray(footer.socialLinks) ? footer.socialLinks : {}) as SocialLinks;

  return (
    <footer className="bg-primary py-12 text-primary-foreground">
      <div className="container grid grid-cols-1 gap-8 px-4 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4"><Link href="/" className="flex items-center space-x-2"><img src="/manus-storage/brand-logo_0f07bc46.png" alt="J-Agent Cleaning Logo" className="h-8" /><span className="text-xl font-bold">潔特務清潔</span></Link>{footer?.aboutText && <p className="text-sm leading-relaxed">{footer.aboutText}</p>}<div className="flex space-x-4">{social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-all duration-300 hover:scale-125 hover:text-secondary"><Facebook className="h-6 w-6" /></a>}{social.line && <a href={social.line} target="_blank" rel="noopener noreferrer" aria-label="LINE" className="transition-all duration-300 hover:scale-125 hover:text-secondary"><MessageCircle className="h-6 w-6" /></a>}</div></div>
        <div className="space-y-4"><h3 className="mb-2 text-lg font-semibold">快速連結</h3>{quickLinks.length ? <ul className="space-y-2">{quickLinks.map((item) => <li key={`${item.label}-${item.href}`}><Link href={item.href!} className="transition-colors duration-200 hover:text-secondary">{item.label}</Link></li>)}</ul> : <p className="text-sm text-primary-foreground/70">請於 CMS 頁尾管理設定快速連結。</p>}</div>
        <div className="space-y-4"><h3 className="mb-2 text-lg font-semibold">聯絡我們</h3><ul className="space-y-2">{footer?.phone && <li className="flex items-center space-x-2"><Phone className="h-5 w-5 text-secondary" /><a href={`tel:${footer.phone.replace(/[^+\d]/g, "")}`} className="transition-colors hover:text-secondary">{footer.phone}</a></li>}{footer?.email && <li className="flex items-center space-x-2"><Mail className="h-5 w-5 text-secondary" /><a href={`mailto:${footer.email}`} className="transition-colors hover:text-secondary">{footer.email}</a></li>}{footer?.address && <li className="text-sm leading-relaxed">地址：{footer.address}</li>}</ul></div>
        <div className="space-y-4"><h3 className="mb-2 text-lg font-semibold">立即預約</h3><p className="text-sm leading-relaxed">讓潔特務清潔為您的空間帶來煥然一新的體驗。</p><Link href="/contact"><Button variant="secondary" className="w-full soft-shadow transition-all duration-300 hover:scale-110 hover:shadow-lg">獲取免費報價</Button></Link></div>
      </div>
      <div className="container mt-8 border-t border-primary-foreground/20 px-4 pt-8 text-center text-sm lg:px-8">{footer?.copyrightText}</div>
    </footer>
  );
}
