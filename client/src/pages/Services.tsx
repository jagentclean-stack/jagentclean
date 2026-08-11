import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Briefcase, ShieldCheck, Zap, Factory, HomeIcon, Building2, Droplets, Wind, Sofa, Zap as Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceCard from "@/components/ServiceCard";

export default function Services() {
  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <AnimatedSection>
          <h1 className="text-5xl font-bold text-center text-primary mb-8">
            我們的專業服務項目
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <p className="text-xl text-center text-muted-foreground mb-12">
            潔特務清潔提供多元化、客製化的企業級清潔方案，滿足您不同的需求。
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatedSection delay={0}>
            <ServiceCard
              icon={HomeIcon}
              title="🏠 居家清潔＆裝潢細清"
              description="提供居家日常清潔與新裝潢後的細部清潔，清除殘留粉塵、油漆漬等，恢復潔淨。"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <ServiceCard
              icon={Sparkle}
              title="🪵 石材保養＆研磨拋光"
              description="針對大理石、花崗岩等特殊材質，提供專業清潔、研磨拋光與保養服務。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ServiceCard
              icon={ShieldCheck}
              title="💎 居家鍍膜，防汙更持久"
              description="使用專業鍍膜技術，為地板、牆面等表面提供長效防汙保護。"
            />
          </AnimatedSection>
          <AnimatedSection delay={0}>
            <ServiceCard
              icon={Droplets}
              title="💦 水塔清洗，確保用水安全"
              description="定期清洗水塔，去除沉積物與細菌，確保飲用水安全衛生。"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <ServiceCard
              icon={Sofa}
              title="🛋 地毯＆沙發清潔保養"
              description="使用專業設備與環保清潔劑，深度清潔地毯與沙發，延長使用壽命。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ServiceCard
              icon={Building2}
              title="🏢 外牆高壓清洗"
              description="採用高壓清洗技術，有效清除外牆污垢、苔蘚，恢復建築美觀。"
            />
          </AnimatedSection>
          <AnimatedSection delay={0}>
            <ServiceCard
              icon={HomeIcon}
              title="🛏 洗床除塵蟎，守護健康"
              description="專業床鋪清潔服務，有效去除塵蟎與過敏原，守護家人健康。"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <ServiceCard
              icon={Wind}
              title="🌀 洗衣機＆冷氣機深度清潔"
              description="深度清潔洗衣機與冷氣機內部，去除污垢與細菌，提高效能與衛生。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ServiceCard
              icon={Briefcase}
              title="辦公室日常清潔"
              description="提供辦公區域、會議室、茶水間等日常清潔維護，保持整潔舒適的工作環境。"
            />
          </AnimatedSection>
          <AnimatedSection delay={0}>
            <ServiceCard
              icon={Factory}
              title="商業空間深度清潔"
              description="針對零售店、餐廳、展覽空間等，提供定期或單次的深度清潔服務。"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <ServiceCard
              icon={HomeIcon}
              title="高端住宅物業清潔"
              description="為高級住宅社區提供專業物業清潔管理，提升居住品質。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ServiceCard
              icon={ShieldCheck}
              title="定期消毒與除塵"
              description="使用專業設備進行空間消毒，有效抑制細菌病毒，保障健康。"
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
