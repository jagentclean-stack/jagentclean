import { Link } from "wouter";
import { ArrowRight, BookOpen } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function excerpt(content: string | null, fallback: string | null) {
  const text = fallback || content?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "";
  return text.length > 150 ? `${text.slice(0, 150)}…` : text;
}

export default function Blog() {
  const { data: blogs, isLoading } = trpc.cms.publicContent.blogs.useQuery();

  return (
    <div className="min-h-screen bg-background pt-20">
      <section className="container px-4 py-16 lg:px-8 lg:py-24">
        <AnimatedSection>
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold tracking-[0.2em] text-secondary"><BookOpen className="h-4 w-4" /> CLEANING JOURNAL</p>
          <h1 className="mx-auto max-w-3xl text-center text-4xl font-bold tracking-tight text-primary md:text-6xl">清潔知識中心</h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">掌握居家與商業空間的清潔知識，讓每一個日常決策更安心、更有效率。</p>
        </AnimatedSection>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 pt-14 md:grid-cols-2 lg:grid-cols-3" aria-label="載入文章中">{[0, 1, 2].map((item) => <div key={item} className="h-96 animate-pulse rounded-3xl bg-muted" />)}</div>
        ) : blogs?.length ? (
          <div className="grid grid-cols-1 gap-6 pt-14 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((item) => (
              <AnimatedSection key={item.id}>
                <Link href={`/blog/${item.slug}`} className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-4">
                  <Card className="flex h-full flex-col overflow-hidden border-border/70 bg-card shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">{item.featuredImage ? <img src={item.featuredImage} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">清潔知識文章</div>}</div>
                    <div className="flex flex-1 flex-col p-6"><h2 className="text-xl font-bold text-primary">{item.title}</h2><p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{excerpt(item.content, item.excerpt) || "閱讀潔特務整理的專業清潔建議。"}</p>{item.publishedAt && <p className="mt-5 text-xs text-muted-foreground">{new Date(item.publishedAt).toLocaleDateString("zh-TW")}</p>}<span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary">閱讀全文 <ArrowRight className="h-4 w-4" /></span></div>
                  </Card>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <Card className="mx-auto mt-14 max-w-2xl p-10 text-center"><p className="text-lg font-semibold text-primary">文章內容即將上線</p><p className="mt-3 text-sm leading-6 text-muted-foreground">我們正持續整理清潔保養與空間管理知識，歡迎稍後再回來閱讀。</p></Card>
        )}

        <div className="mt-16 text-center"><Link href="/contact"><Button size="lg" variant="outline" className="gap-2">需要個人化建議？直接加入 LINE <ArrowRight className="h-4 w-4" /></Button></Link></div>
      </section>
    </div>
  );
}
