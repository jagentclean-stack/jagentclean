import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import TestimonialCard from "@/components/TestimonialCard";

export default function Testimonials() {
  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <AnimatedSection>
          <h1 className="text-5xl font-bold text-center text-primary mb-8">
            客戶的真實評價
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <p className="text-xl text-center text-muted-foreground mb-12">
            聽聽我們的客戶如何評價潔特務清潔的專業服務。
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <AnimatedSection delay={0}>
            <TestimonialCard
              name="王先生"
              title="科技公司 CEO"
              quote="潔特務清潔的服務非常專業，讓我們的辦公室煥然一新，員工工作效率都提高了！他們不僅清潔徹底，而且非常注重細節，每次服務都讓我們非常滿意。強烈推薦！"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <TestimonialCard
              name="陳小姐"
              title="連鎖咖啡店經理"
              quote="他們的團隊效率極高，清潔細緻入微，完全符合我們對高品質的要求。特別是對於咖啡漬和廚房油污的處理，效果令人驚艷。合作以來，我們的店面始終保持最佳狀態。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <TestimonialCard
              name="林總經理"
              title="國際貿易公司"
              quote="選擇潔特務清潔是我們最明智的決定，他們值得信賴，服務品質始終如一。我們的辦公大樓面積大，清潔難度高，但潔特務總能按時高效完成任務，並且提供靈活的服務方案。"
            />
          </AnimatedSection>
          <AnimatedSection delay={0}>
            <TestimonialCard
              name="張經理"
              title="精品服飾店"
              quote="我們的店面需要保持一塵不染，以維護品牌形象。潔特務清潔的團隊非常理解我們的需求，他們細心清潔每一個角落，讓我們的顧客總能感受到舒適與奢華。"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <TestimonialCard
              name="黃醫師"
              title="牙醫診所院長"
              quote="診所的衛生標準非常重要，潔特務清潔不僅提供日常清潔，還能針對醫療環境進行專業消毒，讓我們和患者都感到安心。他們的專業知識和嚴謹態度值得肯定。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <TestimonialCard
              name="吳老闆"
              title="共享辦公空間營運者"
              quote="作為共享辦公空間，清潔頻率高且要求嚴格。潔特務清潔的服務非常靈活，能根據我們的使用情況調整清潔排程，確保每個使用者都能在乾淨的環境中工作。"
            />
          </AnimatedSection>
        </div>

        <AnimatedSection>
          <div className="text-center mt-16">
            <Link href="/contact">
              <Button variant="default" size="lg" className="soft-shadow hover:scale-105 transition-transform duration-300">
                立即預約免費諮詢
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
