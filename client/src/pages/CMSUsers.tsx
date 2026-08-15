import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Loader2, Pencil, ShieldCheck, SlidersHorizontal, UserPlus, UsersRound } from "lucide-react";

const ADMIN_ROLES = new Set(["super_admin", "admin"]);
const HIGHEST_ADMIN_EMAILS = new Set(["jagentclean@gmail.com", "emilyku0jj@gmail.com"]);
const ROLE_LABELS = {
  super_admin: "最高權限管理員",
  admin: "管理員",
  manager: "施工主管",
  customer_service: "客服",
  marketing: "行銷",
  editor: "編輯",
  user: "一般使用者",
} as const;
type Role = keyof typeof ROLE_LABELS;
type ConfigurableRole = Exclude<Role, "super_admin">;

const PERMISSION_LABELS: Record<string, string> = {
  DASHBOARD_READ: "儀表板檢視", PAGES_READ: "頁面檢視", PAGES_CREATE: "頁面新增", PAGES_UPDATE: "頁面編輯", PAGES_DELETE: "頁面刪除",
  SERVICES_READ: "服務檢視", SERVICES_CREATE: "服務新增", SERVICES_UPDATE: "服務編輯", SERVICES_DELETE: "服務刪除",
  BOOKINGS_MANAGE: "預約管理", CONTACTS_READ: "聯絡訊息檢視", CONTACTS_UPDATE: "聯絡訊息更新", MEDIA_MANAGE: "媒體管理", MEDIA_DELETE: "媒體刪除",
  SETTINGS_MANAGE: "網站設定", CASES_MANAGE: "案例管理", CASES_DELETE: "案例刪除", BLOGS_MANAGE: "文章管理", BLOGS_DELETE: "文章刪除",
  CATEGORIES_MANAGE: "分類管理", CATEGORIES_DELETE: "分類刪除", FAQS_MANAGE: "FAQ 管理", FAQS_DELETE: "FAQ 刪除",
  MENUS_MANAGE: "導覽列管理", SEO_MANAGE: "SEO 管理", USERS_MANAGE: "帳號管理", HERO_MANAGE: "首頁主視覺管理", HERO_DELETE: "首頁主視覺刪除",
  FOOTER_MANAGE: "頁尾管理", FOOTER_DELETE: "頁尾刪除", REVIEWS_MANAGE: "客戶評價管理", REVIEWS_DELETE: "客戶評價刪除",
};

