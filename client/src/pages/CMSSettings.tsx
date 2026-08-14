import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Save } from "lucide-react";

const CMS_SETTING_KEYS = ["site_name", "site_description", "company_phone", "company_email", "line_id", "company_address", "facebook_url", "instagram_url", "ga_id", "meta_pixel_id", "google_map_embed", "copyright_text"] as const;
const ADMIN_EMAILS = new Set(["jagentclean@gmail.com", "emilyku0jj@gmail.com"]);

export default function CMSSettings() {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const canManageSettings = isAuthenticated && (user?.role === "admin" || ADMIN_EMAILS.has(user?.email ?? ""));

  const { data: settingsData, isLoading } = trpc.cms.settings.list.useQuery(undefined, {
    enabled: canManageSettings,
  });

  // Update settings when data is loaded
  React.useEffect(() => {
    if (settingsData) {
      const settingsMap: Record<string, string> = {};
      settingsData.forEach((setting: any) => {
        settingsMap[setting.key] = setting.value || "";
      });
      setSettings(settingsMap);
    }
  }, [settingsData]);

  const updateMutation = trpc.cms.settings.updateBatch.useMutation();

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updateMutation.mutateAsync({
        settings: Object.fromEntries(CMS_SETTING_KEYS.map((key) => [key, settings[key] ?? ""])) as Record<(typeof CMS_SETTING_KEYS)[number], string>,
      });
      setSaveMessage({ type: "success", text: "設定已儲存並同步至網站。" });
    } catch (error) {
      setSaveMessage({ type: "error", text: error instanceof Error ? error.message : "儲存失敗，請稍後再試。" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManageSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">無法存取此頁面</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">網站設定</h1>
          <Button onClick={handleSave} disabled={isSaving || updateMutation.isPending}>
            {isSaving || updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存設定
              </>
            )}
          </Button>
        </div>
        {saveMessage && (
          <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 text-sm ${saveMessage.type === "success" ? "text-emerald-700" : "text-red-700"}`} role="status">
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 基本資訊 */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">基本資訊</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    網站名稱
                  </label>
                  <Input
                    value={settings["site_name"] || ""}
                    onChange={(e) => handleInputChange("site_name", e.target.value)}
                    placeholder="潔特務清潔"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    網站描述
                  </label>
                  <Textarea
                    value={settings["site_description"] || ""}
                    onChange={(e) => handleInputChange("site_description", e.target.value)}
                    placeholder="網站的簡短描述..."
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* 聯絡資訊 */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">聯絡資訊</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    公司電話
                  </label>
                  <Input
                    value={settings["company_phone"] || ""}
                    onChange={(e) => handleInputChange("company_phone", e.target.value)}
                    placeholder="例如：02-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    公司 Email
                  </label>
                  <Input
                    type="email"
                    value={settings["company_email"] || ""}
                    onChange={(e) => handleInputChange("company_email", e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LINE ID
                  </label>
                  <Input
                    value={settings["line_id"] || ""}
                    onChange={(e) => handleInputChange("line_id", e.target.value)}
                    placeholder="LINE ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    公司地址
                  </label>
                  <Input
                    value={settings["company_address"] || ""}
                    onChange={(e) => handleInputChange("company_address", e.target.value)}
                    placeholder="例如：台北市信義區..."
                  />
                </div>
              </div>
            </Card>

            {/* 社群媒體 */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">社群媒體</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook 連結
                  </label>
                  <Input
                    value={settings["facebook_url"] || ""}
                    onChange={(e) => handleInputChange("facebook_url", e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram 連結
                  </label>
                  <Input
                    value={settings["instagram_url"] || ""}
                    onChange={(e) => handleInputChange("instagram_url", e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </Card>

            {/* 分析工具 */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">分析工具</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Analytics ID
                  </label>
                  <Input
                    value={settings["ga_id"] || ""}
                    onChange={(e) => handleInputChange("ga_id", e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Pixel ID
                  </label>
                  <Input
                    value={settings["meta_pixel_id"] || ""}
                    onChange={(e) => handleInputChange("meta_pixel_id", e.target.value)}
                    placeholder="例如：123456789"
                  />
                </div>
              </div>
            </Card>

            {/* 其他設定 */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">其他設定</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Map 嵌入代碼
                  </label>
                  <Textarea
                    value={settings["google_map_embed"] || ""}
                    onChange={(e) => handleInputChange("google_map_embed", e.target.value)}
                    placeholder="Google Map 嵌入代碼..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Copyright 文字
                  </label>
                  <Input
                    value={settings["copyright_text"] || ""}
                    onChange={(e) => handleInputChange("copyright_text", e.target.value)}
                    placeholder="© 2024 潔特務清潔。版權所有。"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
