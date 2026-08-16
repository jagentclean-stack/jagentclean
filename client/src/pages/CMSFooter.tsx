import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Edit2 } from "lucide-react";
import { z } from "zod";

const footerSchema = z.object({
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  socialLinks: z.any().optional(),
  copyrightText: z.string().optional(),
  aboutText: z.string().optional(),
  quickLinks: z.any().optional(),
  isPublished: z.boolean().default(false),
});

type FooterFormData = z.infer<typeof footerSchema>;

export default function CMSFooter() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FooterFormData>({
    address: "",
    phone: "",
    email: "",
    socialLinks: {},
    copyrightText: "",
    aboutText: "",
    quickLinks: [],
    isPublished: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: footer, isLoading, refetch } = trpc.cms.footer.get.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "editor"].includes(user?.role || ""),
  });

  const refreshPublicFooter = async () => {
    await Promise.all([
      utils.cms.publicContent.footer.invalidate(),
      utils.cms.publicContent.siteSettings.invalidate(),
    ]);
  };

  const createMutation = trpc.cms.footer.create.useMutation({
    onSuccess: async () => {
      setIsOpen(false);
      await Promise.all([refetch(), refreshPublicFooter()]);
    },
  });

  const updateMutation = trpc.cms.footer.update.useMutation({
    onSuccess: async () => {
      setIsOpen(false);
      await Promise.all([refetch(), refreshPublicFooter()]);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      footerSchema.parse(formData);

      if (footer?.id) {
        await updateMutation.mutateAsync({
          id: footer.id,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue: any) => {
          const path = issue.path.join(".");
          newErrors[path] = issue.message;
        });
        setErrors(newErrors);
      }
    }
  };

  const handleEdit = () => {
    if (footer) {
      setFormData({
        address: footer.address || "",
        phone: footer.phone || "",
        email: footer.email || "",
        socialLinks: footer.socialLinks || {},
        copyrightText: footer.copyrightText || "",
        aboutText: footer.aboutText || "",
        quickLinks: footer.quickLinks || [],
        isPublished: footer.isPublished || false,
      });
      setIsOpen(true);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFormData({
        address: "",
        phone: "",
        email: "",
        socialLinks: {},
        copyrightText: "",
        aboutText: "",
        quickLinks: [],
        isPublished: false,
      });
      setErrors({});
    }
  };

  if (!isAuthenticated || !["admin", "editor"].includes(user?.role || "")) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">您沒有權限存取此頁面</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">頁腳管理</h1>
      </div>
      <p className="-mt-5 mb-8 text-sm text-gray-500">版權、地址、電話與 Email 儲存後會同步更新網站設定與公開頁尾，避免重複管理造成顯示不一致。</p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : footer ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">聯絡資訊</h3>
              <div className="space-y-2 text-sm">
                {footer.address && (
                  <p><span className="font-medium">地址:</span> {footer.address}</p>
                )}
                {footer.phone && (
                  <p><span className="font-medium">電話:</span> {footer.phone}</p>
                )}
                {footer.email && (
                  <p><span className="font-medium">Email:</span> {footer.email}</p>
                )}
              </div>
            </div>

            {footer.copyrightText && (
              <div>
                <h3 className="font-semibold text-lg mb-2">版權聲明</h3>
                <p className="text-sm text-gray-600">{footer.copyrightText}</p>
              </div>
            )}

            {footer.aboutText && (
              <div>
                <h3 className="font-semibold text-lg mb-2">關於我們</h3>
                <p className="text-sm text-gray-600">{footer.aboutText}</p>
              </div>
            )}

            <div className="pt-4">
              <p className="text-sm text-gray-500">
                狀態: {footer.isPublished ? "✅ 已發布" : "❌ 未發布"}
              </p>
            </div>

            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  編輯
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>編輯頁腳</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">地址</label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="輸入公司地址"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">電話</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="輸入電話號碼"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="輸入 Email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">版權聲明</label>
                    <Textarea
                      value={formData.copyrightText}
                      onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
                      placeholder="例如：© 2026 潔特務清潔。版權所有。"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">關於我們</label>
                    <Textarea
                      value={formData.aboutText}
                      onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                      placeholder="輸入關於公司的簡介"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isPublished" className="text-sm font-medium">
                      發布
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        "保存"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <p className="text-gray-500">還沒有頁腳設定</p>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button onClick={() => setFormData({
                  address: "",
                  phone: "",
                  email: "",
                  socialLinks: {},
                  copyrightText: "",
                  aboutText: "",
                  quickLinks: [],
                  isPublished: false,
                })}>
                  建立頁腳
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>建立頁腳</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">地址</label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="輸入公司地址"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">電話</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="輸入電話號碼"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="輸入 Email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">版權聲明</label>
                    <Textarea
                      value={formData.copyrightText}
                      onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
                      placeholder="例如：© 2026 潔特務清潔。版權所有。"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">關於我們</label>
                    <Textarea
                      value={formData.aboutText}
                      onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                      placeholder="輸入關於公司的簡介"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isPublished" className="text-sm font-medium">
                      發布
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          建立中...
                        </>
                      ) : (
                        "建立"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      )}
    </div>
  );
}