export default function CMSUsers() {
  const { user, isAuthenticated } = useAuth();
  const canManage = Boolean((user?.role && ADMIN_ROLES.has(user.role)) || (user?.email && HIGHEST_ADMIN_EMAILS.has(user.email)));
  const isHighestAdmin = Boolean(user?.email && HIGHEST_ADMIN_EMAILS.has(user.email));
  const utils = trpc.useUtils();
  const usersQuery = trpc.cms.users.list.useQuery(undefined, { enabled: Boolean(isAuthenticated && canManage) });
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [draft, setDraft] = useState({ name: "", email: "", role: "editor" as Role, initialPassword: "" });
  const [editing, setEditing] = useState<{ id: number; name: string; email: string; newPassword: string } | null>(null);
  const [permissionRole, setPermissionRole] = useState<ConfigurableRole>("editor");
  const rolePermissions = trpc.cms.rolePermissions.list.useQuery({ role: permissionRole }, { enabled: Boolean(isAuthenticated && isHighestAdmin) });

  const refresh = async () => { await utils.cms.users.list.invalidate(); };
  const create = trpc.cms.users.create.useMutation({
    onSuccess: async () => { await refresh(); setDraft({ name: "", email: "", role: "editor", initialPassword: "" }); setNotice({ type: "success", text: "員工帳號已建立，可使用 Email 與初始密碼登入。" }); },
    onError: (error) => setNotice({ type: "error", text: error.message || "無法建立員工帳號。" }),
  });
  const updateRole = trpc.cms.users.updateRole.useMutation({
    onSuccess: async () => { await refresh(); setNotice({ type: "success", text: "員工角色已更新。" }); },
    onError: (error) => setNotice({ type: "error", text: error.message || "無法更新角色。" }),
  });
  const setActive = trpc.cms.users.setActive.useMutation({
    onSuccess: async () => { await refresh(); setNotice({ type: "success", text: "帳號狀態已更新；停用帳號將無法存取 CMS。" }); },
    onError: (error) => setNotice({ type: "error", text: error.message || "無法更新帳號狀態。" }),
  });
  const updateProfile = trpc.cms.users.updateProfile.useMutation({
    onSuccess: async () => { await refresh(); setEditing(null); setNotice({ type: "success", text: "員工資料已更新。" }); },
    onError: (error) => setNotice({ type: "error", text: error.message || "無法更新員工資料。" }),
  });
  const updatePermission = trpc.cms.rolePermissions.update.useMutation({
    onSuccess: async () => { await utils.cms.rolePermissions.list.invalidate({ role: permissionRole }); setNotice({ type: "success", text: "角色功能權限已更新，並已寫入異動紀錄。" }); },
    onError: (error) => setNotice({ type: "error", text: error.message || "無法更新角色功能權限。" }),
  });

  if (!isAuthenticated || !canManage) return <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-600">您沒有管理員工帳號的權限。</div>;
  const busy = create.isPending || updateRole.isPending || setActive.isPending || updateProfile.isPending || updatePermission.isPending;

  return <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="mb-2 text-sm font-semibold tracking-[0.16em] text-[#163C72]">TEAM ACCESS</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">員工管理</h1><p className="mt-2 text-sm leading-6 text-slate-600">建立 CMS 員工帳號、分配角色，並可立即停用離職或暫停中的帳號。</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#163C72] text-[#8CC63F]"><UsersRound className="h-6 w-6" /></div></div></header>
    {notice && <div role="status" className={`flex gap-3 rounded-2xl border px-5 py-4 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}{notice.text}</div>}
    <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><UserPlus className="h-5 w-5 text-[#163C72]" /><div><h2 className="font-bold text-slate-950">新增員工帳號</h2><p className="text-sm text-slate-500">初始密碼至少 12 個字元；請透過安全管道交付給員工。</p></div></div><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); setNotice(null); create.mutate(draft); }}><label className="space-y-2 text-sm font-medium text-slate-700">姓名<Input required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label><label className="space-y-2 text-sm font-medium text-slate-700">Email<Input required type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} /></label><label className="space-y-2 text-sm font-medium text-slate-700">角色<select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as Role }))}>{(Object.keys(ROLE_LABELS) as Role[]).filter((role) => isHighestAdmin || role !== "super_admin").map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></label><label className="space-y-2 text-sm font-medium text-slate-700">初始密碼<Input required minLength={12} type="password" autoComplete="new-password" value={draft.initialPassword} onChange={(event) => setDraft((current) => ({ ...current, initialPassword: event.target.value }))} /></label><div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={busy} className="bg-[#163C72] text-white hover:bg-[#102f5d]"><UserPlus className="mr-2 h-4 w-4" />{create.isPending ? "建立中…" : "建立員工帳號"}</Button></div></form></Card>
    <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-6 py-5"><h2 className="font-bold text-slate-950">帳號與權限</h2></div>{usersQuery.isLoading ? <div className="grid min-h-52 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#163C72]" /></div> : usersQuery.isError ? <div className="p-6 text-sm text-red-700">無法讀取員工帳號。請重新整理後再試。</div> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">帳號</th><th className="px-6 py-4">角色</th><th className="px-6 py-4">狀態</th><th className="px-6 py-4">最後登入</th><th className="px-6 py-4 text-right">操作</th></tr></thead><tbody className="divide-y divide-slate-100">{usersQuery.data?.map((member) => { const protectedMember = member.role === "super_admin" || Boolean(member.email && HIGHEST_ADMIN_EMAILS.has(member.email)); const cannotEdit = protectedMember && !isHighestAdmin; return <tr key={member.id} className="text-slate-700"><td className="px-6 py-4"><p className="font-semibold text-slate-950">{member.name || "未命名員工"}</p><p className="mt-1 text-xs text-slate-500">{member.email || "未提供 Email"}</p></td><td className="px-6 py-4"><select aria-label={`${member.email || member.id} 的角色`} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={member.role} disabled={busy || (member.role === "super_admin" && !isHighestAdmin)} onChange={(event) => updateRole.mutate({ id: member.id, role: event.target.value as Role })}>{(Object.keys(ROLE_LABELS) as Role[]).filter((role) => isHighestAdmin || role !== "super_admin").map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></td><td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{member.isActive ? "啟用中" : "已停用"}</span></td><td className="px-6 py-4 text-xs text-slate-500">{member.lastSignedIn ? new Date(member.lastSignedIn).toLocaleString("zh-TW") : "尚未登入"}</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={busy || cannotEdit} onClick={() => setEditing({ id: member.id, name: member.name || "", email: member.email || "", newPassword: "" })}><Pencil className="mr-1 h-3.5 w-3.5" />編輯</Button><Button size="sm" variant="outline" disabled={busy || protectedMember || member.id === user?.id} onClick={() => setActive.mutate({ id: member.id, isActive: !member.isActive })}>{member.isActive ? "停用帳號" : "重新啟用"}</Button></div>{protectedMember && <p className="mt-1 text-xs text-slate-400"><ShieldCheck className="mr-1 inline h-3 w-3" />受保護帳號</p>}</td></tr>; })}</tbody></table></div>}</Card>
    {isHighestAdmin && <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between"><div className="flex gap-3"><SlidersHorizontal className="mt-0.5 h-5 w-5 text-[#163C72]" /><div><h2 className="font-bold text-slate-950">角色功能權限</h2><p className="mt-1 text-sm text-slate-500">未調整項目沿用系統預設值；最高權限帳號永遠保有全部功能，無法在此降權。</p></div></div><label className="text-sm font-medium text-slate-700">設定角色<select aria-label="設定角色" className="ml-3 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={permissionRole} onChange={(event) => setPermissionRole(event.target.value as ConfigurableRole)}>{(Object.keys(ROLE_LABELS) as Role[]).filter((role): role is ConfigurableRole => role !== "super_admin").map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></label></div>{rolePermissions.isLoading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#163C72]" /></div> : rolePermissions.isError ? <div className="p-6 text-sm text-red-700">無法讀取角色功能權限。</div> : <div className="divide-y divide-slate-100">{rolePermissions.data?.map((item) => <div key={item.permission} className="flex items-center justify-between gap-6 px-6 py-4"><div><p className="font-medium text-slate-900">{PERMISSION_LABELS[item.permission] || item.permission}</p><p className="mt-1 text-xs text-slate-500">{item.permission} · {item.isOverridden ? "已由最高權限管理員覆寫" : `系統預設：${item.defaultAllowed ? "允許" : "不允許"}`}</p></div><label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700"><span>{item.isAllowed ? "允許" : "不允許"}</span><input aria-label={`${item.permission} 權限`} type="checkbox" className="h-5 w-5 accent-[#163C72]" checked={item.isAllowed} disabled={busy} onChange={(event) => updatePermission.mutate({ role: permissionRole, permission: item.permission, isAllowed: event.target.checked })} /></label></div>)}</div>}</Card>}
    {editing && <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5"><h2 className="font-bold text-slate-950">編輯員工資料</h2><p className="mt-1 text-sm text-slate-500">留空密碼欄位即可保留現有密碼；如需重設，請輸入至少 12 個字元的新密碼。</p></div><form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); setNotice(null); updateProfile.mutate({ id: editing.id, name: editing.name, email: editing.email, ...(editing.newPassword ? { newPassword: editing.newPassword } : {}) }); }}><label className="space-y-2 text-sm font-medium text-slate-700">姓名<Input required value={editing.name} onChange={(event) => setEditing((current) => current ? { ...current, name: event.target.value } : current)} /></label><label className="space-y-2 text-sm font-medium text-slate-700">Email<Input required type="email" value={editing.email} onChange={(event) => setEditing((current) => current ? { ...current, email: event.target.value } : current)} /></label><label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">重設密碼（選填）<Input minLength={12} type="password" autoComplete="new-password" value={editing.newPassword} onChange={(event) => setEditing((current) => current ? { ...current, newPassword: event.target.value } : current)} /></label><div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setEditing(null)}>取消</Button><Button type="submit" disabled={busy} className="bg-[#163C72] text-white hover:bg-[#102f5d]">{updateProfile.isPending ? "儲存中…" : "儲存員工資料"}</Button></div></form></Card>}
  </div></div>;
}
