import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Edit2, Eye, EyeOff, FolderCog, Loader2, Plus, Trash2 } from "lucide-react";

type FaqForm = { question: string; answer: string; serviceId: number | null; categoryId: number | null; order: number; isVisible: boolean };
const emptyForm: FaqForm = { question: "", answer: "", serviceId: null, categoryId: null, order: 0, isVisible: true };
const contentRoles = ["super_admin", "admin", "editor"];

function categorySlug(name: string) {
  const value = name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "");
  return value || `faq-${Date.now()}`;
}

export default function CMSFAQs() {
  const { user, isAuthenticated } = useAuth();
  const allowed = isAuthenticated && contentRoles.includes(user?.role || "");
  const canDelete = ["super_admin", "admin"].includes(user?.role || "");
  const utils = trpc.useUtils();
  const [faqOpen, setFaqOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState<FaqForm>(emptyForm);
  const [categoryName, setCategoryName] = useState("");
  const [categoryOrder, setCategoryOrder] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const { data: faqs = [], isLoading } = trpc.cms.faqs.list.useQuery(undefined, { enabled: allowed });
  const { data: services = [] } = trpc.cms.services.list.useQuery(undefined, { enabled: allowed });
  const { data: categories = [] } = trpc.cms.categories.list.useQuery({ type: "faq" }, { enabled: allowed });
  const refresh = () => Promise.all([utils.cms.faqs.list.invalidate(), utils.cms.categories.list.invalidate(), utils.cms.publicContent.services.invalidate()]);
  const createFaq = trpc.cms.faqs.create.useMutation({ onSuccess: refresh });
  const updateFaq = trpc.cms.faqs.update.useMutation({ onSuccess: refresh });
  const deleteFaq = trpc.cms.faqs.delete.useMutation({ onSuccess: refresh });
  const createCategory = trpc.cms.categories.create.useMutation({ onSuccess: refresh });
  const updateCategory = trpc.cms.categories.update.useMutation({ onSuccess: refresh });
  const deleteCategory = trpc.cms.categories.delete.useMutation({ onSuccess: refresh });
  const savingFaq = createFaq.isPending || updateFaq.isPending;
  const savingCategory = createCategory.isPending || updateCategory.isPending;

  if (!allowed) return <div className="flex min-h-screen items-center justify-center"><p className="text-slate-600">您沒有權限存取 FAQ 管理。</p></div>;

  const filteredFaqs = faqs.filter((faq) => filter === "all" || (filter === "none" ? !faq.categoryId : faq.categoryId === Number(filter)));
  const openNewFaq = () => { setEditingFaq(null); setForm({ ...emptyForm, order: faqs.length }); setError(""); setFaqOpen(true); };
  const openEditFaq = (faq: any) => { setEditingFaq(faq); setForm({ question: faq.question, answer: faq.answer || "", serviceId: faq.serviceId ?? null, categoryId: faq.categoryId ?? null, order: faq.order ?? 0, isVisible: faq.isVisible !== false }); setError(""); setFaqOpen(true); };
  const openNewCategory = () => { setEditingCategory(null); setCategoryName(""); setCategoryOrder(categories.length); setError(""); setCategoryOpen(true); };
  const openEditCategory = (category: any) => { setEditingCategory(category); setCategoryName(category.name); setCategoryOrder(category.order || 0); setError(""); setCategoryOpen(true); };

  async function saveFaq(event: React.FormEvent) {
    event.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) { setError("問題與答案皆為必填欄位。"); return; }
    setError("");
    try {
      const values = { ...form, question: form.question.trim(), answer: form.answer.trim() };
      if (editingFaq) await updateFaq.mutateAsync({ id: editingFaq.id, ...values });
      else await createFaq.mutateAsync(values);
      setNotice(editingFaq ? "FAQ 已更新" : "FAQ 已建立"); setFaqOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "儲存 FAQ 時發生錯誤。"); }
  }

  async function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) { setError("分類名稱必填。"); return; }
    setError("");
    try {
      if (editingCategory) await updateCategory.mutateAsync({ id: editingCategory.id, name, order: categoryOrder });
      else await createCategory.mutateAsync({ name, slug: categorySlug(name), type: "faq", order: categoryOrder });
      setNotice(editingCategory ? "FAQ 分類已更新" : "FAQ 分類已建立"); setCategoryOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "儲存 FAQ 分類時發生錯誤。"); }
  }

  return <div className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8"><div><h1 className="text-3xl font-bold text-[#163C72]">常見問題管理</h1><p className="mt-1 text-sm text-slate-500">管理 FAQ、服務關聯、分類、公開顯示與排序。</p></div><div className="flex gap-2"><Button variant="outline" onClick={openNewCategory}><FolderCog className="mr-2 h-4 w-4" />管理分類</Button><Button onClick={openNewFaq} className="bg-[#163C72] hover:bg-[#123360]"><Plus className="mr-2 h-4 w-4" />新增 FAQ</Button></div></div></header>
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {notice && <p role="status" className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="mb-5 flex items-center gap-3"><label htmlFor="faq-category-filter" className="text-sm font-medium text-slate-700">分類篩選</label><select id="faq-category-filter" className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">全部分類</option><option value="none">未分類</option>{categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}</select></div>
      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-[#163C72]" /></div> : filteredFaqs.length ? <div className="space-y-3">{filteredFaqs.map((faq) => { const category = categories.find((item) => item.id === faq.categoryId); const service = services.find((item) => item.id === faq.serviceId); return <Card key={faq.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{faq.question}</h2>{category && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#163C72]">分類：{category.name}</span>}{service && <span className="rounded-full bg-lime-50 px-2 py-0.5 text-xs text-[#567c1c]">服務：{service.name}</span>}{faq.isVisible ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Eye className="h-3.5 w-3.5" />顯示中</span> : <span className="inline-flex items-center gap-1 text-xs text-slate-500"><EyeOff className="h-3.5 w-3.5" />已隱藏</span>}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{faq.answer}</p><p className="mt-3 text-xs text-slate-400">排序：{faq.order || 0}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEditFaq(faq)}><Edit2 className="mr-1 h-4 w-4" />編輯</Button>{canDelete && <Button size="sm" variant="outline" className="text-red-700" disabled={deleteFaq.isPending} onClick={() => { if (window.confirm("確定要刪除此 FAQ 嗎？")) deleteFaq.mutate({ id: faq.id }, { onSuccess: () => setNotice("FAQ 已刪除"), onError: (cause) => setError(cause.message) }); }}><Trash2 className="mr-1 h-4 w-4" />刪除</Button>}</div></div></Card>; })}</div> : <Card className="p-12 text-center"><p className="text-slate-600">目前尚無符合條件的 FAQ。</p><Button className="mt-4" onClick={openNewFaq}><Plus className="mr-2 h-4 w-4" />新增第一個 FAQ</Button></Card>}
    </main>
    <Dialog open={faqOpen} onOpenChange={setFaqOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editingFaq ? "編輯 FAQ" : "新增 FAQ"}</DialogTitle><DialogDescription>分類、服務關聯、顯示狀態及排序均可隨時調整。</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={saveFaq}><div><label htmlFor="faq-question" className="mb-1 block text-sm font-medium">問題 *</label><Input id="faq-question" value={form.question} onChange={(event) => setForm((data) => ({ ...data, question: event.target.value }))} /></div><div><label htmlFor="faq-answer" className="mb-1 block text-sm font-medium">答案 *</label><Textarea id="faq-answer" rows={6} value={form.answer} onChange={(event) => setForm((data) => ({ ...data, answer: event.target.value }))} /></div><div className="grid gap-4 sm:grid-cols-3"><div><label htmlFor="faq-category" className="mb-1 block text-sm font-medium">分類</label><select id="faq-category" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={form.categoryId ?? ""} onChange={(event) => setForm((data) => ({ ...data, categoryId: event.target.value ? Number(event.target.value) : null }))}><option value="">未分類</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div><label htmlFor="faq-service" className="mb-1 block text-sm font-medium">關聯服務</label><select id="faq-service" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={form.serviceId ?? ""} onChange={(event) => setForm((data) => ({ ...data, serviceId: event.target.value ? Number(event.target.value) : null }))}><option value="">全站 FAQ</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div><div><label htmlFor="faq-order" className="mb-1 block text-sm font-medium">排序</label><Input id="faq-order" type="number" min="0" value={form.order} onChange={(event) => setForm((data) => ({ ...data, order: Number(event.target.value) || 0 }))} /></div></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isVisible} onChange={(event) => setForm((data) => ({ ...data, isVisible: event.target.checked }))} />在公開網站顯示</label>{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setFaqOpen(false)}>取消</Button><Button type="submit" disabled={savingFaq} className="bg-[#163C72] hover:bg-[#123360]">{savingFaq && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingFaq ? "儲存變更" : "建立 FAQ"}</Button></div></form></DialogContent></Dialog>
    <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{editingCategory ? "編輯 FAQ 分類" : "新增 FAQ 分類"}</DialogTitle><DialogDescription>FAQ 分類不會與文章或案例分類混用。</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={saveCategory}><div><label htmlFor="faq-category-name" className="mb-1 block text-sm font-medium">分類名稱 *</label><Input id="faq-category-name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} /></div><div><label htmlFor="faq-category-order" className="mb-1 block text-sm font-medium">排序</label><Input id="faq-category-order" type="number" min="0" value={categoryOrder} onChange={(event) => setCategoryOrder(Number(event.target.value) || 0)} /></div>{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setCategoryOpen(false)}>取消</Button><Button type="submit" disabled={savingCategory} className="bg-[#163C72] hover:bg-[#123360]">{savingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}儲存分類</Button></div></form><div className="border-t border-slate-200 pt-4"><p className="mb-2 text-sm font-medium">既有 FAQ 分類</p>{categories.length ? <div className="space-y-2">{categories.map((category) => <div key={category.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"><span className="text-sm">{category.name}<span className="ml-2 text-xs text-slate-400">排序 {category.order || 0}</span></span><div className="flex gap-1"><Button type="button" size="sm" variant="ghost" onClick={() => openEditCategory(category)}>編輯</Button>{canDelete && <Button type="button" size="sm" variant="ghost" className="text-red-700" disabled={deleteCategory.isPending} onClick={() => { if (window.confirm("確定要刪除這個 FAQ 分類嗎？")) deleteCategory.mutate({ id: category.id }, { onSuccess: () => setNotice("FAQ 分類已刪除"), onError: (cause) => setError(cause.message) }); }}>刪除</Button>}</div></div>)}</div> : <p className="text-sm text-slate-500">尚未建立 FAQ 分類。</p>}</div></DialogContent></Dialog>
  </div>;
}
