import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import FAQItem from "@/components/FAQItem";

export default function FAQ() {
  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <AnimatedSection>
          <h1 className="text-5xl font-bold text-center text-primary mb-8">
            常見問題
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <p className="text-xl text-center text-muted-foreground mb-12">
            在這裡找到您對潔特務清潔服務的疑問解答。
          </p>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto space-y-4">
            <FAQItem
              value="faq-1"
              question="潔特務清潔提供哪些服務？"
              answer="我們提供辦公室清潔、商業空間清潔、裝潢後清潔、定期維護清潔等企業級清潔服務。"
            />
            <FAQItem
              value="faq-2"
              question="你們的清潔人員是否經過專業培訓？"
              answer="是的，我們的所有清潔特務都經過嚴格的專業培訓，熟悉最新的清潔技術和環保產品使用。"
            />
            <FAQItem
              value="faq-3"
              question="如何預約清潔服務？"
              answer="您可以透過網站上的「立即預約」按鈕填寫表單，或直接撥打我們的服務專線，將有專人為您服務。"
            />
            <FAQItem
              value="faq-4"
              question="你們使用哪些清潔產品？"
              answer="我們優先選用對環境友善、無毒且高效的清潔產品，確保清潔效果的同時，也保障您空間的健康與安全。"
            />
            <FAQItem
              value="faq-5"
              question="清潔服務的費用如何計算？"
              answer="費用會根據清潔面積、服務頻率、清潔項目複雜度等因素綜合評估。建議您聯繫我們，獲取客製化報價。"
            />
            <FAQItem
              value="faq-6"
              question="我可以指定清潔時間嗎？"
              answer="當然可以。我們會盡力配合您的時間安排，提供最彈性的服務。"
            />
          </Accordion>
        </AnimatedSection>

        <AnimatedSection delay={300}>
          <div className="text-center mt-16">
            <Link href="/contact">
              <Button variant="default" size="lg" className="soft-shadow hover:scale-105 transition-transform duration-300">
                還有其他問題？聯繫我們
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
