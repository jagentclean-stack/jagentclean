import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit2, Trash2, ChevronDown } from "lucide-react";
import { z } from "zod";

const faqSchema = z.object({
  question: z.string().min(1, "問題必填"),
  answer: z.string().min(1, "答案必填"),
  category: z.string().optional(),
  order: z.number().default(0),
});

type FAQFormData = z.infer<typeof faqSchema>;

export default function CMSFAQs() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FAQFormData>({
    question: "",
    answer: "",
    category: "",
    order: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: faqs, isLoading, refetch } = trpc.cms.faqs.list.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "editor"].includes(user?.role || ""),
  });

  const createMutation = trpc.cms.faqs.create.useMutation({
    onSuccess: () => {
      setFormData({
        question: "",
        answer: "",
        category: "",
        order: 0,
      });
      setIsOpen(false);
      refetch();
    },
  });

  const deleteMutation = trpc.cms.faqs.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? parseInt(value) : value,
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
      faqSchema.parse(formData);
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

  if (!isAuthenticated || !["admin", "editor"].includes(user?.role || "")) {
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
          <h1 className="text-3xl font-bold text-gray-900">常見問題</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增 FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新增常見問題</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    問題 *
                  </label>
                  <Input
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    placeholder="例如：你們提供哪些服務？"
                    className={errors.question ? "border-red-500" : ""}
                  />
                  {errors.question && <p className="text-red-500 text-sm mt-1">{errors.question}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    答案 *
                  </label>
                  <Textarea
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    placeholder="詳細的答案..."
                    rows={4}
                    className={errors.answer ? "border-red-500" : ""}
                  />
                  {errors.answer && <p className="text-red-500 text-sm mt-1">{errors.answer}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      分類
                    </label>
                    <Input
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="例如：服務"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      排序
                    </label>
                    <Input
                      name="order"
                      type="number"
                      value={formData.order}
                      onChange={handleInputChange}
                    />
                  </div>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : faqs && faqs.length > 0 ? (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{faq.question}</h3>
                    {faq.categoryId && <p className="text-xs text-gray-500 mt-1">分類 ID: {faq.categoryId}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedId === faq.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {expandedId === faq.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{faq.answer}</p>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-1" />
                        編輯
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteMutation.mutate({ id: faq.id })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        刪除
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4">尚無常見問題</p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新增第一個 FAQ
                </Button>
              </DialogTrigger>
            </Dialog>
          </Card>
        )}
      </div>
    </div>
  );
}
