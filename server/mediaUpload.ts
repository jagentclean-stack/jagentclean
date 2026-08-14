const SUPPORTED_MEDIA = {
  "image/jpeg": { type: "image" as const, extension: ".jpg" },
  "image/png": { type: "image" as const, extension: ".png" },
  "image/webp": { type: "image" as const, extension: ".webp" },
  "image/gif": { type: "image" as const, extension: ".gif" },
  "video/mp4": { type: "video" as const, extension: ".mp4" },
  "video/webm": { type: "video" as const, extension: ".webm" },
} as const;

export const MAX_MEDIA_UPLOAD_BYTES = 20 * 1024 * 1024;

export type SupportedMimeType = keyof typeof SUPPORTED_MEDIA;

function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_MEDIA, mimeType);
}

function hasExpectedFileSignature(data: Buffer, mimeType: SupportedMimeType): boolean {
  if (mimeType === "image/jpeg") {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/gif") {
    return data.length >= 6 && ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii"));
  }
  if (mimeType === "image/webp") {
    return data.length >= 12 && data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (mimeType === "video/mp4") {
    return data.length >= 8 && data.subarray(4, 8).toString("ascii") === "ftyp";
  }
  return data.length >= 4 && data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
}

export function decodeMediaUpload(dataUrl: string, mimeType: string) {
  const normalizedMimeType = mimeType.toLowerCase().trim();
  if (!isSupportedMimeType(normalizedMimeType)) {
    throw new Error("僅支援 JPG、PNG、WebP、GIF、MP4 與 WebM 檔案。");
  }

  const base64 = dataUrl.replace(/^data:[^;]+;base64,/i, "").replace(/\s/g, "");
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new Error("上傳檔案格式無效。");
  }

  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length || bytes.length > MAX_MEDIA_UPLOAD_BYTES) {
    throw new Error("檔案大小必須介於 1 Byte 至 20 MB 之間。");
  }
  if (!hasExpectedFileSignature(bytes, normalizedMimeType)) {
    throw new Error("檔案內容與宣告的格式不符。");
  }

  return { bytes, mimeType: normalizedMimeType, ...SUPPORTED_MEDIA[normalizedMimeType] };
}

export function mediaStorageFilename(filename: string, mimeType: SupportedMimeType): string {
  const baseName = filename
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return `${baseName || "media"}${SUPPORTED_MEDIA[mimeType].extension}`;
}
