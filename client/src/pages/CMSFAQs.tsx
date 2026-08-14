import * as React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ChevronDown, Edit2, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

const faqSchema = z.object({
  question: z.string().trim().min(1, "問題必填").max(500),
  answer: z.string().trim().min(1, "答案必填").max(10_000),
  serviceId: z.number().int().positive().nullable(),
  order: z.number().int().min(0).max(10_000),
  isVisible: z.boolean(),
});

type FAQFormData = z.infer<typeof faqSchema>;

const blankForm: FAQFormData = { question: "", answer: "", serviceId: null, order: 0, isVisible: true };
const cmsRoles = ["super_admin", "admin", "editor"];

export default function CMSFAQs() {
  const { user, isAuthenticated } = useAuth();
  const canManage = isAuthenticated && cmsRoles.includes(user?.role || "");
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [formData, setFormData] = React.useState<FAQFormData>(blankForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const { data: faqs = [], isLoading } = trpc.cms.faqs.list.useQuery(undefined, { enabled: canManage });
  const { data: services = [] } = trpc.cms.services.list.useQuery(undefined, { enabled: canManage });

  const refresh = async () => {
    await Promise.all([utils.cms.faqs.list.invalidate(), utils.cms.publicContent.services.invalidate()]);
  };
  const createMutation = trpc.cms.faqs.create.useMutation({ onSuccess: refresh });
  const updateMutation = trpc.cms.faqs.update.useMutation({ onSuccess: refresh });
  const deleteMutation = trpc.cms.faqs.delete.useMutation({ onSuccess: refresh });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditingId(null);
    setFormData(blankForm);
    setFormError(null);
    setSuccessMessage(null);
    setDialogOpen(true);
  };
  const openEdit = (faq: (typeof faqs)[number]) => {
    setEditingId(faq.id);
    setFormData({
      question: faq.question,
      answer: faq.answer || "",
      serviceId: faq.serviceId ?? null,
      order: faq.order ?? 0,
      isVisible: faq.isVisible ?? true,
    });
    setFormError(null);
    setSuccessMessage(null);
    setDialogOpen(true);
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = faqSchema.safeParse(formData);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message || "請檢查必填欄位");
      return;
    }
    setFormError(null);
    try {
      if (editingId === null) await createMutation.mutateAsync(parsed.data);
      else await updateMutation.mutateAsync({ id: editingId, ...parsed.data });
      setSuccessMessage(editingId === null ? "FAQ 已建立" : "FAQ 已更新");
      setDialogOpen(false);
      setFormData(blankForm);
      setEditingId(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "儲存 FAQ 時發生錯誤");
    }
  };

  if (!canManage) return <div className="flex min-h-screen items-center justify-center"><p className="text-slate-600">您沒有權限存取 FAQ 管理。</p></div>;

  return <div className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8"><div><h1 className="text-3xl font-bold text-[#163C72]">常見問題管理</h1><p className="mt-1 text-sm text-slate-500">建立全站或服務專屬 FAQ，控制顯示與排序。</p></div><Button onClick={openCreate} className="bg-[#163C72] hover:bg-[#123360]"><Plus className="mr-2 h-4 w-4" />新增 FAQ</Button></div></header>
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {successMessage && <p role="status" className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{successMessage}</p>}
      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-[#163C72]" /></div> : faqs.length ? <div className="space-y-3">{faqs.map((faq) => {
        const serviceName = faq.serviceId ? services.find((service) => service.id === faq.serviceId)?.name : null;
        const isExpanded = expandedId === faq.id;
        return <Card key={faq.id} className="overflow-hidden"><button type="button" className="flex w-full items-center gap-4 p-4 text-left hover:bg-slate-50" onClick={() => setExpandedId(isExpanded ? null : faq.id)}><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{faq.question}</h2>{serviceName ? <span className="rounded-full bg-lime-50 px-2 py-0.5 text-xs font-medium text-[#5b851d]">服務：{serviceName}</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">全站 FAQ</span>}{faq.isVisible ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Eye className="h-3.5 w-3.5" />顯示中</span> : <span className="inline-flex items-center gap-1 text-xs text-slate-500"><EyeOff className="h-3.5 w-3.5" />已隱藏</span>}</div><p className="mt-1 text-xs text-slate-500">排序：{faq.order ?? 0}</p></div><ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>{isExpanded && <div className="border-t border-slate-200 bg-slate-50 p-4"><p className="whitespace-pre-wrap leading-7 text-slate-700">{faq.answer}</p><div className="mt-4 flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(faq)}><Edit2 className="mr-1 h-4 w-4" />編輯</Button>{["admin", "super_admin"].includes(user?.role || "") && <Button variant="outline" size="sm" className="text-red-700 hover:text-red-800" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm("確定要刪除此 FAQ 嗎？")) deleteMutation.mutate({ id: faq.id }); }}><Trash2 className="mr-1 h-4 w-4" />刪除</Button>}</div></div>}</Card>;
      })}</div> : <Card className="p-12 text-center"><p className="text-slate-600">目前尚無 FAQ。</p><Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />新增第一個 FAQ</Button></Card>}
    </main>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editingId === null ? "新增 FAQ" : "編輯 FAQ"}</DialogTitle><DialogDescription>可將 FAQ 指定給單一服務；未指定時將維持為全站 FAQ。</DialogDescription></DialogHeader><form className="space-y-5" onSubmit={save}><div><label htmlFor="faq-question" className="mb-1 block text-sm font-medium text-slate-700">問題 *</label><Input id="faq-question" value={formData.question} onChange={(event) => setFormData((value) => ({ ...value, question: event.target.value }))} /></div><div><label htmlFor="faq-answer" className="mb-1 block text-sm font-medium text-slate-700">答案 *</label><Textarea id="faq-answer" rows={6} value={formData.answer} onChange={(event) => setFormData((value) => ({ ...value, answer: event.target.value }))} /></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="faq-service" className="mb-1 block text-sm font-medium text-slate-700">關聯服務</label><select id="faq-service" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={formData.serviceId ?? ""} onChange={(event) => setFormData((value) => ({ ...value, serviceId: event.target.value ? Number(event.target.value) : null }))}><option value="">全站 FAQ（不指定服務）</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div><div><label htmlFor="faq-order" className="mb-1 block text-sm font-medium text-slate-700">排序</label><Input id="faq-order" type="number" min="0" value={formData.order} onChange={(event) => setFormData((value) => ({ ...value, order: Number(event.target.value) || 0 }))} /></div></div><label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={formData.isVisible} onChange={(event) => setFormData((value) => ({ ...value, isVisible: event.target.checked }))} />在公開網站顯示</label>{formError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}<div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button type="submit" disabled={isSaving} className="bg-[#163C72] hover:bg-[#123360]">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId === null ? "建立 FAQ" : "儲存變更"}</Button></div></form></DialogContent></Dialog>
  </div>;
}
