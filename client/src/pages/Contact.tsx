import { useState } from "react";
import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 發送郵件到 jagentclean@gmail.com
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "jagentclean@gmail.com",
          from: formData.email,
          subject: `潔特務清潔聯繫表單：${formData.subject}`,
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      if (response.ok) {
        toast.success("訊息已成功發送！我們將盡快回覆您。");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error("發送失敗，請稍後重試。");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("發送失敗，請稍後重試。");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-lg font-medium text-foreground mb-2">姓名</label>
                  <Input
                    type="text"
                    id="name"
                    placeholder="您的姓名"
                    className="glassmorphism"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-lg font-medium text-foreground mb-2">電子郵件</label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="您的電子郵件"
                    className="glassmorphism"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-lg font-medium text-foreground mb-2">主旨</label>
                  <Input
                    type="text"
                    id="subject"
                    placeholder="訊息主旨"
                    className="glassmorphism"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-lg font-medium text-foreground mb-2">訊息</label>
                  <Textarea
                    id="message"
                    placeholder="請輸入您的訊息"
                    rows={5}
                    className="glassmorphism"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full soft-shadow hover:scale-105 transition-transform duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "發送中..." : "發送訊息"}
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
