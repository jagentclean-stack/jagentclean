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

  // 管理 body overflow 和 menu-open class
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("menu-open");
    } else {
      document.body.style.overflow = "auto";
      document.body.classList.remove("menu-open");
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.classList.remove("menu-open");
    };
  }, [isOpen]);

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  const handleOverlayClick = () => {
    handleCloseMenu();
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md soft-shadow" : "bg-transparent"}`}
    >
      <div className="container mx-auto flex items-center justify-between py-4 px-4 lg:px-8">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <img src="/manus-storage/jagent-logo_49bbfe06.png" alt="J-Agent Cleaning Logo" className="h-10 w-10" />
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(!isOpen)}
            className="z-50"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Overlay - 完全控制透明度、指針事件和顯示 */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/50 lg:hidden transition-all duration-300 ${
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isOpen ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
            pointerEvents: isOpen ? "auto" : "none",
            opacity: isOpen ? 1 : 0,
            zIndex: 40,
          }}
          onClick={handleOverlayClick}
        />
      )}

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className={`fixed top-16 left-0 right-0 bg-background/95 backdrop-blur-md soft-shadow py-4 px-4 lg:hidden transition-all duration-300 z-45 ${
            isOpen ? "animate-in fade-in slide-in-from-top-2" : "animate-out fade-out slide-out-to-top-2"
          }`}
          style={{
            display: isOpen ? "block" : "none",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0)" : "translateY(-100%)",
            transition: "all 300ms ease-in-out",
          }}
        >
          <nav className="flex flex-col items-center space-y-4">
            <Link href="/services">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200" 
                onClick={handleCloseMenu}
              >
                服務項目
              </a>
            </Link>
            <Link href="/about">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200" 
                onClick={handleCloseMenu}
              >
                關於我們
              </a>
            </Link>
            <Link href="/process">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200" 
                onClick={handleCloseMenu}
              >
                清潔流程
              </a>
            </Link>
            <Link href="/testimonials">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200" 
                onClick={handleCloseMenu}
              >
                客戶評價
              </a>
            </Link>
            <Link href="/faq">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200" 
                onClick={handleCloseMenu}
              >
                常見問題
              </a>
            </Link>
            <Button variant="default" className="mt-4" onClick={handleCloseMenu}>立即預約</Button>
            <ThemeToggleButton mobile />
          </nav>
        </div>
      )}
    </header>
  );
}
