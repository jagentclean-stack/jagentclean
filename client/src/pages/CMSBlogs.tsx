import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Calendar, CheckCircle2, Edit2, Eye, EyeOff, Image, Loader2, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().trim().min(1, "文章標題必填").max(255),
  slug: z.string().trim().min(1, "URL Slug 必填").max(255),
  excerpt: z.string().trim().max(500, "摘要不得超過 500 字元"),
  content: z.string().max(100_000, "文章內容過長"),
  featuredImage: z.string().trim().max(500, "封面圖片網址過長"),
  categoryId: z.string(),
  isPublished: z.boolean(),
  publishedAt: z.string(),
  scheduledAt: z.string(),
  seoTitle: z.string().trim().max(255, "SEO 標題不得超過 255 字元"),
  seoDescription: z.string().trim().max(500, "SEO 描述不得超過 500 字元"),
  seoKeywords: z.string().trim().max(500, "SEO 關鍵字不得超過 500 字元"),
});

type BlogDraft = z.infer<typeof blogSchema>;
type Notice = { type: "success" | "error"; text: string } | null;

const contentRoles = ["super_admin", "admin", "editor", "marketing"];

const emptyDraft = (): BlogDraft => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  categoryId: "",
  isPublished: false,
  publishedAt: "",
  scheduledAt: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
});

