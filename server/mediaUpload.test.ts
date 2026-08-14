import { describe, expect, it } from "vitest";
import { decodeMediaUpload, MAX_MEDIA_UPLOAD_BYTES, mediaStorageFilename } from "./mediaUpload";

describe("媒體上傳驗證", () => {
  it("接受具有正確 PNG 檔頭的影像資料", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = decodeMediaUpload(`data:image/png;base64,${png.toString("base64")}`, "image/png");

    expect(result.type).toBe("image");
    expect(result.mimeType).toBe("image/png");
    expect(result.bytes.equals(png)).toBe(true);
  });

  it("拒絕不支援格式、偽造格式與過大的檔案", () => {
    expect(() => decodeMediaUpload("data:image/svg+xml;base64,PHN2Zz4=", "image/svg+xml")).toThrow("僅支援");
    expect(() => decodeMediaUpload(Buffer.from("not an image").toString("base64"), "image/png")).toThrow("不符");

    const oversizedBase64 = Buffer.alloc(MAX_MEDIA_UPLOAD_BYTES + 1, 0).toString("base64");
    expect(() => decodeMediaUpload(oversizedBase64, "image/png")).toThrow("大小");
  });

  it("以安全且一致的副檔名產生儲存檔名", () => {
    expect(mediaStorageFilename("../施工照 final.PNG", "image/webp")).toBe("施工照-final.webp");
    expect(mediaStorageFilename("", "video/mp4")).toBe("media.mp4");
  });
});
