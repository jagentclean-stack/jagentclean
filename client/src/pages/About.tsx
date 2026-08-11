import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { CheckCircle, Award, Users } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <AnimatedSection>
          <h1 className="text-5xl font-bold text-center text-primary mb-8">
            關於潔特務清潔
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <p className="text-xl text-center text-muted-foreground mb-12">
            我們是您值得信賴的清潔夥伴，致力於提供卓越的企業級清潔服務。
          </p>
        </AnimatedSection>

        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
          <AnimatedSection>
            <div className="md:w-1/2 text-left space-y-6">
              <h2 className="text-4xl font-bold text-primary mb-4">
                我們的使命與願景
              </h2>
              <p className="text-lg text-foreground leading-relaxed">
                潔特務清潔的使命是透過專業、高效、環保的清潔服務，為企業客戶創造一個潔淨、健康、舒適的工作環境。我們相信，一個優質的環境不僅能提升員工的生產力，更能彰顯企業的專業形象。
              </p>
              <p className="text-lg text-foreground leading-relaxed">
                我們的願景是成為業界領先的企業級清潔服務提供商，以創新技術和卓越服務，重新定義清潔標準，成為客戶最信賴的長期合作夥伴。
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="md:w-1/2 flex justify-center">
              <img
                src="/manus-storage/586524_e7f6adef.png"
                alt="潔特務清潔專業團隊代言人"
                className="rounded-xl soft-shadow w-full max-w-md"
                loading="lazy"
                width={400}
                height={400}
              />
            </div>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <AnimatedSection delay={0}>
            <div className="glassmorphism soft-shadow p-8 rounded-xl text-center">
              <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-primary mb-2">專業認證</h3>
              <p className="text-muted-foreground">所有清潔人員均通過嚴格培訓與專業認證，確保服務品質。</p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="glassmorphism soft-shadow p-8 rounded-xl text-center">
              <Award className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-primary mb-2">品質保證</h3>
              <p className="text-muted-foreground">我們承諾提供最高標準的清潔服務，不滿意保證重做。</p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <div className="glassmorphism soft-shadow p-8 rounded-xl text-center">
              <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-primary mb-2">客戶至上</h3>
              <p className="text-muted-foreground">以客戶需求為核心，提供客製化解決方案與貼心服務。</p>
            </div>
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
