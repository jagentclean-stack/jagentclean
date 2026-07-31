import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1, "服務名稱必填"),
  slug: z.string().min(1, "URL Slug 必填"),
  description: z.string().optional(),
  icon: z.string().optional(),
  bannerImage: z.string().optional(),
  basePrice: z.string().optional(),
  pricePerUnit: z.string().optional(),
  unit: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function CMSServices() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    slug: "",
    description: "",
    icon: "",
    bannerImage: "",
    basePrice: "",
    pricePerUnit: "",
    unit: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: services, isLoading, refetch } = trpc.cms.services.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createMutation = trpc.cms.services.create.useMutation({
    onSuccess: () => {
      setFormData({
        name: "",
        slug: "",
        description: "",
        icon: "",
        bannerImage: "",
        basePrice: "",
        pricePerUnit: "",
        unit: "",
      });
      setIsOpen(false);
      refetch();
    },
  });

  const deleteMutation = trpc.cms.services.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      serviceSchema.parse(formData);
      setErrors({});
      await createMutation.mutateAsync(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        (error as any).issues?.forEach((issue: any) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  if (!isAuthenticated || user?.role !== "admin") {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">服務管理</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增服務
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增服務</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    服務名稱 *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="例如：居家清潔"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug *
                  </label>
                  <Input
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="例如：home-cleaning"
                    className={errors.slug ? "border-red-500" : ""}
                  />
                  {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    服務介紹
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="詳細的服務介紹..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      基礎價格
                    </label>
                    <Input
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleInputChange}
                      placeholder="例如：2000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      每單位價格
                    </label>
                    <Input
                      name="pricePerUnit"
                      value={formData.pricePerUnit}
                      onChange={handleInputChange}
                      placeholder="例如：500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    計價單位
                  </label>
                  <Input
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    placeholder="例如：坪、小時"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
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
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.slug}</p>
                {service.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                )}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit2 className="w-4 h-4 mr-1" />
                    編輯
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => deleteMutation.mutate({ id: service.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    刪除
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4">尚無服務項目</p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新增第一個服務
                </Button>
              </DialogTrigger>
            </Dialog>
          </Card>
        )}
      </div>
    </div>
  );
}
