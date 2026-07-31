import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit2, Trash2, Calendar, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().min(1, "標題必填"),
  slug: z.string().min(1, "URL Slug 必填"),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  isPublished: z.boolean().default(false),
});

type BlogFormData = z.infer<typeof blogSchema>;

export default function CMSBlogs() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    isPublished: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: blogs, isLoading, refetch } = trpc.cms.blogs.list.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "editor", "marketing"].includes(user?.role || ""),
  });

  const createMutation = trpc.cms.blogs.create.useMutation({
    onSuccess: () => {
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        isPublished: false,
      });
      setIsOpen(false);
      refetch();
    },
  });

  const deleteMutation = trpc.cms.blogs.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const togglePublishMutation = trpc.cms.blogs.update.useMutation({
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
      blogSchema.parse(formData);
      setErrors({});
      await createMutation.mutateAsync(formData as any);
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

  if (!isAuthenticated || !["admin", "editor", "marketing"].includes(user?.role || "")) {
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
          <h1 className="text-3xl font-bold text-gray-900">文章管理</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增文章
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增文章</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    標題 *
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="例如：浴室清潔的最佳實踐"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Slug *
                  </label>
                  <Input
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="例如：bathroom-cleaning-best-practices"
                    className={errors.slug ? "border-red-500" : ""}
                  />
                  {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    摘要
                  </label>
                  <Textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="文章摘要..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    內容
                  </label>
                  <Textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="文章內容..."
                    rows={6}
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
        ) : blogs && blogs.length > 0 ? (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <Card key={blog.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{blog.title}</h3>
                      {blog.isPublished ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    {blog.excerpt && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{blog.excerpt}</p>
                    )}
                    {blog.publishedAt && (
                      <div className="flex items-center text-gray-500 text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(blog.publishedAt).toLocaleDateString("zh-TW")}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-1" />
                      編輯
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        togglePublishMutation.mutate({
                          id: blog.id,
                          isPublished: !blog.isPublished,
                        } as any)
                      }
                      disabled={togglePublishMutation.isPending}
                    >
                      {blog.isPublished ? "取消發布" : "發布"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteMutation.mutate({ id: blog.id })}
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
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4">尚無文章</p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新增第一篇文章
                </Button>
              </DialogTrigger>
            </Dialog>
          </Card>
        )}
      </div>
    </div>
  );
}
