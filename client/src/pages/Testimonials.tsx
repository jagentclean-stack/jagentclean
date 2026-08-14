import React from "react";
import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import TestimonialCard from "@/components/TestimonialCard";
import { trpc } from "@/lib/trpc";

export default function Testimonials() {
  const { data: homepageContent, isLoading, isError } = trpc.cms.publicContent.homepage.useQuery();
  const { data: settings } = trpc.cms.publicContent.siteSettings.useQuery();
  const reviews = homepageContent?.reviews ?? [];
  const siteName = settings?.siteName?.trim() || "";

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container px-4 py-12 lg:px-8">
        <AnimatedSection>
          <h1 className="mb-8 text-center text-5xl font-bold text-primary">客戶回饋</h1>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <p className="mb-12 text-center text-xl text-muted-foreground">
            {siteName ? `查看 ${siteName} 已公開的客戶服務回饋。` : "查看已公開的客戶服務回饋。"}
          </p>
        </AnimatedSection>

        {isLoading ? (
          <p className="py-20 text-center text-muted-foreground">正在載入客戶回饋…</p>
        ) : isError ? (
          <p role="alert" className="py-20 text-center text-muted-foreground">客戶回饋暫時無法載入，請稍後再試。</p>
        ) : reviews.length > 0 ? (
          <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, index) => (
              <AnimatedSection key={review.id} delay={Math.min(index * 100, 300)}>
                <TestimonialCard
                  name={review.name || "匿名客戶"}
                  title="客戶回饋"
                  quote={review.content || ""}
                  avatarSrc={review.avatar || undefined}
                />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-muted-foreground" data-testid="reviews-empty">目前尚無公開的客戶回饋。</p>
        )}

        <AnimatedSection>
          <div className="mt-16 text-center">
            <Link href="/contact">
              <Button variant="default" size="lg" className="soft-shadow transition-transform duration-300 hover:scale-105">
                立即預約免費諮詢
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
