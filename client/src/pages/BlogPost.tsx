import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, MessageCircle } from "lucide-react";
import { Link, useParams } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { articleTextBlocks } from "@/lib/articleContent";

function formatPublishedDate(value: Date | string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function BlogPost() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: article, isLoading, isError } = trpc.cms.publicContent.blogBySlug.useQuery(
    { slug },
    { enabled: Boolean(slug) },
  );
  const blocks = articleTextBlocks(article?.content);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container max-w-4xl px-4 py-20 lg:px-8">
          <div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
          <div className="mt-8 h-14 w-full animate-pulse rounded-2xl bg-muted" />
          <div className="mt-5 h-6 w-3/4 animate-pulse rounded-xl bg-muted" />
          <div className="mt-12 h-80 animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <section className="container max-w-3xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <BookOpen className="mx-auto h-10 w-10 text-secondary" aria-hidden="true" />
          <h1 className="mt-6 text-3xl font-bold text-primary">找不到這篇文章</h1>
          <p className="mx-auto mt-4 max-w-xl leading-8 text-muted-foreground">這篇內容可能尚未發布、已移除，或連結網址有誤。您可以回到清潔知識中心瀏覽其他實用文章。</p>
          <Link href="/blog" className="mt-8 inline-flex"><Button className="gap-2">返回清潔知識中心 <ArrowRight className="h-4 w-4" /></Button></Link>
        </section>
      </div>
    );
  }

  const publishedDate = formatPublishedDate(article.publishedAt);

  return (
    <div className="min-h-screen overflow-hidden bg-background pt-20">
      <section className="relative border-b border-border/60 bg-[radial-gradient(circle_at_10%_10%,rgba(140,198,63,0.16),transparent_26rem),linear-gradient(135deg,rgba(22,60,114,0.08),transparent_52%)]">
        <div className="container max-w-5xl px-4 py-14 lg:px-8 lg:py-20">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-4">
            <ArrowLeft className="h-4 w-4" /> 返回清潔知識中心
          </Link>
          <AnimatedSection>
            <p className="mt-10 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-secondary"><BookOpen className="h-4 w-4" /> CLEANING JOURNAL</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight text-primary md:text-6xl md:leading-[1.12]">{article.title}</h1>
            {article.excerpt && <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{article.excerpt}</p>}
            {publishedDate && <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" /> 發布於 {publishedDate}</p>}
          </AnimatedSection>
        </div>
      </section>

      <main className="container max-w-5xl px-4 py-12 lg:px-8 lg:py-20">
        {article.featuredImage && (
          <AnimatedSection>
            <figure className="overflow-hidden rounded-3xl bg-muted shadow-[0_20px_60px_rgba(22,60,114,0.14)]">
              <img src={article.featuredImage} alt={article.title} className="aspect-[16/8] h-full w-full object-cover" />
            </figure>
          </AnimatedSection>
        )}

        <AnimatedSection>
          <article className="mx-auto mt-12 max-w-3xl">
            <div className="space-y-7 text-[1.05rem] leading-9 text-slate-700 md:text-lg md:leading-9">
              {blocks.length ? blocks.map((block, index) => <p key={`${index}-${block.slice(0, 24)}`}>{block}</p>) : <p>文章內容整理中，歡迎返回清潔知識中心閱讀其他主題。</p>}
            </div>
          </article>
        </AnimatedSection>

        <AnimatedSection>
          <Card className="mx-auto mt-16 max-w-3xl overflow-hidden border-primary/10 bg-primary p-8 text-primary-foreground shadow-xl md:flex md:items-center md:justify-between md:gap-8 md:p-10">
            <div>
              <p className="text-sm font-bold tracking-[0.14em] text-secondary">NEED A CLEANING PLAN?</p>
              <h2 className="mt-3 text-2xl font-bold">需要專業人員協助嗎？</h2>
              <p className="mt-3 leading-7 text-white/80">告訴我們您的空間與清潔需求，潔特務將協助您安排合適的服務方案。</p>
            </div>
            <Link href="/contact" className="mt-7 inline-flex shrink-0 md:mt-0"><Button className="gap-2 bg-secondary text-primary hover:bg-secondary/90"><MessageCircle className="h-4 w-4" /> 加入 LINE 諮詢</Button></Link>
          </Card>
        </AnimatedSection>
      </main>
    </div>
  );
}
