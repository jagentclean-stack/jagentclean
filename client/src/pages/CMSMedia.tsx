import React, { type ChangeEvent, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Copy, Image as ImageIcon, Video, Pencil } from "lucide-react";

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
const MAX_MEDIA_BYTES = 20 * 1024 * 1024;

function splitTags(value: string) {
  return Array.from(new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))).slice(0, 20);
}

function readTags(value: unknown) {
  return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === "string") : [];
}

export default function CMSMedia() {
  const { user, isAuthenticated } = useAuth();
  const [category, setCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMedia, setEditingMedia] = useState<{ id: number; filename: string; category?: string | null; alt?: string | null; tags?: unknown } | null>(null);
  const [editFilename, setEditFilename] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: media, isLoading, refetch } = trpc.cms.media.list.useQuery(undefined, {
    enabled: isAuthenticated && ["admin", "editor"].includes(user?.role || ""),
  });

  const deleteMutation = trpc.cms.media.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const uploadMutation = trpc.cms.media.upload.useMutation({
    onError: (error) => setUploadError(error.message || "上傳失敗，請稍後再試。"),
  });
  const updateMutation = trpc.cms.media.update.useMutation({
    onError: (error) => setEditError(error.message || "儲存媒體資料失敗，請稍後再試。"),
  });

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase("zh-TW");
  const filteredMedia = media?.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const searchContent = [item.filename, item.category, item.alt, ...readTags(item.tags)].filter(Boolean).join(" ").toLocaleLowerCase("zh-TW");
    return matchesCategory && (!normalizedSearch || searchContent.includes(normalizedSearch));
  });
  const categories = Array.from(new Set(media?.map((item) => item.category).filter(Boolean))) as string[];

  const handleCopyUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setUploadError("");
    if (!files.length) return;

    const invalidType = files.find((file) => !ALLOWED_MEDIA_TYPES.includes(file.type));
    if (invalidType) {
      setSelectedFiles([]);
      setUploadError(`「${invalidType.name}」格式不支援；僅支援 JPG、PNG、WebP、GIF、MP4 與 WebM。`);
      return;
    }
    const oversized = files.find((file) => file.size > MAX_MEDIA_BYTES);
    if (oversized) {
      setSelectedFiles([]);
      setUploadError(`「${oversized.name}」超過 20 MB 限制。`);
      return;
    }
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      setUploadError("請先選擇要上傳的檔案。");
      return;
    }

    try {
      setUploadError("");
      for (const selectedFile of selectedFiles) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error(`無法讀取「${selectedFile.name}」。`));
          reader.readAsDataURL(selectedFile);
        });
        await uploadMutation.mutateAsync({
          filename: selectedFile.name,
          dataUrl,
          mimeType: selectedFile.type,
          category: uploadCategory.trim() || undefined,
          alt: uploadAlt.trim() || undefined,
          tags: splitTags(uploadTags),
        });
      }
      setSelectedFiles([]);
      setUploadCategory("");
      setUploadAlt("");
      setUploadTags("");
      setIsUploadOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refetch();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上傳失敗，請稍後再試。");
    }
  };

  const closeUploadPanel = () => {
    setIsUploadOpen(false);
    setUploadError("");
  };

  const beginEdit = (item: { id: number; filename: string; category?: string | null; alt?: string | null; tags?: unknown }) => {
    setEditingMedia(item);
    setEditFilename(item.filename);
    setEditCategory(item.category || "");
    setEditAlt(item.alt || "");
    setEditTags(readTags(item.tags).join(", "));
    setEditError("");
    setEditSuccess("");
  };

  const saveMetadata = async () => {
    if (!editingMedia) return;
    try {
      setEditError("");
      setEditSuccess("");
      await updateMutation.mutateAsync({
        id: editingMedia.id,
        filename: editFilename.trim(),
        category: editCategory.trim() || null,
        alt: editAlt.trim() || null,
        tags: splitTags(editTags),
      });
      setEditSuccess("媒體資料已儲存。");
      await refetch();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "儲存媒體資料失敗，請稍後再試。");
    }
  };

  if (!isAuthenticated || !["admin", "editor"].includes(user?.role || "")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">無法存取此頁面</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">媒體中心</h1>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            上傳媒體
          </Button>
        </div>
      </div>

      {isUploadOpen && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <Card className="border-blue-100 p-5 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-800" htmlFor="media-file">檔案</label>
                <Input ref={fileInputRef} id="media-file" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={handleFileChange} disabled={uploadMutation.isPending} />
                <p className="text-xs text-gray-500">支援 JPG、PNG、WebP、GIF、MP4、WebM；可一次選多檔，單檔上限 20 MB。</p>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-800" htmlFor="media-category">分類</label>
                <Input id="media-category" value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} placeholder="例如：首頁、案例、服務" disabled={uploadMutation.isPending} />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-800" htmlFor="media-alt">替代文字</label>
                <Input id="media-alt" value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} placeholder="說明圖片內容，提升無障礙與 SEO" disabled={uploadMutation.isPending} />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-gray-800" htmlFor="media-tags">標籤</label>
                <Input id="media-tags" value={uploadTags} onChange={(event) => setUploadTags(event.target.value)} placeholder="以逗號分隔，例如：案例, 廚房" disabled={uploadMutation.isPending} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeUploadPanel} disabled={uploadMutation.isPending}>取消</Button>
                <Button onClick={handleUpload} disabled={!selectedFiles.length || uploadMutation.isPending}>
                  {uploadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  {uploadMutation.isPending ? "上傳中" : "開始上傳"}
                </Button>
              </div>
            </div>
            {selectedFiles.length > 0 && <p className="mt-4 text-sm text-gray-600">已選取 {selectedFiles.length} 個檔案：{selectedFiles.map((file) => file.name).join("、")}</p>}
            {uploadError && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{uploadError}</p>}
          </Card>
        </div>
      )}

      {editingMedia && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <Card role="dialog" aria-label="編輯媒體資料" className="border-blue-100 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div><h2 className="font-semibold text-gray-900">編輯媒體資料</h2><p className="text-sm text-gray-500">更新檔名、分類、替代文字與標籤，不會更動原始檔案網址。</p></div>
              <Button variant="outline" onClick={() => setEditingMedia(null)} disabled={updateMutation.isPending}>關閉</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><label htmlFor="edit-media-filename" className="text-sm font-medium text-gray-800">媒體名稱</label><Input id="edit-media-filename" value={editFilename} onChange={(event) => setEditFilename(event.target.value)} disabled={updateMutation.isPending} /></div>
              <div className="space-y-2"><label htmlFor="edit-media-category" className="text-sm font-medium text-gray-800">媒體分類</label><Input id="edit-media-category" value={editCategory} onChange={(event) => setEditCategory(event.target.value)} disabled={updateMutation.isPending} /></div>
              <div className="space-y-2"><label htmlFor="edit-media-alt" className="text-sm font-medium text-gray-800">替代文字</label><Input id="edit-media-alt" value={editAlt} onChange={(event) => setEditAlt(event.target.value)} disabled={updateMutation.isPending} /></div>
              <div className="space-y-2"><label htmlFor="edit-media-tags" className="text-sm font-medium text-gray-800">標籤</label><Input id="edit-media-tags" value={editTags} onChange={(event) => setEditTags(event.target.value)} placeholder="以逗號分隔" disabled={updateMutation.isPending} /></div>
            </div>
            {editError && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{editError}</p>}
            {editSuccess && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{editSuccess}</p>}
            <div className="mt-5 flex justify-end"><Button onClick={saveMetadata} disabled={!editFilename.trim() || updateMutation.isPending}>{updateMutation.isPending ? "儲存中" : "儲存中繼資料"}</Button></div>
          </Card>
        </div>
      )}

      <div className="mt-6 border-y border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button onClick={() => setCategory("all")} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${category === "all" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>全部 ({media?.length || 0})</button>
              {categories.map((itemCategory) => (
                <button key={itemCategory} onClick={() => setCategory(itemCategory)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${category === itemCategory ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                  {itemCategory} ({media?.filter((item) => item.category === itemCategory).length || 0})
                </button>
              ))}
            </div>
            <Input aria-label="搜尋媒體" className="max-w-sm bg-white" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="搜尋檔名、分類或替代文字" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : filteredMedia && filteredMedia.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMedia.map((item) => (
              <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <div className="flex aspect-video items-center justify-center overflow-hidden bg-gray-100">
                  {item.type === "image" ? <img src={item.url} alt={item.alt || item.filename} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center justify-center text-gray-400"><Video className="mb-2 h-12 w-12" /><span className="text-sm">影片</span></div>}
                </div>
                <div className="p-4">
                  <h3 className="truncate font-medium text-gray-900">{item.filename}</h3>
                  {item.category && <p className="mt-1 text-xs text-gray-500">{item.category}</p>}
                  {item.alt && <p className="mt-2 line-clamp-2 text-xs text-gray-600">{item.alt}</p>}
                  {readTags(item.tags).length > 0 && <div className="mt-2 flex flex-wrap gap-1">{readTags(item.tags).map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">#{tag}</span>)}</div>}
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCopyUrl(item.url, item.id)}><Copy className="mr-1 h-4 w-4" />{copiedId === item.id ? "已複製" : "複製"}</Button>
                    <Button size="sm" variant="outline" aria-label={`編輯 ${item.filename}`} onClick={() => beginEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => deleteMutation.mutate({ id: item.id })} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center"><ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" /><p className="text-gray-600">{media?.length ? "找不到符合條件的媒體檔案" : "無媒體檔案"}</p></Card>
        )}
      </div>
    </div>
  );
}
