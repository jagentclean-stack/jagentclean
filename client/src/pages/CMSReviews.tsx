import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Star } from "lucide-react";

export default function CMSReviews() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    photo: "",
    rating: 5,
    comment: "",
    isPublished: false,
    showOnHomepage: false,
  });

  const { data: reviews, isLoading, refetch } = trpc.cms.reviews.list.useQuery();
  const createMutation = trpc.cms.reviews.create.useMutation();
  const updateMutation = trpc.cms.reviews.update.useMutation();
  const deleteMutation = trpc.cms.reviews.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        alert("評價已更新");
      } else {
        await createMutation.mutateAsync(formData);
        alert("評價已新增");
      }

      setFormData({
        name: "",
        photo: "",
        rating: 5,
        comment: "",
        isPublished: false,
        showOnHomepage: false,
      });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      alert("操作失敗，請重試");
    }
  };

  const handleEdit = (review: any) => {
    setFormData({
      name: review.name,
      photo: review.photo || "",
      rating: review.rating,
      comment: review.comment,
      isPublished: review.isPublished,
      showOnHomepage: review.showOnHomepage,
    });
    setEditingId(review.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此評價嗎？")) {
      try {
        await deleteMutation.mutateAsync({ id });
        alert("評價已刪除");
        refetch();
      } catch (error) {
        alert("刪除失敗，請重試");
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      photo: "",
      rating: 5,
      comment: "",
      isPublished: false,
      showOnHomepage: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">客戶評價管理</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="h-4 w-4 mr-2" />
              新增評價
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "編輯評價" : "新增評價"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">姓名 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="客戶姓名"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">照片 URL</label>
                <Input
                  value={formData.photo}
                  onChange={(e) =>
                    setFormData({ ...formData, photo: e.target.value })
                  }
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div>
                <label className="text-sm font-medium">星等 (1-5) *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, rating: star })
                      }
                      className={`p-2 rounded ${
                        formData.rating >= star
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">評論 *</label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  placeholder="客戶評論"
                  required
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPublished: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">已發布</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showOnHomepage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        showOnHomepage: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm">顯示在首頁</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "更新" : "新增"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  取消
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">載入中...</div>
      ) : (
        <div className="grid gap-4">
          {reviews?.map((review: any) => (
            <div
              key={review.id}
              className="border rounded-lg p-4 space-y-2 bg-white"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{review.name}</h3>
                  <div className="flex gap-1 my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    {review.isPublished && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        已發布
                      </span>
                    )}
                    {review.showOnHomepage && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        首頁顯示
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(review)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
