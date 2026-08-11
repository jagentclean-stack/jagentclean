import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export default function Contact() {
  const lineUrl = "https://lin.ee/ynvoHjh";

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <AnimatedSection>
          <h1 className="text-5xl font-bold text-center text-primary mb-8">
            聯繫我們
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <p className="text-xl text-center text-muted-foreground mb-12">
            我們隨時準備好為您提供專業的清潔解決方案。
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* LINE Consultation */}
          <AnimatedSection delay={200}>
            <div className="glassmorphism soft-shadow p-8 rounded-xl h-full flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-primary mb-6">加 LINE 諮詢</h2>
              <p className="text-lg text-muted-foreground mb-8">
                掃描下方二維碼或點擊按鈕，直接加入我們的 LINE 官方帳號，獲得即時的專業諮詢服務。
              </p>
              <a href={lineUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="w-full soft-shadow hover:scale-105 transition-transform duration-300 bg-[#00B900] hover:bg-[#00A000] text-white"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  加入 LINE 官方帳號
                </Button>
              </a>
              <p className="text-sm text-muted-foreground mt-6 text-center">
                官方帳號：@093oooek
              </p>
            </div>
          </AnimatedSection>

          {/* Contact Info */}
          <AnimatedSection delay={300}>
            <div className="space-y-8">
              <div className="glassmorphism soft-shadow p-8 rounded-xl">
                <h2 className="text-3xl font-bold text-primary mb-6">聯絡資訊</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Phone className="h-8 w-8 text-secondary" />
                    <div>
                      <p className="text-lg font-medium text-foreground">電話</p>
                      <a href="tel:06-3584567" className="text-muted-foreground hover:text-secondary transition-colors duration-200">06-3584567</a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Mail className="h-8 w-8 text-secondary" />
                    <div>
                      <p className="text-lg font-medium text-foreground">電子郵件</p>
                      <a href="mailto:jagentclean@gmail.com" className="text-muted-foreground hover:text-secondary transition-colors duration-200">jagentclean@gmail.com</a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <MapPin className="h-8 w-8 text-secondary" />
                    <div>
                      <p className="text-lg font-medium text-foreground">地址</p>
                      <p className="text-muted-foreground">台南市安南區國安街45巷12號</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Phone className="h-8 w-8 text-secondary" />
                    <div>
                      <p className="text-lg font-medium text-foreground">傳真</p>
                      <p className="text-muted-foreground">06-3583232</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Map */}
              <div className="glassmorphism soft-shadow p-8 rounded-xl h-80 overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.7851234567!2d120.16!3d25.03!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x346e7c1234567%3A0x1234567890abcdef!2z5aGU57iE5qW85a6k!5e0!3m2!1szh-TW!2stw!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
