import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Briefcase, ShieldCheck, Zap, Factory, HomeIcon, Building2 } from "lucide-react";
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
              icon={Briefcase}
              title="辦公室日常清潔"
              description="提供辦公區域、會議室、茶水間等日常清潔維護，保持整潔舒適的工作環境。"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <ServiceCard
              icon={Factory}
              title="商業空間深度清潔"
              description="針對零售店、餐廳、展覽空間等，提供定期或單次的深度清潔服務。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ServiceCard
              icon={Building2}
              title="裝潢後細部清潔"
              description="新裝潢或翻修後的空間，清除殘留粉塵、油漆漬等，恢復潔淨。"
            />
          </AnimatedSection>
          <AnimatedSection delay={0}>
            <ServiceCard
              icon={HomeIcon}
              title="高端住宅物業清潔"
              description="為高級住宅社區提供專業物業清潔管理，提升居住品質。"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <ServiceCard
              icon={ShieldCheck}
              title="定期消毒與除塵"
              description="使用專業設備進行空間消毒，有效抑制細菌病毒，保障健康。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ServiceCard
              icon={Zap}
              title="特殊材質保養"
              description="針對大理石、木地板等特殊材質，提供專業清潔與保養服務。"
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
