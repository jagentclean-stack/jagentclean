import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function AdminDebug() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">需要管理員權限</h1>
          <p className="text-gray-600 mb-6">請使用已核准的管理員帳號登入後查看診斷資訊。</p>
          <Link href="/admin/login">
            <Button>前往管理員登入</Button>
          </Link>
        </div>
      </div>
    );
  }

  const debugInfo = {
    "登入狀態": isAuthenticated ? "✅ 已登入" : "❌ 未登入",
    "User ID": user?.id || "N/A",
    "Email": user?.email || "N/A",
    "Name": user?.name || "N/A",
    "Role": user?.role || "N/A",
    "OpenId": user?.openId || "N/A",
    "Login Method": user?.loginMethod || "N/A",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 管理員調試面板</h1>
          <p className="text-gray-600">查看當前登入用戶的權限和會話資訊</p>
        </div>

        {/* User Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">👤 用戶資訊</h2>
          <div className="space-y-3">
            {Object.entries(debugInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-700">{key}:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-200 px-3 py-1 rounded text-sm font-mono">
                    {value}
                  </code>
                  <button
                    onClick={() => handleCopy(String(value))}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="複製"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Permission Status */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🔐 權限狀態</h2>
          <div className="space-y-2">
            {user?.role === "admin" ? (
              <>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-700">✅ 管理員權限已驗證</p>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  你可以訪問 CMS 後台的所有功能。
                </p>
              </>
            ) : (
              <>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-700">⚠️ 權限受限</p>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  當前角色: <strong>{user?.role}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  只有 admin 角色可以訪問 CMS 後台。
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Session Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🎫 會話資訊</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Session Cookie:</span> 已設定
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Authentication:</span> 受保護的管理員工作階段
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Token Type:</span> Bearer
            </p>
          </div>
        </Card>

        {/* Middleware Check */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🛡️ Middleware 檢查</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2">
              <span className="text-green-600">✅</span>
              <span>Authentication Middleware: 通過</span>
            </div>
            <div className="flex items-center gap-2 p-2">
              <span className={user?.role === "admin" ? "text-green-600" : "text-red-600"}>
                {user?.role === "admin" ? "✅" : "❌"}
              </span>
              <span>
                Authorization Middleware: {user?.role === "admin" ? "通過" : "失敗"}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2">
              <span className="text-green-600">✅</span>
              <span>RBAC System: 已啟用</span>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">🚀 快速導航</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/">
              <Button variant="outline" className="w-full">
                返回首頁
              </Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/cms">
                <Button className="w-full">
                  進入 CMS 後台
                </Button>
              </Link>
            )}
            <Link href="/contact">
              <Button variant="outline" className="w-full">
                聯絡我們
              </Button>
            </Link>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                void logout().then(() => window.location.assign("/admin/login"));
              }}
            >
              登出
            </Button>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">💡 調試提示</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 如果看到「❌ 權限受限」，請聯絡管理員升級你的帳號</li>
            <li>• 確保 Email 在管理員白名單中</li>
            <li>• 如果權限更新後仍未生效，請重新登入</li>
            <li>• 檢查瀏覽器 DevTools 的 Console 標籤以查看詳細錯誤</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
