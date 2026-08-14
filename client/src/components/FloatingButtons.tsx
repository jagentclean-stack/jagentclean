import React, { useEffect, useState } from "react";
import { MessageCircle, Phone, Calendar, ArrowUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingButtons() {
  const [showMenu, setShowMenu] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // 瀏覽器端才監聽捲動；避免 SSR 執行時存取 window，並在卸載時移除監聽器。
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* 浮動按鈕菜單 */}
      {showMenu && (
        <div className="flex flex-col gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* LINE 按鈕 */}
          <div className="flex items-center justify-end gap-2 group">
            <span className="bg-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              加入 LINE
            </span>
            <a
              href="https://lin.ee/ynvoHjh"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#00B900] hover:bg-[#00A000] rounded-full h-12 w-12 p-0 flex items-center justify-center shadow-lg transition-colors duration-200"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </a>
          </div>

          {/* Facebook 按鈕 */}
          <div className="flex items-center justify-end gap-2 group">
            <span className="bg-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Facebook
            </span>
            <a
              href="https://www.facebook.com/Jagentclean"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0A66C2] hover:bg-[#054399] rounded-full h-12 w-12 p-0 flex items-center justify-center shadow-lg transition-colors duration-200"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </a>
          </div>

          {/* 電話按鈕 */}
          <div className="flex items-center justify-end gap-2 group">
            <span className="bg-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              06-3584567
            </span>
            <a
              href="tel:06-3584567"
              className="bg-[#FF6B6B] hover:bg-[#FF5252] rounded-full h-12 w-12 p-0 flex items-center justify-center shadow-lg transition-colors duration-200"
            >
              <Phone className="h-6 w-6 text-white" />
            </a>
          </div>

          {/* 預約按鈕 */}
          <div className="flex items-center justify-end gap-2 group">
            <span className="bg-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              立即預約
            </span>
            <a
              href="/contact"
              className="bg-primary hover:bg-primary/90 rounded-full h-12 w-12 p-0 flex items-center justify-center shadow-lg transition-colors duration-200"
            >
              <Calendar className="h-6 w-6 text-white" />
            </a>
          </div>
        </div>
      )}

      {/* 主菜單按鈕 */}
      <Button
        size="lg"
        className="bg-secondary hover:bg-secondary/90 rounded-full h-14 w-14 p-0 flex items-center justify-center shadow-lg animate-bounce"
        onClick={() => setShowMenu(!showMenu)}
      >
        <Send className="h-6 w-6" />
      </Button>

      {/* 回到頂部按鈕 */}
      {scrollY > 300 && (
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 rounded-full h-12 w-12 p-0 flex items-center justify-center shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={handleScrollToTop}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
