import React, { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Calendar, CheckCircle2, Edit2, ImageIcon, Loader2, MapPin, Plus, Save, Trash2 } from "lucide-react";

type CaseDraft = {
  title: string;
  slug: string;
  address: string;
  serviceId: string;
  constructionDate: string;
  constructionTime: string;
  beforeImages: string;
  afterImages: string;
  video: string;
  testimonial: string;
  googleReview: string;
  tags: string;
  categoryId: string;
  order: string;
  isPublished: boolean;
};

const ADMIN_EMAILS = new Set(["jagentclean@gmail.com", "emilyku0jj@gmail.com"]);
const EDITOR_ROLES = new Set(["super_admin", "admin", "editor"]);

const blankDraft = (): CaseDraft => ({
  title: "", slug: "", address: "", serviceId: "", constructionDate: "", constructionTime: "",
  beforeImages: "", afterImages: "", video: "", testimonial: "", googleReview: "", tags: "",
  categoryId: "", order: "0", isPublished: true,
});

const stringValue = (value: unknown) => value == null ? "" : String(value);
const stringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const commaSeparated = (value: unknown) => stringArray(value).join(", ");
const parseCommaList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const optionalNumber = (value: string) => value.trim() ? Number(value) : null;
const dateInputValue = (value: unknown) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export default function CMSCases() {
  const { user, isAuthenticated } = useAuth();
  const isNamedAdmin = Boolean(user?.email && ADMIN_EMAILS.has(user.email));
  const canEdit = Boolean(isNamedAdmin || (user?.role && EDITOR_ROLES.has(user.role)));
  const canDelete = Boolean(isNamedAdmin || (user?.role && ["super_admin", "admin"].includes(user.role)));
  const utils = trpc.useUtils();
  const { data: cases, isLoading } = trpc.cms.cases.list.useQuery(undefined, { enabled: Boolean(isAuthenticated && canEdit) });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CaseDraft>(blankDraft);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refreshCases = async () => {
    await utils.cms.cases.list.invalidate();
    await utils.cms.publicContent.cases.invalidate();
  };
  const createCase = trpc.cms.cases.create.useMutation({
    onSuccess: async () => {
      await refreshCases();
      closeDialog();
      setNotice({ type: "success", text: "案例已建立；公開狀態已同步更新。" });
    },
    onError: (error) => setNotice({ type: "error", text: error.message || "建立案例失敗，請檢查欄位後重試。" }),
  });
  const updateCase = trpc.cms.cases.update.useMutation({
    onSuccess: async () => {
      await refreshCases();
      closeDialog();
      setNotice({ type: "success", text: "案例內容已更新；已發布案例會同步反映於前台。" });
    },
    onError: (error) => setNotice({ type: "error", text: error.message || "更新案例失敗，請檢查欄位後重試。" }),
  });
  const deleteCase = trpc.cms.cases.delete.useMutation({
    onSuccess: async () => {
      await refreshCases();
      setNotice({ type: "success", text: "案例已刪除。" });
    },
    onError: (error) => setNotice({ type: "error", text: error.message || "刪除案例失敗。" }),
  });

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setDraft(blankDraft());
    }
  }, [open]);

  function closeDialog() {
    setOpen(false);
    setEditingId(null);
  }
  function updateDraft(field: keyof CaseDraft, value: string | boolean) {
    setDraft((current) => ({ ...current, [field]: value }));
  }
  function openCreate() {
    setEditingId(null);
    setDraft(blankDraft());
    setOpen(true);
  }
  function openEdit(caseItem: NonNullable<typeof cases>[number]) {
    setEditingId(caseItem.id);
    setDraft({
      title: caseItem.title,
      slug: caseItem.slug,
      address: stringValue(caseItem.address),
      serviceId: stringValue(caseItem.serviceId),
      constructionDate: dateInputValue(caseItem.constructionDate),
      constructionTime: stringValue(caseItem.constructionTime),
      beforeImages: commaSeparated(caseItem.beforeImages),
      afterImages: commaSeparated(caseItem.afterImages),
      video: stringValue(caseItem.video),
      testimonial: stringValue(caseItem.testimonial),
      googleReview: stringValue(caseItem.googleReview),
      tags: commaSeparated(caseItem.tags),
      categoryId: stringValue(caseItem.categoryId),
      order: stringValue(caseItem.order ?? 0),
      isPublished: Boolean(caseItem.isPublished),
    });
    setOpen(true);
  }
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.slug.trim()) {
      setNotice({ type: "error", text: "請填寫案例標題與 URL Slug。" });
      return;
    }
    const constructionDate = draft.constructionDate ? new Date(`${draft.constructionDate}T00:00:00`) : null;
    if (constructionDate && Number.isNaN(constructionDate.getTime())) {
      setNotice({ type: "error", text: "施工日期格式不正確。" });
      return;
    }
    const payload = {
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      address: draft.address.trim(),
      serviceId: optionalNumber(draft.serviceId),
      constructionDate,
      constructionTime: draft.constructionTime.trim(),
      beforeImages: parseCommaList(draft.beforeImages),
      afterImages: parseCommaList(draft.afterImages),
      video: draft.video.trim(),
      testimonial: draft.testimonial.trim(),
      googleReview: draft.googleReview.trim(),
      tags: parseCommaList(draft.tags),
      categoryId: optionalNumber(draft.categoryId),
      order: Number(draft.order || 0),
      isPublished: draft.isPublished,
    };
    if (!Number.isInteger(payload.order) || payload.order < 0) {
      setNotice({ type: "error", text: "排序必須為 0 或以上的整數。" });
      return;
    }
    try {
      if (editingId == null) await createCase.mutateAsync(payload);
      else await updateCase.mutateAsync({ id: editingId, ...payload });
    } catch {
      // onError 已將可讀錯誤訊息呈現在頁面上。
    }
  }

  if (!isAuthenticated || !canEdit) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-600">您沒有管理案例內容的權限。</div>;
  }

  const pending = createCase.isPending || updateCase.isPending;
  return <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div><p className="mb-2 text-sm font-semibold tracking-[0.16em] text-[#163C72]">CASE STUDIES</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">案例管理</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">集中管理施工資訊、Before／After 圖片、影片、心得、Google 評論、分類、標籤、排序及公開狀態。</p></div>
      <Button onClick={openCreate} className="bg-[#163C72] text-white hover:bg-[#102f5d]"><Plus className="mr-2 h-4 w-4" />新增案例</Button>
    </header>

    {notice && <div role="status" className={`flex gap-3 rounded-2xl border px-5 py-4 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}{notice.text}</div>}

    {isLoading ? <div className="grid min-h-60 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#163C72]" /></div> : cases?.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{cases.map((caseItem) => {
      const preview = stringArray(caseItem.afterImages)[0] || stringArray(caseItem.beforeImages)[0];
      return <Card key={caseItem.id} className="flex min-h-80 flex-col overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
        {preview ? <img src={preview} alt="" className="h-44 w-full object-cover" loading="lazy" /> : <div className="grid h-44 place-items-center bg-slate-100 text-slate-400"><ImageIcon className="h-8 w-8" /></div>}
        <div className="flex flex-1 flex-col p-6"><div className="mb-4 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold tracking-wide text-[#163C72]">/{caseItem.slug}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{caseItem.title}</h2></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${caseItem.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{caseItem.isPublished ? "公開中" : "草稿"}</span></div>
          {caseItem.address && <p className="mb-2 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0" />{caseItem.address}</p>}
          {caseItem.constructionDate && <p className="mb-3 flex items-center gap-1.5 text-sm text-slate-600"><Calendar className="h-4 w-4 shrink-0" />{new Date(caseItem.constructionDate).toLocaleDateString("zh-TW")}</p>}
          {caseItem.testimonial && <p className="line-clamp-3 text-sm leading-6 text-slate-600">{caseItem.testimonial}</p>}
          <div className="mt-auto flex gap-2 pt-6"><Button size="sm" variant="outline" onClick={() => openEdit(caseItem)} className="flex-1"><Edit2 className="mr-1.5 h-4 w-4" />編輯</Button>{canDelete && <Button size="sm" variant="outline" onClick={() => deleteCase.mutate({ id: caseItem.id })} disabled={deleteCase.isPending} className="text-red-700 hover:text-red-800"><Trash2 className="h-4 w-4" /><span className="sr-only">刪除 {caseItem.title}</span></Button>}</div>
        </div>
      </Card>;
    })}</div> : <Card className="rounded-3xl border-dashed p-12 text-center text-slate-600">尚無案例資料。<Button variant="link" onClick={openCreate}>立即建立第一個案例</Button></Card>}

    <Dialog open={open} onOpenChange={(value) => { if (!value) closeDialog(); }}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId == null ? "新增案例" : "編輯案例"}</DialogTitle><DialogDescription>Before／After 圖片、標籤可用逗號分隔；僅公開中的案例會出現在前台案例頁。</DialogDescription></DialogHeader>{notice?.type === "error" && <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"><AlertCircle className="h-5 w-5 shrink-0" />{notice.text}</div>}<form onSubmit={handleSubmit} className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2"><Field label="案例標題 *"><Input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="例如：浴室除霉案例" /></Field><Field label="URL Slug *"><Input value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} placeholder="例如：bathroom-mold-removal" /></Field><Field label="施工地址"><Input value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} placeholder="例如：台南市安南區" /></Field><Field label="服務 ID"><Input inputMode="numeric" value={draft.serviceId} onChange={(event) => updateDraft("serviceId", event.target.value)} placeholder="選填，例如：1" /></Field><Field label="施工日期"><Input type="date" value={draft.constructionDate} onChange={(event) => updateDraft("constructionDate", event.target.value)} /></Field><Field label="施工時間／工期"><Input value={draft.constructionTime} onChange={(event) => updateDraft("constructionTime", event.target.value)} placeholder="例如：4 小時" /></Field></section>
      <section className="grid gap-4 sm:grid-cols-2"><Field label="Before 圖片 URL"><Textarea value={draft.beforeImages} onChange={(event) => updateDraft("beforeImages", event.target.value)} rows={3} placeholder="多張請用逗號分隔，例如：/manus-storage/before-1.webp, /manus-storage/before-2.webp" /></Field><Field label="After 圖片 URL"><Textarea value={draft.afterImages} onChange={(event) => updateDraft("afterImages", event.target.value)} rows={3} placeholder="多張請用逗號分隔，例如：/manus-storage/after-1.webp, /manus-storage/after-2.webp" /></Field><Field label="影片 URL" className="sm:col-span-2"><Input value={draft.video} onChange={(event) => updateDraft("video", event.target.value)} placeholder="YouTube 或影片網址" /></Field></section>
      <Field label="客戶心得／案例說明"><Textarea value={draft.testimonial} onChange={(event) => updateDraft("testimonial", event.target.value)} rows={5} placeholder="說明施工前後的情況、處理方式及客戶回饋。" /></Field>
      <section className="grid gap-4 sm:grid-cols-2"><Field label="Google 評論連結或摘要"><Input value={draft.googleReview} onChange={(event) => updateDraft("googleReview", event.target.value)} placeholder="https://… 或已授權引用摘要" /></Field><Field label="標籤"><Input value={draft.tags} onChange={(event) => updateDraft("tags", event.target.value)} placeholder="例如：浴室, 除霉, 居家清潔" /></Field><Field label="案例分類 ID"><Input inputMode="numeric" value={draft.categoryId} onChange={(event) => updateDraft("categoryId", event.target.value)} placeholder="選填，例如：1" /></Field><Field label="排序"><Input inputMode="numeric" value={draft.order} onChange={(event) => updateDraft("order", event.target.value)} placeholder="0" /></Field></section>
      <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800"><span><span className="block">公開案例</span><span className="mt-1 block text-xs font-normal text-slate-500">關閉後案例不會出現在公開案例頁。</span></span><Switch aria-label="公開案例" checked={draft.isPublished} onCheckedChange={(value) => updateDraft("isPublished", value)} /></label>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="outline" onClick={closeDialog}>取消</Button><Button type="submit" disabled={pending} className="bg-[#163C72] text-white hover:bg-[#102f5d]"><Save className="mr-2 h-4 w-4" />{pending ? "儲存中…" : "儲存案例"}</Button></div>
    </form></DialogContent></Dialog>
  </div></div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block space-y-2 text-sm font-medium text-slate-700 ${className}`}><span>{label}</span>{children}</label>;
}
