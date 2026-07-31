import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Menu, X, Calendar } from "lucide-react";
import ThemeToggleButton from "./ThemeToggleButton";
import { Link } from "wouter";

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

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white"}`}
      style={{ height: '88px' }}
    >
      <div 
        className="container mx-auto flex items-center justify-between px-6 lg:px-8 h-full"
        style={{ maxWidth: '1400px' }}
      >
        {/* Logo 和品牌名稱 - 左側 */}
        <Link href="/">
          <a className="flex items-center gap-3 flex-shrink-0">
            <img 
              src="/manus-storage/1785467843786_6a67b85c.jpg" 
              alt="J-Agent Cleaning Logo" 
              className="h-12 w-auto"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-semibold text-primary">J-Agent Cleaning</span>
              <span className="text-xs text-gray-600">潔特務清潔</span>
            </div>
          </a>
        </Link>

        {/* 導覽菜單 - 中央 */}
        <nav className="hidden lg:flex items-center gap-12 flex-1 justify-center">
          <Link href="/services">
            <a className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium">
              服務項目
            </a>
          </Link>
          <Link href="/about">
            <a className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium">
              關於我們
            </a>
          </Link>
          <Link href="/process">
            <a className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium">
              清潔流程
            </a>
          </Link>
          <Link href="/testimonials">
            <a className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium">
              客戶評價
            </a>
          </Link>
          <Link href="/faq">
            <a className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium">
              常見問題
            </a>
          </Link>
        </nav>

        {/* 右側：預約按鈕 + Dark Mode - 右側 */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/contact">
            <a>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full"
                style={{
                  height: '44px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Calendar className="h-4 w-4" />
                立即預約
              </Button>
            </a>
          </Link>
          <ThemeToggleButton />
        </div>

        {/* 手機版：漢堡選單 + Dark Mode - 右側 */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggleButton />
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

      {/* 右側 Drawer 菜單 - 手機版 */}
      {isOpen && (
        <div
          className="fixed top-0 right-0 h-screen w-64 bg-white shadow-lg lg:hidden z-45"
          style={{
            transform: isOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 300ms ease-in-out",
            marginTop: "88px",
            height: "calc(100vh - 88px)",
          }}
        >
          <nav className="flex flex-col items-start space-y-4 p-6">
            <Link href="/services">
              <a 
                className="text-gray-700 hover:text-primary transition-colors duration-200 w-full font-medium" 
                onClick={handleCloseMenu}
              >
                服務項目
              </a>
            </Link>
            <Link href="/about">
              <a 
                className="text-gray-700 hover:text-primary transition-colors duration-200 w-full font-medium" 
                onClick={handleCloseMenu}
              >
                關於我們
              </a>
            </Link>
            <Link href="/process">
              <a 
                className="text-gray-700 hover:text-primary transition-colors duration-200 w-full font-medium" 
                onClick={handleCloseMenu}
              >
                清潔流程
              </a>
            </Link>
            <Link href="/testimonials">
              <a 
                className="text-gray-700 hover:text-primary transition-colors duration-200 w-full font-medium" 
                onClick={handleCloseMenu}
              >
                客戶評價
              </a>
            </Link>
            <Link href="/faq">
              <a 
                className="text-gray-700 hover:text-primary transition-colors duration-200 w-full font-medium" 
                onClick={handleCloseMenu}
              >
                常見問題
              </a>
            </Link>
            <Link href="/contact">
              <a onClick={handleCloseMenu}>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-full mt-4"
                  style={{
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Calendar className="h-4 w-4" />
                  立即預約
                </Button>
              </a>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
