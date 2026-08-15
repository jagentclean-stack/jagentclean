import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Banknote, CalendarDays, CircleDollarSign, ClipboardCheck, FileBarChart, Gift, LayoutDashboard, Loader2, ReceiptText, UserRoundCog, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const navigation = [
  { href: "/hr", label: "總覽", icon: LayoutDashboard, management: true },
  { href: "/hr/employees", label: "員工管理", icon: UsersRound, management: true },
  { href: "/hr/schedule", label: "排班管理", icon: CalendarDays, management: false },
  { href: "/hr/attendance", label: "出勤管理", icon: ClipboardCheck, management: false },
  { href: "/hr/overtime", label: "加班管理", icon: CircleDollarSign, management: false },
  { href: "/hr/payroll", label: "薪資計算", icon: Banknote, management: true },
  { href: "/hr/advances", label: "借支管理", icon: ReceiptText, management: true },
  { href: "/hr/compensation", label: "獎金／津貼", icon: Gift, management: true },
  { href: "/hr/payslips", label: "薪資條管理", icon: UserRoundCog, management: true },
  { href: "/hr/reports", label: "薪資支出報表", icon: FileBarChart, management: true },
];

export const formatTwd = (value: string | number | null | undefined) =>
  new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(Number(value ?? 0));

export const monthRange = () => {
  const current = new Date();
  const start = new Date(current.getFullYear(), current.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(current.getFullYear(), current.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

export const shouldShowHrLoading = (authLoading: boolean, hasUser: boolean, accessLoading: boolean) =>
  authLoading || (hasUser && accessLoading);

export function HRLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const access = trpc.payroll.access.useQuery(undefined, { enabled: Boolean(user) });
  const [location] = useLocation();

  if (shouldShowHrLoading(loading, Boolean(user), access.isLoading)) return <div className="grid min-h-screen place-items-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-[#163C72]" /></div>;
  if (!user || access.error) return <div className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold text-slate-900">無法存取人事薪資系統</h1><p className="mt-3 text-slate-600">請先使用已授權帳號登入，系統會依角色顯示可操作的資料。</p><Link href="/admin/login" className="mt-6 inline-flex rounded-xl bg-[#163C72] px-5 py-3 font-medium text-white">前往登入</Link></section></div>;
  const canManagePayroll = access.data?.canManagePayroll ?? false;
  const canManageOperations = access.data?.canManageOperations ?? false;
  const visibleNavigation = navigation.filter((item) => (item.management ? canManagePayroll : canManageOperations || item.href === "/hr/schedule" || item.href === "/hr/overtime"));

  return <div className="min-h-screen bg-[#f5f8fc] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-6 py-4"><div><p className="text-xs font-bold tracking-[0.18em] text-[#8CC63F]">J-AGENT CLEANING</p><h1 className="text-lg font-bold text-[#163C72]">人事薪資管理系統</h1></div><div className="flex items-center gap-4"><div className="hidden text-right text-sm md:block"><p className="font-semibold">{user.name || user.email}</p><p className="text-slate-500">{access.data?.role}</p></div><Button variant="outline" onClick={() => void logout().then(() => window.location.assign("/admin/login"))}>登出</Button></div></div></header>
    <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[244px_minmax(0,1fr)] lg:px-6">
      <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">{visibleNavigation.map((item) => { const Icon = item.icon; const active = item.href === "/hr" ? location === "/hr" : location.startsWith(item.href); return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-[#163C72] text-white" : "text-slate-600 hover:bg-slate-100"}`}><Icon className="h-4 w-4" />{item.label}</Link>; })}</nav><div className="mt-4 border-t border-slate-100 pt-3"><Link href="/cms" className="block rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">返回 CMS 後台</Link></div></aside>
      <main className="min-w-0"><section className="mb-6"><h2 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></section>{children}</main>
    </div>
  </div>;
}
