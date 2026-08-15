import React, { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Clipboard, FileText, Loader2, Sparkles } from "lucide-react";

type Channel = "facebook" | "instagram" | "line" | "googleBusiness" | "seoArticle";
type Tone = "professional" | "warm" | "concise" | "premium";

const HIGHEST_ADMIN_EMAILS = new Set(["jagentclean@gmail.com", "emilyku0jj@gmail.com"]);
const COPY_ROLES = new Set(["super_admin", "admin", "marketing"]);
const channels: Array<{ value: Channel; label: string; hint: string }> = [
  { value: "facebook", label: "Facebook", hint: "貼文標題、內文與標籤" },
  { value: "instagram", label: "Instagram", hint: "貼文標題、內文與標籤" },
  { value: "line", label: "LINE", hint: "可直接複製的訊息草稿" },
  { value: "googleBusiness", label: "Google 商家", hint: "商家貼文草稿" },
  { value: "seoArticle", label: "SEO 文章", hint: "標題、描述、大綱與內文" },
];

function formatSocialDraft(draft: { headline: string; body: string; hashtags: string[] }) {
  return [draft.headline, "", draft.body, draft.hashtags.length ? "" : undefined, draft.hashtags.join(" ")].filter((line): line is string => typeof line === "string").join("\n");
}

