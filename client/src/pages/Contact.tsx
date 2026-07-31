import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
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
          {/* Contact Form */}
          <AnimatedSection delay={200}>
            <div className="glassmorphism soft-shadow p-8 rounded-xl">
              <h2 className="text-3xl font-bold text-primary mb-6">發送訊息</h2>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-lg font-medium text-foreground mb-2">姓名</label>
                  <Input type="text" id="name" placeholder="您的姓名" className="glassmorphism" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-lg font-medium text-foreground mb-2">電子郵件</label>
                  <Input type="email" id="email" placeholder="您的電子郵件" className="glassmorphism" />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-lg font-medium text-foreground mb-2">主旨</label>
                  <Input type="text" id="subject" placeholder="訊息主旨" className="glassmorphism" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-lg font-medium text-foreground mb-2">訊息</label>
                  <Textarea id="message" placeholder="請輸入您的訊息" rows={5} className="glassmorphism" />
                </div>
                <Button type="submit" variant="default" size="lg" className="w-full soft-shadow hover:scale-105 transition-transform duration-300">
                  發送訊息
                </Button>
              </form>
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
                      <a href="tel:+886212345678" className="text-muted-foreground hover:text-secondary transition-colors duration-200">+886-2-1234-5678</a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Mail className="h-8 w-8 text-secondary" />
                    <div>
                      <p className="text-lg font-medium text-foreground">電子郵件</p>
                      <a href="mailto:info@jagentcleaning.com" className="text-muted-foreground hover:text-secondary transition-colors duration-200">info@jagentcleaning.com</a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <MapPin className="h-8 w-8 text-secondary" />
                    <div>
                      <p className="text-lg font-medium text-foreground">地址</p>
                      <p className="text-muted-foreground">台北市信義區忠孝東路五段123號</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="glassmorphism soft-shadow p-8 rounded-xl h-80 flex items-center justify-center">
                <p className="text-muted-foreground">地圖將在此處顯示</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
