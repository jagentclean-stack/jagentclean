import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Menu, X } from "lucide-react";
import ThemeToggleButton from "./ThemeToggleButton";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md soft-shadow" : "bg-transparent"}`}
    >
      <div className="container mx-auto flex items-center justify-between py-4 px-4 lg:px-8">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <img src="/manus-storage/brand-logo_0f07bc46.png" alt="J-Agent Cleaning Logo" className="h-8" />
            <span className="text-xl font-bold text-primary">潔特務清潔</span>
          </a>
        </Link>

        <nav className="hidden lg:flex items-center space-x-8">
          <Link href="/services">
            <a className="text-primary hover:text-secondary transition-colors duration-200">服務項目</a>
          </Link>
          <Link href="/about">
            <a className="text-primary hover:text-secondary transition-colors duration-200">關於我們</a>
          </Link>
          <Link href="/process">
            <a className="text-primary hover:text-secondary transition-colors duration-200">清潔流程</a>
          </Link>
          <Link href="/testimonials">
            <a className="text-primary hover:text-secondary transition-colors duration-200">客戶評價</a>
          </Link>
          <Link href="/faq">
            <a className="text-primary hover:text-secondary transition-colors duration-200">常見問題</a>
          </Link>
          <Button variant="default" className="ml-4">立即預約</Button>
          <ThemeToggleButton />
        </nav>

        <div className="lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-background/90 backdrop-blur-md soft-shadow py-4 px-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <nav className="flex flex-col items-center space-y-4">
            <Link href="/services">
              <a className="text-primary hover:text-secondary transition-colors duration-200" onClick={() => setIsOpen(false)}>服務項目</a>
            </Link>
            <Link href="/about">
              <a className="text-primary hover:text-secondary transition-colors duration-200" onClick={() => setIsOpen(false)}>關於我們</a>
            </Link>
            <Link href="/process">
              <a className="text-primary hover:text-secondary transition-colors duration-200" onClick={() => setIsOpen(false)}>清潔流程</a>
            </Link>
            <Link href="/testimonials">
              <a className="text-primary hover:text-secondary transition-colors duration-200" onClick={() => setIsOpen(false)}>客戶評價</a>
            </Link>
            <Link href="/faq">
              <a className="text-primary hover:text-secondary transition-colors duration-200" onClick={() => setIsOpen(false)}>常見問題</a>
            </Link>
            <Button variant="default" className="mt-4" onClick={() => setIsOpen(false)}>立即預約</Button>
            <ThemeToggleButton mobile />
          </nav>
        </div>
      )}
    </header>
  );
}
