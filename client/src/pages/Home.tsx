import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ServiceCard from "@/components/ServiceCard";
import ProcessStep from "@/components/ProcessStep";
import { Briefcase, ShieldCheck, Zap } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import TestimonialCard from "@/components/TestimonialCard";
import FAQItem from "@/components/FAQItem";
import { Accordion } from "@/components/ui/accordion";
import CTASection from "@/components/CTASection";


export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Hero Background Image with Parallax Effect */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out"
        style={{
          backgroundImage: `url(/manus-storage/hero-background_f0e461b3.png)`,
          backgroundAttachment: 'fixed', // This creates the parallax effect
          transform: 'translateY(var(--parallax-offset, 0px))'
        }}
      ></div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 to-primary/90"></div>

      <div className="relative z-10 p-8 max-w-4xl mx-auto space-y-6">
        <AnimatedSection>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4 text-black">
            潔特務清潔：專業、高效、值得信賴的企業級清潔服務
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <p className="text-base md:text-lg font-light mb-8 text-black">
            我們提供世界級的清潔解決方案，為您的企業打造一塵不染的專業環境。
          </p>
        </AnimatedSection>
        <AnimatedSection delay={200}>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/contact">
              <Button variant="default" size="lg" className="soft-shadow hover:scale-105 transition-transform duration-300">
                立即預約免費諮詢
              </Button>
            </Link>
            <a href="https://lin.ee/ynvoHjh" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="soft-shadow hover:scale-105 transition-transform duration-300 border-black text-black hover:bg-black hover:text-white">
                獲取免費報價
              </Button>
            </a>
            <Link href="/services">
              <Button variant="outline" size="lg" className="soft-shadow hover:scale-105 transition-transform duration-300 border-black text-black hover:bg-black hover:text-white">
                了解更多服務項目
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>

      {/* Services Section */}
      <section className="relative z-10 w-full py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center text-primary mb-12">
              我們的專業服務
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedSection delay={0}>
              <ServiceCard
                icon={Briefcase}
                title="企業級清潔"
                description="針對辦公室、商業空間提供客製化清潔方案，確保環境專業整潔。"
              />
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <ServiceCard
                icon={ShieldCheck}
                title="高品質保證"
                description="嚴選環保清潔劑與專業設備，提供業界最高標準的清潔品質。"
              />
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <ServiceCard
                icon={Zap}
                title="高效率團隊"
                description="訓練有素的清潔特務，以最快速度完成任務，不影響您的日常運作。"
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="relative z-10 w-full py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <AnimatedSection>
            <div className="md:w-1/2 text-left space-y-6">
              <h2 className="text-4xl font-bold text-primary mb-4">
                關於潔特務清潔
              </h2>
              <p className="text-lg text-gray-800 leading-relaxed">
                潔特務清潔致力於提供卓越的企業級清潔服務，我們深知一個潔淨、衛生的工作環境對於企業形象和員工生產力的重要性。憑藉多年的行業經驗和專業知識，我們為各行各業的客戶提供量身定制的清潔解決方案。
              </p>
              <p className="text-lg text-gray-800 leading-relaxed">
                我們的團隊由一群訓練有素、經驗豐富的「清潔特務」組成，他們不僅掌握最先進的清潔技術，更秉持著嚴謹細緻的服務態度。我們使用環保無毒的清潔產品和高效能設備，確保每一次服務都能達到最高標準，讓您的空間煥然一新。
              </p>
              <Link href="/about">
                <Button variant="secondary" className="mt-6 soft-shadow hover:scale-105 transition-transform duration-300">
                  了解更多關於我們
                </Button>
              </Link>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="md:w-1/2 flex justify-center">
              <img
                src="/manus-storage/service-professionalism_cd3ef70f.png"
                alt="About J-Agent Cleaning"
                className="rounded-xl soft-shadow w-full max-w-md"
                loading="lazy"
                width={500} // Assuming a reasonable width for this image
                height={500} // Assuming a reasonable height for this image
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Cleaning Process Section */}
      <section className="relative z-10 w-full py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center text-primary mb-12">
              我們的清潔流程
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedSection delay={0}>
              <ProcessStep
                stepNumber={1}
                title="需求評估與報價"
                description="專業顧問將與您聯繫，詳細了解清潔需求，並提供客製化報價。"
              />
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <ProcessStep
                stepNumber={2}
                title="制定清潔計畫"
                description="根據評估結果，量身打造專屬清潔計畫，確保服務效率與品質。"
              />
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <ProcessStep
                stepNumber={3}
                title="專業團隊執行"
                description="訓練有素的潔特務團隊，攜帶專業設備與環保清潔劑，高效完成任務。"
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 w-full py-20 bg-muted">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center text-primary mb-12">
              客戶怎麼說
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatedSection delay={0}>
              <TestimonialCard
                name="王先生"
                title="科技公司 CEO"
                quote="潔特務清潔的服務非常專業，讓我們的辦公室煥然一新，員工工作效率都提高了！"
              />
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <TestimonialCard
                name="陳小姐"
                title="連鎖咖啡店經理"
                quote="他們的團隊效率極高，清潔細緻入微，完全符合我們對高品質的要求。"
              />
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <TestimonialCard
                name="林總經理"
                title="國際貿易公司"
                quote="選擇潔特務清潔是我們最明智的決定，他們值得信賴，服務品質始終如一。"
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 w-full py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center text-primary mb-12">
              常見問題
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto space-y-4">
              <FAQItem
                value="item-1"
                question="潔特務清潔提供哪些服務？"
                answer="我們提供辦公室清潔、商業空間清潔、裝潢後清潔、定期維護清潔等企業級清潔服務。"
              />
              <FAQItem
                value="item-2"
                question="你們的清潔人員是否經過專業培訓？"
                answer="是的，我們的所有清潔特務都經過嚴格的專業培訓，熟悉最新的清潔技術和環保產品使用。"
              />
              <FAQItem
                value="item-3"
                question="如何預約清潔服務？"
                answer="您可以透過網站上的「立即預約」按鈕填寫表單，或直接撥打我們的服務專線，將有專人為您服務。"
              />
              <FAQItem
                value="item-4"
                question="你們使用哪些清潔產品？"
                answer="我們優先選用對環境友善、無毒且高效的清潔產品，確保清潔效果的同時，也保障您空間的健康與安全。"
              />
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <AnimatedSection>
        <CTASection />
      </AnimatedSection>
    </div>
  );
}
