import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, MapPin, MessageCircle, ExternalLink, ShieldCheck } from "lucide-react";

const FALLBACK_LINE_URL = "https://lin.ee/ynvoHjh";

export default function Contact() {
  const { data: settings } = trpc.cms.publicContent.siteSettings.useQuery();
  const lineUrl = settings?.lineUrl || FALLBACK_LINE_URL;
  const phone = settings?.companyPhone || "06-3584567";
  const email = settings?.companyEmail || "jagentclean@gmail.com";
  const address = settings?.companyAddress || "台南市安南區國安街45巷12號";
  const fax = settings?.companyFax || "06-3583232";
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const [contactImageFailed, setContactImageFailed] = useState(false);
  const contactImageUrl = settings?.contactImageUrl || null;
  const showContactImage = Boolean(contactImageUrl && !contactImageFailed);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container py-12 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-secondary">J-AGENT CLEANING</p>
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">聯繫我們</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            我們隨時準備好為您提供專業的清潔解決方案。請直接加入官方 LINE，由專人協助您評估需求。
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.72fr_0.9fr_1.1fr]">
          {showContactImage && (
            <aside className="overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
              <img
                src={contactImageUrl ?? undefined}
                alt="潔特務清潔專業服務團隊"
                className="h-full min-h-80 w-full object-cover"
                loading="lazy"
                onError={() => setContactImageFailed(true)}
              />
            </aside>
          )}
          {!showContactImage && (
            <aside className="flex min-h-80 flex-col justify-end rounded-3xl bg-gradient-to-br from-[#163C72] to-[#0d2851] p-8 text-white shadow-sm sm:p-10" data-testid="contact-image-fallback">
              <ShieldCheck className="h-10 w-10 text-[#8CC63F]" aria-hidden="true" />
              <p className="mt-12 text-sm font-semibold tracking-[0.16em] text-[#8CC63F]">J-AGENT CLEANING</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight">專業清潔，
                <br />值得信賴。</h2>
              <p className="mt-4 text-sm leading-6 text-white/75">以完善流程與細緻服務，守護每一處日常空間。</p>
            </aside>
          )}
          <section className="rounded-3xl bg-[#163C72] p-8 text-white shadow-xl sm:p-10">
            <MessageCircle className="h-10 w-10 text-secondary" aria-hidden="true" />
            <h2 className="mt-8 text-3xl font-bold">加入 LINE 諮詢</h2>
            <p className="mt-4 leading-7 text-white/80">
              快速傳送空間照片、服務需求與方便聯繫的時間，我們將提供合適的清潔建議與後續安排。
            </p>
            <a className="mt-8 block" href={lineUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full bg-[#8CC63F] text-[#163C72] hover:bg-[#8CC63F]/90">
                <MessageCircle className="mr-2 h-5 w-5" /> 加入 LINE 官方帳號
              </Button>
            </a>
            {settings?.lineId && <p className="mt-5 text-center text-sm text-white/75">官方帳號：{settings.lineId}</p>}
          </section>

          <section className="rounded-3xl border border-primary/10 bg-white p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-bold text-primary">聯絡資訊</h2>
            <dl className="mt-8 space-y-6">
              <div className="flex gap-4">
                <Phone className="mt-0.5 h-6 w-6 shrink-0 text-secondary" aria-hidden="true" />
                <div><dt className="font-medium text-foreground">電話</dt><dd><a href={phoneHref} className="text-muted-foreground hover:text-primary">{phone}</a></dd></div>
              </div>
              <div className="flex gap-4">
                <Mail className="mt-0.5 h-6 w-6 shrink-0 text-secondary" aria-hidden="true" />
                <div><dt className="font-medium text-foreground">電子郵件</dt><dd><a href={`mailto:${email}`} className="text-muted-foreground hover:text-primary">{email}</a></dd></div>
              </div>
              <div className="flex gap-4">
                <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-secondary" aria-hidden="true" />
                <div><dt className="font-medium text-foreground">地址</dt><dd className="text-muted-foreground">{address}</dd></div>
              </div>
              <div className="flex gap-4">
                <Phone className="mt-0.5 h-6 w-6 shrink-0 text-secondary" aria-hidden="true" />
                <div><dt className="font-medium text-foreground">傳真</dt><dd className="text-muted-foreground">{fax}</dd></div>
              </div>
            </dl>
            {settings?.googleMapEmbed ? (
              <iframe
                title="潔特務清潔所在地圖"
                src={settings.googleMapEmbed}
                className="mt-8 h-64 w-full rounded-2xl border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : settings?.googleMapUrl ? (
              <a className="mt-8 inline-flex items-center gap-2 font-medium text-primary hover:text-secondary" href={settings.googleMapUrl} target="_blank" rel="noopener noreferrer">
                在 Google 地圖開啟 <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
