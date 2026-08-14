import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Facebook, Mail, Phone, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/manus-storage/brand-logo_0f07bc46.png" alt="J-Agent Cleaning Logo" className="h-8" />
            <span className="text-xl font-bold">潔特務清潔</span>
          </Link>
          <p className="text-sm leading-relaxed">
            提供專業、高品質、高信任感、高效率的企業級清潔服務，為您的空間帶來潔淨與舒適。
          </p>
          <div className="flex space-x-4">
            <a href="https://www.facebook.com/Jagentclean" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-secondary hover:scale-125 transition-all duration-300">
              <Facebook className="h-6 w-6" />
            </a>
            <a href="https://lin.ee/ynvoHjh" target="_blank" rel="noopener noreferrer" aria-label="LINE" className="hover:text-secondary hover:scale-125 transition-all duration-300">
              <MessageCircle className="h-6 w-6" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-2">快速連結</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/services" className="hover:text-secondary transition-colors duration-200">服務項目</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-secondary transition-colors duration-200">關於我們</Link>
            </li>
            <li>
              <Link href="/process" className="hover:text-secondary transition-colors duration-200">清潔流程</Link>
            </li>
            <li>
              <Link href="/testimonials" className="hover:text-secondary transition-colors duration-200">客戶評價</Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-secondary transition-colors duration-200">常見問題</Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-2">聯絡我們</h3>
          <ul className="space-y-2">
            <li className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-secondary" />
              <a href="tel:06-3584567" className="hover:text-secondary transition-colors">06-3584567</a>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-secondary" />
              <a href="mailto:jagentclean@gmail.com" className="hover:text-secondary transition-colors">jagentclean@gmail.com</a>
            </li>
            <li className="text-sm leading-relaxed">
              地址：台南市安南區國安街45巷12號
            </li>
            <li className="text-sm leading-relaxed">
              傳真：06-3583232
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-2">立即預約</h3>
          <p className="text-sm leading-relaxed">
            讓潔特務清潔為您的空間帶來煥然一新的體驗。
          </p>
          <Link href="/contact">
            <Button variant="secondary" className="soft-shadow hover:scale-110 hover:shadow-lg transition-all duration-300 w-full">
              獲取免費報價
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm">
        &copy; 2020 潔特務清潔. All rights reserved.
      </div>
    </footer>
  );
}
