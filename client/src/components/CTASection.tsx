import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CTASection() {
  return (
    <section className="relative z-10 w-full py-20 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>
      <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl font-bold mb-6 animate-fade-in-up">
          準備好讓您的空間煥然一新了嗎？
        </h2>
        <p className="text-lg md:text-xl mb-8 animate-fade-in-up delay-100">
          立即聯繫潔特務清潔，獲取專業、高效的企業級清潔解決方案。
        </p>
        <Link href="/contact">
          <Button variant="secondary" size="lg" className="soft-shadow hover:scale-110 hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-200">
            立即預約免費諮詢
          </Button>
        </Link>
      </div>
    </section>
  );
}