const toDateTimeLocal = (value: unknown) => {
  if (!value) return "";
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

const parseDateTime = (value: string) => value ? new Date(value) : null;

export default function CMSBlogs() {
  const { user, isAuthenticated } = useAuth();
  const allowed = isAuthenticated && contentRoles.includes(user?.role || "");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<BlogDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(null);

  const { data: blogs = [], isLoading, refetch } = trpc.cms.blogs.list.useQuery(undefined, { enabled: allowed });
  const { data: categories = [] } = trpc.cms.categories.list.useQuery({ type: "blog" }, { enabled: allowed });

  const clearDialog = () => {
    setOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
    setErrors({});
  };

  const createMutation = trpc.cms.blogs.create.useMutation({
    onSuccess: () => {
      setNotice({ type: "success", text: "文章已建立。" });
      clearDialog();
      void refetch();
    },
    onError: () => setNotice({ type: "error", text: "儲存失敗，請確認欄位內容或稍後再試。" }),
  });
  const updateMutation = trpc.cms.blogs.update.useMutation({
    onSuccess: () => {
      setNotice({ type: "success", text: "文章已更新。" });
      clearDialog();
      void refetch();
    },
    onError: () => setNotice({ type: "error", text: "更新失敗，請稍後再試。" }),
  });
  const deleteMutation = trpc.cms.blogs.delete.useMutation({
    onSuccess: () => {
      setNotice({ type: "success", text: "文章已刪除。" });
      void refetch();
    },
    onError: () => setNotice({ type: "error", text: "刪除失敗，請稍後再試。" }),
  });

  const updateDraft = <K extends keyof BlogDraft>(key: K, value: BlogDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const openCreate = () => {
    setNotice(null);
    setEditingId(null);
    setDraft(emptyDraft());
    setErrors({});
    setOpen(true);
  };

  const openEdit = (blog: any) => {
    setNotice(null);
    setEditingId(blog.id);
    setDraft({
      title: blog.title ?? "",
      slug: blog.slug ?? "",
      excerpt: blog.excerpt ?? "",
      content: blog.content ?? "",
      featuredImage: blog.featuredImage ?? "",
      categoryId: blog.categoryId ? String(blog.categoryId) : "",
      isPublished: Boolean(blog.isPublished),
      publishedAt: toDateTimeLocal(blog.publishedAt),
      scheduledAt: toDateTimeLocal(blog.scheduledAt),
      seoTitle: blog.seoTitle ?? "",
      seoDescription: blog.seoDescription ?? "",
      seoKeywords: blog.seoKeywords ?? "",
    });
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = blogSchema.safeParse(draft);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => { if (issue.path[0]) nextErrors[String(issue.path[0])] = issue.message; });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setNotice(null);
    const payload = {
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      excerpt: draft.excerpt.trim() || null,
      content: draft.content || null,
      featuredImage: draft.featuredImage.trim() || null,
      categoryId: draft.categoryId ? Number(draft.categoryId) : null,
      isPublished: draft.isPublished,
      publishedAt: parseDateTime(draft.publishedAt),
      scheduledAt: parseDateTime(draft.scheduledAt),
      seoTitle: draft.seoTitle.trim() || null,
      seoDescription: draft.seoDescription.trim() || null,
      seoKeywords: draft.seoKeywords.trim() || null,
    };

    try {
      if (editingId === null) await createMutation.mutateAsync(payload as any);
      else await updateMutation.mutateAsync({ id: editingId, ...payload } as any);
    } catch {
      // 由 mutation 的 onError 顯示可讀的錯誤提示，表單資料保持不變供使用者修正或重試。
    }
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("確定要永久刪除這篇文章嗎？")) return;
    setNotice(null);
    deleteMutation.mutate({ id });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  if (!allowed) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-slate-600">您沒有權限存取文章管理。</p></div>;

  return <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div><p className="mb-2 text-sm font-semibold tracking-[0.16em] text-[#163C72]">CONTENT LIBRARY</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">文章管理</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">管理可公開的清潔知識文章、封面圖片、分類、排程發佈及各頁 SEO 資訊。</p></div>
      <Button type="button" onClick={openCreate} className="bg-[#163C72] text-white hover:bg-[#102f5d]"><Plus className="mr-2 h-4 w-4" />新增文章</Button>
    </header>

    {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`flex gap-3 rounded-2xl border px-5 py-4 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}{notice.text}</div>}

    {isLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#163C72]" /></div> : blogs.length ? <div className="grid gap-5 lg:grid-cols-2">{blogs.map((blog: any) => <Card key={blog.id} className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm"><div className="flex min-h-52 flex-col p-6"><div className="mb-4 flex items-start justify-between gap-4"><div className="min-w-0"><div className="mb-2 flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${blog.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{blog.isPublished ? "公開中" : "草稿"}</span>{blog.scheduledAt && new Date(blog.scheduledAt) > new Date() && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">已排程</span>}</div><h2 className="line-clamp-2 text-xl font-bold text-slate-900">{blog.title}</h2><p className="mt-1 truncate text-xs font-semibold tracking-wide text-[#163C72]">/{blog.slug}</p></div>{blog.isPublished ? <Eye className="h-5 w-5 shrink-0 text-emerald-600" /> : <EyeOff className="h-5 w-5 shrink-0 text-slate-400" />}</div>
        {blog.excerpt && <p className="line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{blog.excerpt}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="flex items-center gap-1.5 text-xs text-slate-500"><Calendar className="h-4 w-4" />{blog.publishedAt ? `發布：${new Date(blog.publishedAt).toLocaleDateString("zh-TW")}` : "尚未設定發布日期"}</p><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => openEdit(blog)}><Edit2 className="mr-1 h-4 w-4" />編輯</Button><Button type="button" variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(blog.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /><span className="sr-only">刪除 {blog.title}</span></Button></div></div></div></Card>)}</div> : <Card className="rounded-3xl border-dashed border-slate-300 bg-white p-12 text-center"><Image className="mx-auto mb-4 h-10 w-10 text-slate-400" /><h2 className="text-xl font-bold text-slate-900">尚無文章</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">建立第一篇文章，開始累積可管理、可排程發佈的 SEO 內容。</p><Button type="button" className="mt-6 bg-[#163C72] text-white hover:bg-[#102f5d]" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />新增第一篇文章</Button></Card>}

    <Dialog open={open} onOpenChange={(value) => { if (!value) clearDialog(); }}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId === null ? "新增文章" : "編輯文章"}</DialogTitle><DialogDescription>可先建立草稿；勾選公開後，再以排程日期控制文章何時出現在公開網站。</DialogDescription></DialogHeader>{notice?.type === "error" && <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"><AlertCircle className="h-5 w-5 shrink-0" />{notice.text}</div>}<form onSubmit={handleSubmit} className="space-y-6"><section className="grid gap-5 md:grid-cols-2"><Field label="文章標題 *" error={errors.title}><Input id="title" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="例如：浴室清潔的最佳實踐" /></Field><Field label="URL Slug *" error={errors.slug}><Input id="slug" value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} placeholder="bathroom-cleaning-best-practices" /></Field><Field label="文章分類"><select id="categoryId" value={draft.categoryId} onChange={(event) => updateDraft("categoryId", event.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"><option value="">未分類</option>{categories.map((category: any) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}</select></Field><Field label="封面圖片網址" error={errors.featuredImage}><Input id="featuredImage" value={draft.featuredImage} onChange={(event) => updateDraft("featuredImage", event.target.value)} placeholder="/manus-storage/article-cover.webp" /></Field></section><Field label="文章摘要" hint="最多 500 字元" error={errors.excerpt}><Textarea id="excerpt" value={draft.excerpt} onChange={(event) => updateDraft("excerpt", event.target.value)} rows={3} placeholder="用一段精簡文字說明文章重點。" /></Field><Field label="文章內容" error={errors.content}><Textarea id="content" value={draft.content} onChange={(event) => updateDraft("content", event.target.value)} rows={12} placeholder="可輸入文章正文（支援既有網站的文字或 HTML 內容）。" /></Field><section className="rounded-2xl border border-slate-200 p-5"><h3 className="font-semibold text-slate-900">發佈設定</h3><div className="mt-4 grid gap-5 md:grid-cols-2"><Field label="正式發布時間"><Input id="publishedAt" type="datetime-local" value={draft.publishedAt} onChange={(event) => updateDraft("publishedAt", event.target.value)} /></Field><Field label="排程公開時間"><Input id="scheduledAt" type="datetime-local" value={draft.scheduledAt} onChange={(event) => updateDraft("scheduledAt", event.target.value)} /></Field></div><label className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"><span><span className="block">公開文章</span><span className="mt-1 block text-xs font-normal text-slate-500">關閉後文章僅在 CMS 保留草稿。</span></span><Switch aria-label="公開文章" checked={draft.isPublished} onCheckedChange={(value) => updateDraft("isPublished", value)} /></label></section><section className="rounded-2xl border border-slate-200 p-5"><h3 className="font-semibold text-slate-900">SEO 設定</h3><p className="mt-1 text-xs leading-5 text-slate-500">未填寫時，公開頁會採用文章標題與摘要作為備援。</p><div className="mt-4 grid gap-5"><Field label="SEO 標題" error={errors.seoTitle}><Input id="seoTitle" value={draft.seoTitle} onChange={(event) => updateDraft("seoTitle", event.target.value)} placeholder="建議 50–60 字元" /></Field><Field label="SEO 描述" error={errors.seoDescription}><Textarea id="seoDescription" value={draft.seoDescription} onChange={(event) => updateDraft("seoDescription", event.target.value)} rows={3} placeholder="建議 120–160 字元" /></Field><Field label="SEO 關鍵字" error={errors.seoKeywords}><Input id="seoKeywords" value={draft.seoKeywords} onChange={(event) => updateDraft("seoKeywords", event.target.value)} placeholder="以逗號分隔，例如：浴室清潔, 台南清潔" /></Field></div></section><div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="outline" onClick={clearDialog}>取消</Button><Button type="submit" disabled={saving} className="bg-[#163C72] text-white hover:bg-[#102f5d]">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId === null ? "建立文章" : "儲存文章"}</Button></div></form></DialogContent></Dialog>
  </div></div>;
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  const id = React.isValidElement<{ id?: string }>(children) ? children.props.id : undefined;
  return <div><div className="mb-1.5 flex items-center justify-between gap-3"><label htmlFor={id} className="text-sm font-medium text-slate-800">{label}</label>{hint && <span className="text-xs text-slate-500">{hint}</span>}</div>{children}{error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}</div>;
}
