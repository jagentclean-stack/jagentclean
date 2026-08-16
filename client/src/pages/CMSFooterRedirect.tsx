import { useEffect } from "react";
import { useLocation } from "wouter";

/** 保留舊網址相容性，避免既有書籤進入已淘汰的重複管理介面。 */
export default function CMSFooterRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/cms/settings", { replace: true });
  }, [setLocation]);

  return <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">正在前往網站設定…</div>;
}
