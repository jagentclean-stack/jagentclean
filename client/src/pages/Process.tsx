import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import ProcessStep from "@/components/ProcessStep";
import { CheckCircle, FileText, Handshake, Truck } from "lucide-react";

export default function Process() {
  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <AnimatedSection>
          <h1 className="text-5xl font-bold text-center text-primary mb-8">
            我們的專業清潔流程
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <p className="text-xl text-center text-muted-foreground mb-12">
            從諮詢到完成，每一步都嚴謹細緻，確保為您提供卓越的清潔體驗。
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <AnimatedSection delay={0}>
            <ProcessStep
              stepNumber={1}
              title="初步諮詢與評估"
              description="專業顧問將與您深入溝通，了解您的具體清潔需求、空間狀況及預算，提供初步建議。"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <ProcessStep
              stepNumber={2}
              title="現場勘查與客製化報價"
              description="安排專業人員進行現場勘查，精確評估工作量與所需資源，並提供詳細的客製化清潔方案與報價。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ProcessStep
              stepNumber={3}
              title="簽訂合約與排程"
              description="雙方確認清潔方案與報價後，簽訂正式服務合約，並根據您的時間安排清潔排程。"
            />
          </AnimatedSection>
          <AnimatedSection delay={0}>
            <ProcessStep
              stepNumber={4}
              title="專業團隊執行清潔"
              description="訓練有素的潔特務團隊將攜帶專業設備與環保清潔劑，按照約定時間，高效、細緻地完成清潔任務。"
            />
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <ProcessStep
              stepNumber={5}
              title="品質驗收與回饋"
              description="清潔完成後，邀請您進行現場驗收。我們重視您的回饋，確保服務達到您的滿意標準。"
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ProcessStep
              stepNumber={6}
              title="定期追蹤與維護"
              description="提供後續的定期追蹤與維護建議，確保您的空間持續保持潔淨，並可彈性調整服務內容。"
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
