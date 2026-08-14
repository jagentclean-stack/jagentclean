import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Calendar, ChevronDown } from "lucide-react";
import ThemeToggleButton from "./ThemeToggleButton";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getNewWindowLinkProps } from "@/lib/navigation";

type NavigationItem = {
  id: number;
  label: string;
  url: string | null;
  openNewWindow: boolean | null;
  children: NavigationItem[];
};

function isExternalUrl(url: string) {
  return /^(https?:|mailto:|tel:)/i.test(url);
}

export function NavigationLink({ item, onNavigate, className }: { item: NavigationItem; onNavigate?: () => void; className: string }) {
  const url = item.url || "/";
  if (item.openNewWindow || isExternalUrl(url)) {
    return <a href={url} {...getNewWindowLinkProps(item.openNewWindow)} onClick={onNavigate} className={className}>{item.label}</a>;
  }
  return <Link href={url} onClick={onNavigate} className={className}>{item.label}</Link>;
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: menus = [] } = trpc.cms.publicContent.menus.useQuery();
  const navigation = menus as NavigationItem[];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    document.body.classList.toggle("menu-open", isOpen);
    return () => {
      document.body.style.overflow = "auto";
      document.body.classList.remove("menu-open");
    };
  }, [isOpen]);

  return (
    <header className={`fixed z-50 w-full transition-all duration-300 ${scrolled ? "bg-white/95 shadow-md backdrop-blur-md" : "bg-white"}`} style={{ height: "88px" }}>
      <div className="container flex h-full items-center justify-between px-6 lg:px-8" style={{ maxWidth: "1400px" }}>
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="回到潔特務清潔首頁">
          <img src="/manus-storage/1785467843786_6a67b85c.jpg" alt="J-Agent Cleaning Logo" className="h-12 w-auto" />
          <div className="hidden flex-col sm:flex"><span className="text-sm font-semibold text-primary">J-Agent Cleaning</span><span className="text-xs text-gray-600">潔特務清潔</span></div>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-7 px-8 lg:flex xl:gap-10" aria-label="主要導覽">
          {navigation.map((item) => (
            <div key={item.id} className="group relative">
              <NavigationLink item={item} className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-primary xl:text-base" />
              {item.children.length > 0 && <ChevronDown className="pointer-events-none absolute -right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />}
              {item.children.length > 0 && <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-4 w-52 -translate-x-1/2 rounded-2xl border border-gray-100 bg-white p-2 opacity-0 shadow-xl transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">{item.children.map((child) => <NavigationLink key={child.id} item={child} className="block rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-primary/5 hover:text-primary" />)}</div>}
            </div>
          ))}
          <a href="/contact" className="ml-1 flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"><Calendar className="h-4 w-4" />立即預約</a>
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex"><ThemeToggleButton /></div>
        <div className="flex items-center gap-2 lg:hidden"><ThemeToggleButton /><Button variant="ghost" size="icon" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="mobile-navigation" aria-label={isOpen ? "關閉選單" : "開啟選單"}>{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</Button></div>
      </div>

      <aside id="mobile-navigation" aria-hidden={!isOpen} className={`fixed right-0 top-[88px] z-40 h-[calc(100vh-88px)] w-72 bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden ${isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"}`}>
        <nav className="flex h-full flex-col items-stretch gap-1 overflow-y-auto p-6" aria-label="手機主要導覽">
          {navigation.map((item) => <div key={item.id}><NavigationLink item={item} onNavigate={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-primary/5 hover:text-primary" />{item.children.map((child) => <NavigationLink key={child.id} item={child} onNavigate={() => setIsOpen(false)} className="ml-4 block rounded-xl px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-primary/5 hover:text-primary" />)}</div>)}
          <Link href="/contact" onClick={() => setIsOpen(false)} className="mt-4"><Button className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-white hover:bg-primary/90"><Calendar className="h-4 w-4" />立即預約</Button></Link>
        </nav>
      </aside>
    </header>
  );
}
