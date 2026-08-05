import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Edit2, Trash2, Plus } from "lucide-react";
import { z } from "zod";

const heroSchema = z.object({
  title: z.string().min(1, "標題為必填"),
  subtitle: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  isPublished: z.boolean().default(false),
  order: z.number().default(0),
});

type HeroFormData = z.infer<typeof heroSchema>;

export default function CMSHero() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<HeroFormData>({
    title: "",
    subtitle: "",
    backgroundImage: "",
    backgroundVideo: "",
    ctaText: "",
    ctaLink: "",
    isPublished: false,
    order: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: heroList, isLoading, refetch } = trpc.cms.hero.list.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "editor"].includes(user?.role || ""),
  });

  const createMutation = trpc.cms.hero.create.useMutation({
    onSuccess: () => {
      setFormData({
        title: "",
        subtitle: "",
        backgroundImage: "",
        backgroundVideo: "",
        ctaText: "",
        ctaLink: "",
        isPublished: false,
        order: 0,
      });
      setIsOpen(false);
      refetch();
    },
  });

  const updateMutation = trpc.cms.hero.update.useMutation({
    onSuccess: () => {
      setFormData({
        title: "",
        subtitle: "",
        backgroundImage: "",
        backgroundVideo: "",
        ctaText: "",
        ctaLink: "",
        isPublished: false,
        order: 0,
      });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    },
  });

  const deleteMutation = trpc.cms.hero.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      heroSchema.parse(formData);

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
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

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || "",
      subtitle: item.subtitle || "",
      backgroundImage: item.backgroundImage || "",
      backgroundVideo: item.backgroundVideo || "",
      ctaText: item.ctaText || "",
      ctaLink: item.ctaLink || "",
      isPublished: item.isPublished || false,
      order: item.order || 0,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除此 Hero 區塊嗎？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      setFormData({
        title: "",
        subtitle: "",
        backgroundImage: "",
        backgroundVideo: "",
        ctaText: "",
        ctaLink: "",
        isPublished: false,
        order: 0,
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
        <h1 className="text-3xl font-bold">首頁 Hero 區塊管理</h1>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="w-4 h-4 mr-2" />
              新增 Hero
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "編輯 Hero 區塊" : "新增 Hero 區塊"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">標題 *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="輸入 Hero 標題"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">副標題</label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="輸入副標題"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">背景圖片 URL</label>
                <Input
                  value={formData.backgroundImage}
                  onChange={(e) => setFormData({ ...formData, backgroundImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">背景影片 URL</label>
                <Input
                  value={formData.backgroundVideo}
                  onChange={(e) => setFormData({ ...formData, backgroundVideo: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CTA 按鈕文字</label>
                <Input
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="例如：立即預約"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CTA 按鈕連結</label>
                <Input
                  value={formData.ctaLink}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  placeholder="https://example.com/booking"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">排序</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  placeholder="0"
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

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : heroList && heroList.length > 0 ? (
        <div className="space-y-4">
          {heroList.map((item: any) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.subtitle && (
                    <p className="text-gray-600 text-sm mt-1">{item.subtitle}</p>
                  )}
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    {item.backgroundImage && (
                      <p>背景圖片: {item.backgroundImage.substring(0, 50)}...</p>
                    )}
                    {item.ctaText && (
                      <p>CTA: {item.ctaText}</p>
                    )}
                    <p>排序: {item.order} | 狀態: {item.isPublished ? "✅ 已發布" : "❌ 未發布"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isOpen && editingId === item.id} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-gray-500">
          <p>還沒有 Hero 區塊</p>
        </Card>
      )}
    </div>
  );
}
