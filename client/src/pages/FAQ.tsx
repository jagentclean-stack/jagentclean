import { Link } from "wouter";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import FAQItem from "@/components/FAQItem";
import { trpc } from "@/lib/trpc";

export default function FAQ() {
  const { data: faqs, isLoading } = trpc.cms.publicContent.faqs.useQuery();

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container px-4 py-12 lg:px-8">
        <AnimatedSection><h1 className="mb-8 text-center text-5xl font-bold text-primary">常見問題</h1></AnimatedSection>
        <AnimatedSection delay={100}><p className="mb-12 text-center text-xl text-muted-foreground">在這裡找到您對潔特務清潔服務的疑問解答。</p></AnimatedSection>
        <AnimatedSection delay={200}>
          {isLoading ? <div className="mx-auto h-64 w-full max-w-3xl animate-pulse rounded-2xl bg-muted" /> : faqs?.length ? (
            <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl space-y-4">{faqs.map((item) => <FAQItem key={item.id} value={`faq-${item.id}`} question={item.question} answer={item.answer || ""} />)}</Accordion>
          ) : <p className="mx-auto max-w-3xl rounded-2xl bg-muted p-8 text-center text-muted-foreground">目前尚無可公開的常見問題，歡迎直接透過 LINE 洽詢。</p>}
        </AnimatedSection>
        <AnimatedSection delay={300}><div className="mt-16 text-center"><Link href="/contact"><Button variant="default" size="lg" className="soft-shadow transition-transform duration-300 hover:scale-105">還有其他問題？聯繫我們</Button></Link></div></AnimatedSection>
      </div>
    </div>
  );
}
