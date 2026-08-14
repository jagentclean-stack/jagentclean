import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

const approvedEmails = ["jagentclean@gmail.com", "emilyku0jj@gmail.com"];

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState(approvedEmails[0]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError("登入資料不正確，或此帳號沒有管理權限。");
        return;
      }

      navigate("/cms");
    } catch {
      setError("目前無法登入，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-[#163C72] transition-colors hover:text-[#0c2852]">
          ← 返回潔特務清潔官方網站
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_70px_rgba(22,60,114,0.12)] sm:p-10">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163C72] text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[#5d8d1d]">J-AGENT CLEANING</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">CMS 管理後台</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">僅限授權管理員存取。請以已核准的管理員電子郵件與 CMS 密碼登入。</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="admin-email">管理員電子郵件</Label>
              <select
                id="admin-email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163C72] focus-visible:ring-offset-2"
                disabled={isSubmitting}
              >
                {approvedEmails.map(approvedEmail => (
                  <option key={approvedEmail} value={approvedEmail}>{approvedEmail}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">CMS 管理員密碼</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <Button type="submit" className="h-11 w-full bg-[#163C72] text-white hover:bg-[#0c2852]" disabled={isSubmitting}>
              {isSubmitting ? "登入中…" : "登入管理後台"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