export default function CMSCopywriting() {
  const { user, isAuthenticated } = useAuth();
  const canGenerate = Boolean((user?.role && COPY_ROLES.has(user.role)) || (user?.email && HIGHEST_ADMIN_EMAILS.has(user.email)));
  const [scenario, setScenario] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(["facebook", "instagram", "line"]);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const generate = trpc.cms.aiCopy.generate.useMutation({
    onSuccess: () => setNotice({ type: "success", text: "AI 已產生草稿。請先核對事實與品牌語氣，再複製至對應管道發佈。" }),
    onError: (error) => setNotice({ type: "error", text: error.message || "目前無法產生草稿，請稍後再試。" }),
  });

  const selectedLabel = useMemo(() => channels.filter((channel) => selectedChannels.includes(channel.value)).map((channel) => channel.label).join("、"), [selectedChannels]);
  const draft = generate.data;

  const toggleChannel = (channel: Channel) => {
    setSelectedChannels((current) => current.includes(channel) ? current.filter((value) => value !== channel) : [...current, channel]);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ type: "success", text: `已複製${label}草稿。` });
    } catch {
      setNotice({ type: "error", text: "無法自動複製，請手動選取內容後複製。" });
    }
  };

  if (!isAuthenticated || !canGenerate) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><Sparkles className="mx-auto h-8 w-8 text-[#163C72]" /><h1 className="mt-4 text-xl font-bold text-slate-950">您沒有 AI 文案工作區的權限</h1><p className="mt-3 text-sm leading-6 text-slate-600">此功能僅提供最高權限管理員、管理員與行銷角色，用於建立需人工覆核的行銷草稿。</p></div></div>;
  }

  const socialDrafts = draft ? channels.filter((channel) => channel.value !== "seoArticle" && selectedChannels.includes(channel.value)).map((channel) => ({
    ...channel,
    draft: draft[channel.value as "facebook" | "instagram" | "line" | "googleBusiness"],
  })) : [];

  return <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="mb-2 text-sm font-semibold tracking-[0.16em] text-[#163C72]">AI COPY STUDIO</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">AI 文案工作區</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">把已確認的服務情境整理成各管道草稿。系統不會自動發佈，也不會產生客戶評論、價格承諾或未經確認的服務主張。</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#163C72] text-[#8CC63F]"><Sparkles className="h-6 w-6" /></div></div></header>

    {notice && <div role="status" className={`flex gap-3 rounded-2xl border px-5 py-4 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}{notice.text}</div>}

    <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-[#163C72]" /><div><h2 className="font-bold text-slate-950">建立草稿需求</h2><p className="mt-1 text-sm text-slate-500">請只填入已確認的事實。產生結果為內部草稿，發佈前請人工覆核。</p></div></div><form className="space-y-6" onSubmit={(event) => { event.preventDefault(); setNotice(null); generate.mutate({ scenario, keyPoints, tone, channels: selectedChannels }); }}><label className="block space-y-2 text-sm font-medium text-slate-700">服務情境 <span className="text-red-600">*</span><textarea required minLength={3} maxLength={2000} value={scenario} onChange={(event) => setScenario(event.target.value)} placeholder="例：今日完成一戶浴室除霉清潔，請描述已確認的服務範圍與現場需求。" className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#163C72] focus:ring-4 focus:ring-[#163C72]/10" /></label><label className="block space-y-2 text-sm font-medium text-slate-700">已確認重點（選填）<textarea maxLength={2000} value={keyPoints} onChange={(event) => setKeyPoints(event.target.value)} placeholder="例：不可使用價格、保證效果或客戶姓名；可提及使用者提供的作業流程。" className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#163C72] focus:ring-4 focus:ring-[#163C72]/10" /></label><div className="grid gap-5 md:grid-cols-2"><label className="space-y-2 text-sm font-medium text-slate-700">品牌語氣<select aria-label="品牌語氣" value={tone} onChange={(event) => setTone(event.target.value as Tone)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="professional">專業、清楚、可信賴</option><option value="warm">親切、溫暖、自然</option><option value="concise">精簡、直接、易讀</option><option value="premium">高品質、克制、企業感</option></select></label><div><p className="mb-2 text-sm font-medium text-slate-700">輸出格式 <span className="text-red-600">*</span></p><div className="grid grid-cols-2 gap-2">{channels.map((channel) => <label key={channel.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"><input type="checkbox" checked={selectedChannels.includes(channel.value)} onChange={() => toggleChannel(channel.value)} className="h-4 w-4 accent-[#163C72]" /><span>{channel.label}</span></label>)}</div></div></div><div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">將產生：{selectedLabel || "尚未選擇格式"}</p><Button type="submit" disabled={generate.isPending || selectedChannels.length === 0 || scenario.trim().length < 3} className="bg-[#163C72] text-white hover:bg-[#102f5d]"><Sparkles className="mr-2 h-4 w-4" />{generate.isPending ? "產生草稿中…" : "產生 AI 草稿"}</Button></div></form></Card>

    {generate.isPending && <Card className="grid min-h-48 place-items-center rounded-3xl border-slate-200 bg-white shadow-sm"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#163C72]" /><p className="mt-3 text-sm text-slate-600">正在整理可供人工覆核的草稿…</p></div></Card>}
    {draft && <section aria-label="AI 產生的文案草稿" className="space-y-5"><div><h2 className="text-xl font-bold text-slate-950">文案草稿</h2><p className="mt-1 text-sm text-slate-500">每一份草稿皆須先確認服務事實與品牌用語，再複製至外部管道。</p></div><div className="grid gap-5 lg:grid-cols-2">{socialDrafts.map(({ value, label, hint, draft: social }) => { const content = formatSocialDraft(social); return <Card key={value} className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold tracking-wide text-[#163C72]">{label.toUpperCase()}</p><h3 className="mt-2 text-lg font-bold text-slate-950">{social.headline}</h3><p className="mt-1 text-xs text-slate-500">{hint}</p></div><Button size="sm" variant="outline" onClick={() => copy(content, label)}><Clipboard className="mr-1.5 h-3.5 w-3.5" />複製</Button></div><pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 font-sans text-sm leading-6 text-slate-700">{content}</pre></Card>; })}</div>{selectedChannels.includes("seoArticle") && <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold tracking-wide text-[#163C72]">SEO ARTICLE</p><h3 className="mt-2 text-xl font-bold text-slate-950">{draft.seoArticle.title}</h3><p className="mt-2 text-sm text-slate-500">Meta Description：{draft.seoArticle.metaDescription}</p></div><Button size="sm" variant="outline" onClick={() => copy([draft.seoArticle.title, "", draft.seoArticle.metaDescription, "", ...draft.seoArticle.outline.map((item, index) => `${index + 1}. ${item}`), "", draft.seoArticle.body].join("\n"), "SEO 文章")}><Clipboard className="mr-1.5 h-3.5 w-3.5" />複製</Button></div><div className="mt-6 grid gap-5 lg:grid-cols-[240px_1fr]"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-800">文章大綱</p><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">{draft.seoArticle.outline.map((item) => <li key={item}>{item}</li>)}</ol></div><pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 font-sans text-sm leading-7 text-slate-700">{draft.seoArticle.body}</pre></div></Card>}</section>}
  </div></div>;
}
