import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function AdminSetup() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updateRoleMutation = trpc.cms.users.updateRole.useMutation({
    onSuccess: (data) => {
      setMessage(`✅ ${data.message}`);
      setEmail("");
      setRole("admin");
      setTimeout(() => setMessage(""), 3000);
    },
    onError: (error) => {
      setMessage(`❌ 錯誤: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage("❌ 請輸入 Email");
      return;
    }

    setIsLoading(true);
    try {
      await updateRoleMutation.mutateAsync({
        email,
        role: role as any,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理員設定</h1>
        <p className="text-gray-600 mb-6">設定使用者角色和權限</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              使用者 Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例如: jagentclean@gmail.com"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              角色
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin（完全控制）</option>
              <option value="manager">Manager（管理預約和聯繫）</option>
              <option value="customer_service">Customer Service（客服）</option>
              <option value="marketing">Marketing（行銷）</option>
              <option value="editor">Editor（編輯）</option>
              <option value="user">User（普通使用者）</option>
            </select>
          </div>

          {message && (
            <div className="p-3 rounded-md bg-gray-100 text-sm text-gray-700">
              {message}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || updateRoleMutation.isPending}
            className="w-full"
          >
            {isLoading || updateRoleMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                設定中...
              </>
            ) : (
              "設定角色"
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-md text-sm text-blue-800">
          <p className="font-semibold mb-2">💡 使用說明：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>輸入使用者的 Email</li>
            <li>選擇要分配的角色</li>
            <li>點擊「設定角色」按鈕</li>
            <li>使用者下次登入時會獲得新的權限</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
