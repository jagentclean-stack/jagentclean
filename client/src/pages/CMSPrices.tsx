import React, { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, CircleDollarSign, Loader2, Save } from "lucide-react";

type PriceDraft = { basePrice: string; pricePerUnit: string; unit: string; promotion: string; priceNote: string; isPublished: boolean };
const textValue = (value: unknown) => value == null ? "" : String(value);
const CMS_ADMIN_ROLES = new Set(["super_admin", "admin"]);
const ADMIN_EMAILS = new Set(["jagentclean@gmail.com", "emilyku0jj@gmail.com"]);

export default function CMSPrices() {
  const { user, isAuthenticated } = useAuth();
  const canManage = Boolean((user?.role && CMS_ADMIN_ROLES.has(user.role)) || (user?.email && ADMIN_EMAILS.has(user.email)));
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.cms.services.list.useQuery(undefined, { enabled: Boolean(isAuthenticated && canManage) });
  const [drafts, setDrafts] = useState<Record<number, PriceDraft>>({});
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!services) return;
    setDrafts(Object.fromEntries(services.map((service) => [service.id, {
      basePrice: textValue(service.basePrice), pricePerUnit: textValue(service.pricePerUnit), unit: service.unit ?? "",
      promotion: service.promotion ?? "", priceNote: service.priceNote ?? "", isPublished: Boolean(service.isPublished),
    }])));
  }, [services]);

  const save = trpc.cms.services.update.useMutation({
    onSuccess: async () => { await utils.cms.services.list.invalidate(); await utils.cms.publicContent.services.invalidate(); setNotice({ type: "success", text: "價格設定已更新，公開服務頁會同步顯示。" }); },
    onError: (error) => setNotice({ type: "error", text: error.message || "儲存失敗，請稍後重試。" }),
  });
  const setDraft = (id: number, field: keyof PriceDraft, value: string | boolean) => { setDrafts((all) => ({ ...all, [id]: { ...all[id], [field]: value } })); setNotice(null); };

  if (!isAuthenticated || !canManage) return <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-600">您沒有管理服務價格的權限。</div>;
  return <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="mb-2 text-sm font-semibold tracking-[0.16em] text-[#163C72]">SERVICE PRICING</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">價格管理</h1><p className="mt-2 text-sm leading-6 text-slate-600">設定最低報價、單位計價、優惠訊息與報價備註；只有已發布服務會顯示在公開網站。</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#163C72] text-[#8CC63F]"><CircleDollarSign className="h-6 w-6" /></div></div></header>
    {notice && <div role="status" className={`flex gap-3 rounded-2xl border px-5 py-4 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}{notice.text}</div>}
    {isLoading ? <div className="grid min-h-60 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#163C72]" /></div> : services?.length ? <div className="grid gap-5 lg:grid-cols-2">{services.map((service) => { const draft = drafts[service.id]; if (!draft) return null; return <Card key={service.id} className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">{service.name}</h2><p className="mt-1 text-sm text-slate-500">/{service.slug}</p></div><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><Switch checked={draft.isPublished} onCheckedChange={(value) => setDraft(service.id, "isPublished", value)} />{draft.isPublished ? "公開" : "未公開"}</label></div><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-slate-700">最低價格（NT$）<Input inputMode="decimal" value={draft.basePrice} onChange={(e) => setDraft(service.id, "basePrice", e.target.value)} placeholder="例如 2000" /></label><label className="space-y-2 text-sm font-medium text-slate-700">單位價格（NT$）<Input inputMode="decimal" value={draft.pricePerUnit} onChange={(e) => setDraft(service.id, "pricePerUnit", e.target.value)} placeholder="例如 500" /></label><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">計價單位<Input value={draft.unit} onChange={(e) => setDraft(service.id, "unit", e.target.value)} placeholder="例如：坪、小時、組" /></label><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">優惠訊息<Input value={draft.promotion} onChange={(e) => setDraft(service.id, "promotion", e.target.value)} placeholder="例如：首次預約享九折優惠" /></label><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">報價備註<Textarea value={draft.priceNote} onChange={(e) => setDraft(service.id, "priceNote", e.target.value)} placeholder="例如：實際費用依現場狀況與服務範圍確認。" rows={3} /></label></div><div className="mt-6 flex justify-end"><Button onClick={() => save.mutate({ id: service.id, ...draft })} disabled={save.isPending} className="bg-[#163C72] text-white hover:bg-[#102f5d]"><Save className="mr-2 h-4 w-4" />{save.isPending ? "儲存中…" : "儲存此服務價格"}</Button></div></Card>; })}</div> : <Card className="rounded-3xl border-dashed p-12 text-center text-slate-600">尚無服務資料。請先至「服務管理」建立服務項目。</Card>}
  </div></div>;
}
