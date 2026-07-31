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

  const handleOverlayClick = (e: React.MouseEvent) => {
    // 只在點擊 Overlay 本身時關閉，不在 Drawer 上點擊時關閉
    if (e.target === e.currentTarget) {
      handleCloseMenu();
    }
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 h-16 lg:h-auto ${scrolled ? "bg-background/80 backdrop-blur-md soft-shadow" : "bg-transparent"}`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 lg:h-auto lg:py-4 px-4 lg:px-8">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <img 
              src="/manus-storage/1785467843786_6a67b85c.jpg" 
              alt="J-Agent Cleaning Logo" 
              className="h-10 w-auto lg:h-12" 
            />
            <span className="text-xl font-bold text-primary hidden sm:inline">潔特務清潔</span>
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

        {/* 手機版漢堡選單 - 置中對齊 */}
        <div className="lg:hidden flex items-center justify-center">
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

      {/* Overlay - 完全移除，不殘留 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40 transition-opacity duration-300"
          style={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
          }}
          onClick={handleOverlayClick}
        />
      )}

      {/* 右側 Drawer 菜單 */}
      {isOpen && (
        <div
          className="fixed top-0 right-0 h-screen w-64 bg-background/95 backdrop-blur-md soft-shadow lg:hidden z-45 transition-transform duration-300"
          style={{
            transform: isOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 300ms ease-in-out",
            marginTop: "64px",
            height: "calc(100vh - 64px)",
          }}
        >
          <nav className="flex flex-col items-start space-y-4 p-6">
            <Link href="/services">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200 w-full" 
                onClick={handleCloseMenu}
              >
                服務項目
              </a>
            </Link>
            <Link href="/about">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200 w-full" 
                onClick={handleCloseMenu}
              >
                關於我們
              </a>
            </Link>
            <Link href="/process">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200 w-full" 
                onClick={handleCloseMenu}
              >
                清潔流程
              </a>
            </Link>
            <Link href="/testimonials">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200 w-full" 
                onClick={handleCloseMenu}
              >
                客戶評價
              </a>
            </Link>
            <Link href="/faq">
              <a 
                className="text-primary hover:text-secondary transition-colors duration-200 w-full" 
                onClick={handleCloseMenu}
              >
                常見問題
              </a>
            </Link>
            <Button variant="default" className="w-full mt-4" onClick={handleCloseMenu}>立即預約</Button>
            <div className="w-full mt-6 pt-6 border-t border-border">
              <ThemeToggleButton mobile />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
