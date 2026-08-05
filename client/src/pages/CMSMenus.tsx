import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";

const menuSchema = z.object({
  label: z.string().min(1, "菜單標籤必填"),
  url: z.string().min(1, "URL 必填"),
  order: z.number().optional(),
  isVisible: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
  parentId: z.number().optional().nullable(),
});

type MenuFormData = z.infer<typeof menuSchema>;

export default function CMSMenus() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    label: "",
    url: "",
    order: 0,
    isVisible: true,
    openInNewTab: false,
    parentId: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: menus, isLoading, refetch } = trpc.cms.menus.list.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "manager"].includes(user?.role || ""),
  });

  const createMutation = trpc.cms.menus.create.useMutation({
    onSuccess: () => {
      setFormData({
        label: "",
        url: "",
        order: 0,
        isVisible: true,
        openInNewTab: false,
        parentId: null,
      });
      setIsOpen(false);
      refetch();
    },
  });

  const updateMutation = trpc.cms.menus.update.useMutation({
    onSuccess: () => {
      setFormData({
        label: "",
        url: "",
        order: 0,
        isVisible: true,
        openInNewTab: false,
        parentId: null,
      });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    },
  });

  const deleteMutation = trpc.cms.menus.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      menuSchema.parse(formData);

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

  const handleEdit = (menu: any) => {
    setEditingId(menu.id);
    setFormData({
      label: menu.label,
      url: menu.url,
      order: menu.order || 0,
      isVisible: menu.isVisible !== false,
      openInNewTab: menu.openInNewTab === true,
      parentId: menu.parentId || null,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此菜單項目嗎？")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      setFormData({
        label: "",
        url: "",
        order: 0,
        isVisible: true,
        openInNewTab: false,
        parentId: null,
      });
      setErrors({});
    }
  };

  if (!isAuthenticated || !["admin", "manager"].includes(user?.role || "")) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">您沒有權限存取此頁面</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">菜單管理</h1>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  label: "",
                  url: "",
                  order: 0,
                  isVisible: true,
                  openInNewTab: false,
                  parentId: null,
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              新增菜單項目
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "編輯菜單項目" : "新增菜單項目"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">菜單標籤 *</label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="例如：首頁"
                  className={errors.label ? "border-red-500" : ""}
                />
                {errors.label && <p className="text-red-500 text-sm mt-1">{errors.label}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL *</label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="例如：/services"
                  className={errors.url ? "border-red-500" : ""}
                />
                {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">排序</label>
                <Input
                  type="number"
                  value={formData.order || 0}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.isVisible}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isVisible: checked === true })
                    }
                  />
                  <span className="text-sm">顯示此菜單項目</span>
                </label>

                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.openInNewTab}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, openInNewTab: checked === true })
                    }
                  />
                  <span className="text-sm">在新標籤頁開啟</span>
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
      ) : menus && menus.length > 0 ? (
        <div className="space-y-4">
          {menus.map((menu: any) => (
            <Card key={menu.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{menu.label}</h3>
                  <p className="text-sm text-gray-600">{menu.url}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>排序: {menu.order || 0}</span>
                    <span>{menu.isVisible ? "✓ 顯示" : "✗ 隱藏"}</span>
                    {menu.openInNewTab && <span>新標籤頁開啟</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(menu)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(menu.id)}
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
          <p>還沒有菜單項目，點擊「新增菜單項目」開始建立</p>
        </Card>
      )}
    </div>
  );
}
