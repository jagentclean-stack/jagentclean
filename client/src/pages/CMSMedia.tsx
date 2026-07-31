import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Copy, Image as ImageIcon, Video } from "lucide-react";

export default function CMSMedia() {
  const { user, isAuthenticated } = useAuth();
  const [category, setCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: media, isLoading, refetch } = trpc.cms.media.list.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "editor"].includes(user?.role || ""),
  });

  const deleteMutation = trpc.cms.media.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const filteredMedia = media?.filter((item) => {
    if (category === "all") return true;
    return item.category === category;
  });

  const categories = Array.from(new Set(media?.map((m) => m.category).filter(Boolean))) as string[];

  const handleCopyUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          <h1 className="text-3xl font-bold text-gray-900">媒體中心</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            上傳媒體
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCategory("all")}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
                category === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              全部 ({media?.length || 0})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat || "all")}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
                  category === cat
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {cat} ({media?.filter((m) => m.category === cat).length || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : filteredMedia && filteredMedia.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedia.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.alt || item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Video className="w-12 h-12 mb-2" />
                      <span className="text-sm">影片</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">{item.filename}</h3>
                  {item.category && (
                    <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                  )}
                  {item.alt && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{item.alt}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCopyUrl(item.url, item.id)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {copiedId === item.id ? "已複製" : "複製"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteMutation.mutate({ id: item.id })}
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
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">無媒體檔案</p>
          </Card>
        )}
      </div>
    </div>
  );
}
