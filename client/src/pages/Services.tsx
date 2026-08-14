import React from "react";
import { Link } from "wouter";
import { Building2, Home, ShieldCheck, Sparkles } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import ServiceCard from "@/components/ServiceCard";
import { trpc } from "@/lib/trpc";

const icons = [Home, Sparkles, ShieldCheck, Building2];
const money = (value: unknown) => Number(value).toLocaleString("zh-TW", { maximumFractionDigits: 2 });

export default function Services() {
  const { data: services, isLoading, isError } = trpc.cms.publicContent.services.useQuery();
  const { data: settings } = trpc.cms.publicContent.siteSettings.useQuery();
  const lineUrl = settings?.lineUrl?.trim() || "";
  return <div className="min-h-screen bg-background pt-20"><div className="container py-16 lg:py-24">
    <AnimatedSection><h1 className="text-center text-4xl font-bold tracking-tight text-[#163C72] md:text-5xl">我們的專業服務項目</h1></AnimatedSection>
    <AnimatedSection delay={100}><p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">依照您的空間、材質與服務需求，提供可客製化的專業清潔方案。</p></AnimatedSection>
    {isLoading ? <div className="py-24 text-center text-slate-500">正在載入服務項目…</div> : isError ? <div role="alert" className="py-24 text-center text-slate-600">服務資訊暫時無法載入，請稍後再試或透過 LINE 與我們聯繫。</div> : services?.length ? <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">{services.map((service, index) => <AnimatedSection key={service.id} delay={Math.min(index * 60, 300)}><ServiceCard icon={icons[index % icons.length]} title={service.name} description={service.description || "由專業團隊依現場需求提供服務規劃。"}>
      {(service.basePrice || service.pricePerUnit || service.promotion || service.priceNote) && <div className="w-full rounded-2xl bg-slate-50 p-4 text-sm"><div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[#163C72]">{service.basePrice && <span className="text-lg font-bold">NT$ {money(service.basePrice)} 起</span>}{service.pricePerUnit && <span className="font-medium">NT$ {money(service.pricePerUnit)}{service.unit ? `／${service.unit}` : ""}</span>}</div>{service.promotion && <p className="mt-2 font-semibold text-[#6d9e21]">{service.promotion}</p>}{service.priceNote && <p className="mt-2 leading-6 text-slate-500">{service.priceNote}</p>}</div>}
      {(service.faqs?.length ?? 0) > 0 && <section aria-label={`${service.name} 常見問題`} className="w-full space-y-2"><h2 className="text-sm font-semibold text-[#163C72]">此服務的常見問題</h2>{service.faqs?.map((faq) => <details key={faq.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"><summary className="cursor-pointer font-semibold text-[#163C72]">{faq.question}</summary><p className="mt-3 whitespace-pre-line leading-6 text-slate-600">{faq.answer}</p></details>)}</section>}
    </ServiceCard></AnimatedSection>)}</div> : <div className="py-24 text-center text-slate-500">服務內容即將更新，歡迎先透過 LINE 與我們諮詢。</div>}
    <AnimatedSection><div className="mt-16 text-center">{lineUrl && <a href={lineUrl} target="_blank" rel="noopener noreferrer"><Button size="lg" className="bg-[#8CC63F] px-8 text-[#163C72] hover:bg-[#7bb430]">透過 LINE 取得免費報價</Button></a>}<Link href="/contact"><Button size="lg" variant="outline" className={lineUrl ? "ml-3 border-[#163C72] text-[#163C72]" : "border-[#163C72] text-[#163C72]"}>聯絡我們</Button></Link></div></AnimatedSection>
  </div></div>;
}
