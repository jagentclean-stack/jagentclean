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

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  canonical: z.string().optional(),
  ogImage: z.string().optional(),
});

type SEOFormData = z.infer<typeof seoSchema>;

export default function CMSSEO() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SEOFormData>({
    title: "",
    description: "",
    keywords: "",
    canonical: "",
    ogImage: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: seoList, isLoading, refetch } = trpc.cms.seo.list.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "editor"].includes(user?.role || ""),
  });

  const updateMutation = trpc.cms.seo.update.useMutation({
    onSuccess: () => {
      setFormData({
        title: "",
        description: "",
        keywords: "",
        canonical: "",
        ogImage: "",
      });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!editingId) {
      alert("請先選擇要編輯的 SEO 設定");
      return;
    }

    try {
      seoSchema.parse(formData);
      await updateMutation.mutateAsync({
        id: editingId,
        ...formData,
      });
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

  const handleEdit = (seo: any) => {
    setEditingId(seo.id);
    setFormData({
      title: seo.title || "",
      description: seo.description || "",
      keywords: seo.keywords || "",
      canonical: seo.canonical || "",
      ogImage: seo.ogImage || "",
    });
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        keywords: "",
        canonical: "",
        ogImage: "",
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
        <h1 className="text-3xl font-bold">SEO 管理</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : seoList && seoList.length > 0 ? (
        <div className="space-y-4">
          {seoList.map((seo: any) => (
            <Card key={seo.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {seo.slug || `SEO 設定 #${seo.id}`}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {seo.title && (
                      <p>
                        <span className="font-medium">Title:</span> {seo.title}
                      </p>
                    )}
                    {seo.description && (
                      <p>
                        <span className="font-medium">Description:</span> {seo.description.substring(0, 100)}...
                      </p>
                    )}
                    {seo.keywords && (
                      <p>
                        <span className="font-medium">Keywords:</span> {seo.keywords}
                      </p>
                    )}
                  </div>
                </div>
                <Dialog open={isOpen && editingId === seo.id} onOpenChange={handleOpenChange}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(seo)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>編輯 SEO 設定 - {seo.slug || `#${seo.id}`}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Meta Title</label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="頁面標題（50-60 個字元）"
                          maxLength={60}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.title?.length || 0}/60
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Meta Description</label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="頁面描述（150-160 個字元）"
                          maxLength={160}
                          rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.description?.length || 0}/160
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Keywords</label>
                        <Input
                          value={formData.keywords}
                          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                          placeholder="關鍵字（以逗號分隔）"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Canonical URL</label>
                        <Input
                          value={formData.canonical}
                          onChange={(e) => setFormData({ ...formData, canonical: e.target.value })}
                          placeholder="https://example.com/page"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">OG Image URL</label>
                        <Input
                          value={formData.ogImage}
                          onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
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
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
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
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-gray-500">
          <p>還沒有 SEO 設定</p>
        </Card>
      )}
    </div>
  );
}
