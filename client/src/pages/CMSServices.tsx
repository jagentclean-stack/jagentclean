import React, { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Edit2, ImageIcon, Loader2, Plus, Save, Trash2 } from "lucide-react";

type ServiceDraft = {
  name: string;
  slug: string;
  description: string;
  process: string;
  faq: string;
  icon: string;
  bannerImage: string;
  video: string;
  basePrice: string;
  pricePerUnit: string;
  unit: string;
  promotion: string;
  priceNote: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  isPublished: boolean;
};

const ADMIN_EMAILS = new Set(["jagentclean@gmail.com", "emilyku0jj@gmail.com"]);
const EDITOR_ROLES = new Set(["super_admin", "admin", "editor"]);
const blankDraft = (): ServiceDraft => ({
  name: "", slug: "", description: "", process: "", faq: "", icon: "", bannerImage: "", video: "",
  basePrice: "", pricePerUnit: "", unit: "", promotion: "", priceNote: "",
  seoTitle: "", seoDescription: "", seoKeywords: "", isPublished: true,
});
const stringValue = (value: unknown) => value == null ? "" : String(value);

export default function CMSServices() {
  const { user, isAuthenticated } = useAuth();
  const isNamedAdmin = Boolean(user?.email && ADMIN_EMAILS.has(user.email));
  const canAdminister = Boolean(isNamedAdmin || (user?.role && ["super_admin", "admin"].includes(user.role)));
  const canEdit = Boolean(isNamedAdmin || (user?.role && EDITOR_ROLES.has(user.role)));
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.cms.services.list.useQuery(undefined, { enabled: Boolean(isAuthenticated && canEdit) });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(blankDraft);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const createService = trpc.cms.services.create.useMutation({
    onSuccess: async () => {
      await utils.cms.services.list.invalidate();
      await utils.cms.publicContent.services.invalidate();
      setNotice({ type: "success", text: "服務已建立並同步至管理清單。" });
      closeDialog();
    },
    onError: (error) => setNotice({ type: "error", text: error.message || "建立服務失敗，請檢查欄位後重試。" }),
  });
  const updateService = trpc.cms.services.update.useMutation({
    onSuccess: async () => {
      await utils.cms.services.list.invalidate();
      await utils.cms.publicContent.services.invalidate();
      setNotice({ type: "success", text: "服務內容已更新，公開頁將同步反映已發布服務。" });
      closeDialog();
    },
    onError: (error) => setNotice({ type: "error", text: error.message || "更新服務失敗，請檢查欄位後重試。" }),
  });
  const deleteService = trpc.cms.services.delete.useMutation({
    onSuccess: async () => {
      await utils.cms.services.list.invalidate();
      await utils.cms.publicContent.services.invalidate();
      setNotice({ type: "success", text: "服務已刪除。" });
    },
    onError: (error) => setNotice({ type: "error", text: error.message || "刪除服務失敗。" }),
  });

  useEffect(() => {
    if (!open) setDraft(blankDraft());
  }, [open]);

  function closeDialog() {
    setEditingId(null);
    setOpen(false);
  }
  function updateDraft(field: keyof ServiceDraft, value: string | boolean) {
    setDraft((current) => ({ ...current, [field]: value }));
  }
  function openCreate() {
    setEditingId(null);
    setDraft(blankDraft());
    setOpen(true);
  }
  function openEdit(service: NonNullable<typeof services>[number]) {
    setEditingId(service.id);
    setDraft({
      name: service.name, slug: service.slug, description: stringValue(service.description), process: stringValue(service.process), faq: stringValue(service.faq),
      icon: stringValue(service.icon), bannerImage: stringValue(service.bannerImage), video: stringValue(service.video),
      basePrice: stringValue(service.basePrice), pricePerUnit: stringValue(service.pricePerUnit), unit: stringValue(service.unit),
      promotion: stringValue(service.promotion), priceNote: stringValue(service.priceNote),
      seoTitle: stringValue(service.seoTitle), seoDescription: stringValue(service.seoDescription), seoKeywords: stringValue(service.seoKeywords),
      isPublished: Boolean(service.isPublished),
    });
    setOpen(true);
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.slug.trim()) {
      setNotice({ type: "error", text: "請填寫服務名稱與 URL Slug。" });
      return;
    }
    const payload = { ...draft, name: draft.name.trim(), slug: draft.slug.trim() };
    if (editingId == null) await createService.mutateAsync(payload);
    else await updateService.mutateAsync({ id: editingId, ...payload });
  }

  if (!isAuthenticated || !canEdit) return <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-600">您沒有管理服務內容的權限。</div>;
  const pending = createService.isPending || updateService.isPending;

  return <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><p className="mb-2 text-sm font-semibold tracking-[0.16em] text-[#163C72]">SERVICE CONTENT</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">服務管理</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">管理服務介紹、清潔流程、媒體連結、價格、SEO 與公開狀態。圖片可先於媒體中心上傳，再貼入儲存網址。</p></div>{canAdminister && <Button onClick={openCreate} className="bg-[#163C72] text-white hover:bg-[#102f5d]"><Plus className="mr-2 h-4 w-4" />新增服務</Button>}</header>

    {notice && <div role="status" className={`flex gap-3 rounded-2xl border px-5 py-4 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}{notice.text}</div>}
    {isLoading ? <div className="grid min-h-60 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#163C72]" /></div> : services?.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{services.map((service) => <Card key={service.id} className="flex min-h-72 flex-col rounded-3xl border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold tracking-wide text-[#163C72]">/{service.slug}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{service.name}</h2></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${service.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{service.isPublished ? "公開中" : "未公開"}</span></div>{service.bannerImage ? <img src={service.bannerImage} alt="" className="mb-4 h-28 w-full rounded-2xl object-cover" loading="lazy" /> : <div className="mb-4 grid h-28 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ImageIcon className="h-7 w-7" /></div>}<p className="line-clamp-3 text-sm leading-6 text-slate-600">{service.description || "尚未填寫服務介紹。"}</p><div className="mt-auto flex gap-2 pt-6">{canEdit && <Button size="sm" variant="outline" onClick={() => openEdit(service)} className="flex-1"><Edit2 className="mr-1.5 h-4 w-4" />編輯</Button>}{canAdminister && <Button size="sm" variant="outline" onClick={() => deleteService.mutate({ id: service.id })} disabled={deleteService.isPending} className="text-red-700 hover:text-red-800"><Trash2 className="h-4 w-4" /><span className="sr-only">刪除 {service.name}</span></Button>}</div></Card>)}</div> : <Card className="rounded-3xl border-dashed p-12 text-center text-slate-600">尚無服務資料。{canAdminister ? <Button variant="link" onClick={openCreate}>立即建立第一項服務</Button> : ""}</Card>}
    <Dialog open={open} onOpenChange={(value) => { if (!value) closeDialog(); }}><ServiceDialog /></Dialog>
  </div></div>;

  function ServiceDialog() {
    return <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId == null ? "新增服務" : "編輯服務"}</DialogTitle><DialogDescription>填寫服務內容、媒體與 SEO 後儲存；僅公開中的服務會出現在前台。</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-6"><section className="grid gap-4 sm:grid-cols-2"><Field label="服務名稱 *"><Input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="例如：居家清潔" /></Field><Field label="URL Slug *"><Input value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} placeholder="例如：home-cleaning" /></Field><Field label="Icon URL"><Input value={draft.icon} onChange={(event) => updateDraft("icon", event.target.value)} placeholder="/manus-storage/…" /></Field><Field label="Banner 圖片 URL"><Input value={draft.bannerImage} onChange={(event) => updateDraft("bannerImage", event.target.value)} placeholder="/manus-storage/…" /></Field><Field label="影片 URL" className="sm:col-span-2"><Input value={draft.video} onChange={(event) => updateDraft("video", event.target.value)} placeholder="YouTube 或影片網址" /></Field></section><Field label="服務介紹"><Textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} rows={4} placeholder="說明服務內容與適用情境。" /></Field><Field label="服務流程"><Textarea value={draft.process} onChange={(event) => updateDraft("process", event.target.value)} rows={4} placeholder="逐步說明評估、施工與驗收流程。" /></Field><Field label="服務專屬 FAQ"><Textarea value={draft.faq} onChange={(event) => updateDraft("faq", event.target.value)} rows={4} placeholder="輸入此服務的常見問題與回答；可用換行區隔段落。" /></Field><section className="grid gap-4 sm:grid-cols-2"><Field label="最低價格（NT$）"><Input inputMode="decimal" value={draft.basePrice} onChange={(event) => updateDraft("basePrice", event.target.value)} placeholder="例如：2000" /></Field><Field label="單位價格（NT$）"><Input inputMode="decimal" value={draft.pricePerUnit} onChange={(event) => updateDraft("pricePerUnit", event.target.value)} placeholder="例如：500" /></Field><Field label="計價單位"><Input value={draft.unit} onChange={(event) => updateDraft("unit", event.target.value)} placeholder="例如：坪、小時、組" /></Field><Field label="優惠訊息"><Input value={draft.promotion} onChange={(event) => updateDraft("promotion", event.target.value)} placeholder="例如：首次預約享九折" /></Field><Field label="報價備註" className="sm:col-span-2"><Textarea value={draft.priceNote} onChange={(event) => updateDraft("priceNote", event.target.value)} rows={3} placeholder="例如：費用依現場範圍確認。" /></Field></section><section className="rounded-2xl bg-slate-50 p-4"><p className="mb-4 text-sm font-bold text-slate-800">SEO</p><div className="space-y-4"><Field label="SEO Title"><Input value={draft.seoTitle} onChange={(event) => updateDraft("seoTitle", event.target.value)} /></Field><Field label="SEO Description"><Textarea value={draft.seoDescription} onChange={(event) => updateDraft("seoDescription", event.target.value)} rows={3} /></Field><Field label="SEO Keywords"><Input value={draft.seoKeywords} onChange={(event) => updateDraft("seoKeywords", event.target.value)} placeholder="以逗號區隔" /></Field></div></section><label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800"><span><span className="block">公開服務</span><span className="mt-1 block text-xs font-normal text-slate-500">關閉後不會出現在公開服務頁。</span></span><Switch checked={draft.isPublished} onCheckedChange={(value) => updateDraft("isPublished", value)} /></label><div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="outline" onClick={closeDialog}>取消</Button><Button type="submit" disabled={pending || (editingId == null && !canAdminister)} className="bg-[#163C72] text-white hover:bg-[#102f5d]"><Save className="mr-2 h-4 w-4" />{pending ? "儲存中…" : "儲存服務"}</Button></div></form></DialogContent>;
  }
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block space-y-2 text-sm font-medium text-slate-700 ${className}`}><span>{label}</span>{children}</label>;
}
