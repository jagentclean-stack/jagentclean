import { Link } from "wouter";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function firstImage(images: unknown): string | null {
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
}

export default function Cases() {
  const { data: cases, isLoading } = trpc.cms.publicContent.cases.useQuery();

  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="container px-4 py-16 lg:px-8 lg:py-24">
        <AnimatedSection>
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold tracking-[0.2em] text-secondary"><Sparkles className="h-4 w-4" /> CASE STUDIES</p>
          <h1 className="mx-auto max-w-3xl text-center text-4xl font-bold tracking-tight text-primary md:text-6xl">清潔案例</h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">從施工細節到完成成果，了解潔特務如何為不同空間規劃專業清潔方案。</p>
        </AnimatedSection>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 pt-14 md:grid-cols-2 lg:grid-cols-3" aria-label="載入案例中">
            {[0, 1, 2].map((item) => <div key={item} className="h-80 animate-pulse rounded-3xl bg-muted" />)}
          </div>
        ) : cases?.length ? (
          <div className="grid grid-cols-1 gap-6 pt-14 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((item) => {
              const image = firstImage(item.afterImages) ?? firstImage(item.beforeImages);
              return (
                <AnimatedSection key={item.id}>
                  <Card className="group h-full overflow-hidden border-border/70 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      {image ? <img src={image} alt={`${item.title}施工成果`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">尚未提供案例圖片</div>}
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-primary">{item.title}</h2>
                      {item.address && <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><MapPin className="mt-1 h-4 w-4 shrink-0 text-secondary" />{item.address}</p>}
                      {item.testimonial && <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.testimonial}</p>}
                    </div>
                  </Card>
                </AnimatedSection>
              );
            })}
          </div>
        ) : (
          <Card className="mx-auto mt-14 max-w-2xl p-10 text-center"><p className="text-lg font-semibold text-primary">案例內容即將上線</p><p className="mt-3 text-sm leading-6 text-muted-foreground">我們正在整理更多專業清潔成果，歡迎先透過 LINE 與我們討論您的空間需求。</p></Card>
        )}

        <div className="mt-16 text-center"><Link href="/contact"><Button size="lg" className="gap-2">與我們討論您的清潔需求 <ArrowRight className="h-4 w-4" /></Button></Link></div>
      </section>
    </div>
  );
}
