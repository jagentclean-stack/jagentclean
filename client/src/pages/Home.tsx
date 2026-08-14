import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ServiceCard from "@/components/ServiceCard";
import ProcessStep from "@/components/ProcessStep";
import { Briefcase, ShieldCheck, Zap } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import TestimonialCard from "@/components/TestimonialCard";
import FAQItem from "@/components/FAQItem";
import { Accordion } from "@/components/ui/accordion";
import CTASection from "@/components/CTASection";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { data: homepageContent } = trpc.cms.publicContent.homepage.useQuery();
  const hero = homepageContent?.hero;
  const services = homepageContent?.services ?? [];
  const reviews = homepageContent?.reviews ?? [];
  const faqs = homepageContent?.faqs ?? [];
  const serviceIcons = [Briefcase, ShieldCheck, Zap];

  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero Section - 國際級企業設計 */}
      <section className="relative w-full" style={{ paddingTop: '100px', paddingBottom: '140px', marginTop: '88px' }}>
        {/* Hero Background Image with Parallax Effect */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out"
          style={{
            backgroundImage: `url(${hero?.backgroundImage || "/manus-storage/hero-background_f0e461b3.png"})`,
            backgroundAttachment: 'fixed',
            transform: 'translateY(var(--parallax-offset, 0px))'
          }}
        ></div>

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 to-primary/90"></div>

        {/* Hero Content - 垂直置中 */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-full px-6 lg:px-8" style={{ maxWidth: '900px' }}>
            {/* 主標題 - 三行，64-72px */}
            <AnimatedSection>
              <h1 
                className="text-black font-bold leading-tight mb-8"
                style={{
                  fontSize: '64px',
                  lineHeight: '1.2',
                  letterSpacing: '-0.03em',
                  fontWeight: '700'
                }}
              >
                {hero?.title || <>潔特務清潔：專業、高效、<br />值得信賴的企業級清潔服務</>}
              </h1>
            </AnimatedSection>

            {/* 副標題 - 與主標間距 32px */}
            <AnimatedSection delay={100}>
              <p 
                className="text-gray-600 font-light mb-10"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  marginBottom: '32px'
                }}
              >
                {hero?.subtitle || "我們提供世界級的清潔解決方案，為您的企業打造一塵不染的專業環境。"}
              </p>
            </AnimatedSection>

            {/* CTA 按鈕 - 與副標間距 40px */}
            <AnimatedSection delay={200}>
              <div 
                className="flex flex-col sm:flex-row justify-center items-center"
                style={{ gap: '20px', marginBottom: '40px' }}
              >
                <a href={hero?.ctaLink || "/contact"}>
                  <Button 
                    className="soft-shadow hover:scale-105 transition-transform duration-300 rounded-full"
                    style={{
                      height: '56px',
                      paddingLeft: '28px',
                      paddingRight: '28px',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#163C72',
                      color: '#ffffff'
                    }}
                  >
                    {hero?.ctaText || "📅 立即預約免費諮詢"}
                  </Button>
                </a>
                <a href="https://lin.ee/ynvoHjh" target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="outline"
                    className="soft-shadow hover:scale-105 transition-transform duration-300 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full"
                    style={{
                      height: '56px',
                      paddingLeft: '28px',
                      paddingRight: '28px',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    📋 獲取免費報價
                  </Button>
                </a>
                <a href="/services">
                  <Button 
                    variant="outline"
                    className="soft-shadow hover:scale-105 transition-transform duration-300 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full"
                    style={{
                      height: '56px',
                      paddingLeft: '28px',
                      paddingRight: '28px',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🏢 了解更多服務項目
                  </Button>
                </a>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 品牌代言人區 */}
      <section className="relative z-10 w-full bg-background" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        <div className="w-full px-6 lg:px-8" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatedSection>
            <div className="flex justify-center">
              <img
                src="/manus-storage/586524_e7f6adef.png"
                alt="潔特務清潔品牌代言人"
                className="rounded-xl soft-shadow"
                style={{ maxWidth: '300px', height: 'auto' }}
                loading="lazy"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 品牌數據區 - 三欄橫向排列 */}
      <section 
        className="relative z-10 w-full bg-background"
        style={{ paddingTop: '80px', paddingBottom: '80px' }}
      >
        <div className="w-full px-6 lg:px-8" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            <AnimatedSection>
              <div>
                <h3 className="text-5xl font-bold text-secondary mb-4">10+</h3>
                <p className="text-lg text-primary font-medium">年行業經驗</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <div>
                <h3 className="text-5xl font-bold text-secondary mb-4">4000+</h3>
                <p className="text-lg text-primary font-medium">完成案例</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <div>
                <h3 className="text-5xl font-bold text-secondary mb-4">98%</h3>
                <p className="text-lg text-primary font-medium">客戶滿意度</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Services Section - 與 Hero 距離 140px，與卡片間距 72px */}
      <section 
        className="relative z-10 w-full bg-background"
        style={{ paddingTop: '140px', paddingBottom: '80px' }}
      >
        <div className="w-full px-6 lg:px-8" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatedSection>
            <h2 className="text-5xl font-bold text-center text-primary mb-24" style={{ marginBottom: '72px' }}>
              我們的專業服務
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {services.slice(0, 3).map((service, index) => (
              <AnimatedSection key={service.id} delay={index * 100}>
                <ServiceCard
                  icon={serviceIcons[index % serviceIcons.length]}
                  title={service.name}
                  description={service.description || ""}
                />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="relative z-10 w-full bg-white" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="w-full px-6 lg:px-8" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <AnimatedSection>
              <div className="md:w-1/2 text-left space-y-6">
                <h2 className="text-4xl font-bold text-primary mb-6">
                  關於潔特務清潔
                </h2>
                <p className="text-lg text-gray-800 leading-relaxed">
                  潔特務清潔致力於提供卓越的企業級清潔服務，我們深知一個潔淨、衛生的工作環境對於企業形象和員工生產力的重要性。憑藉多年的行業經驗和專業知識，我們為各行各業的客戶提供量身定制的清潔解決方案。
                </p>
                <p className="text-lg text-gray-800 leading-relaxed">
                  我們的團隊由一群訓練有素、經驗豐富的「清潔特務」組成，他們不僅掌握最先進的清潔技術，更秉持著嚴謹細緻的服務態度。
                </p>
                <a href="/about">
                  <Button 
                    variant="secondary" 
                    className="mt-8 soft-shadow hover:scale-105 transition-transform duration-300"
                    style={{
                      height: '56px',
                      paddingLeft: '28px',
                      paddingRight: '28px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    了解更多關於我們
                  </Button>
                </a>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <div className="md:w-1/2 flex justify-center items-center">
                <img
                  src="/manus-storage/jagent-cleaning-service_e8cbb29e.webp"
                  alt="About J-Agent Cleaning"
                  className="rounded-xl soft-shadow w-full h-auto"
                  loading="lazy"
                  width={600}
                  height={500}
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Cleaning Process Section */}
      <section className="relative z-10 w-full bg-background" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="w-full px-6 lg:px-8" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <AnimatedSection>
            <h2 className="text-4xl font-bold text-center text-primary mb-24" style={{ marginBottom: '72px' }}>
              我們的清潔流程
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
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
      {reviews.length > 0 && (
        <section className="relative z-10 w-full bg-muted" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <div className="w-full px-6 lg:px-8" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <AnimatedSection>
              <h2 className="text-4xl font-bold text-center text-primary mb-24" style={{ marginBottom: '72px' }}>
                客戶怎麼說
              </h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {reviews.map((review, index) => (
                <AnimatedSection key={review.id} delay={index * 100}>
                  <TestimonialCard
                    name={review.name ?? ""}
                    title="潔特務清潔客戶"
                    quote={review.content ?? ""}
                    avatarSrc={review.avatar || undefined}
                  />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="relative z-10 w-full bg-background" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <div className="w-full px-6 lg:px-8" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <AnimatedSection>
              <h2 className="text-4xl font-bold text-center text-primary mb-24" style={{ marginBottom: '72px' }}>
                常見問題
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq) => (
                    <FAQItem
                      key={faq.id}
                      value={`faq-${faq.id}`}
                      question={faq.question ?? ""}
                      answer={faq.answer ?? ""}
                    />
                  ))}
                </Accordion>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <AnimatedSection>
        <CTASection />
      </AnimatedSection>
    </div>
  );
}
