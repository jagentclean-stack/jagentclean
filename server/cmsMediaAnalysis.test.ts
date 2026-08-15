import { describe, expect, it, vi } from "vitest";
import { analyzeCmsMediaImage, buildCmsMediaImageAnalysisPrompt } from "./cmsMediaAnalysis";

const input = {
  imageUrl: "https://example.com/media/kitchen-before.webp",
  filename: "kitchen-before.webp",
  mimeType: "image/webp",
};

const validDraft = {
  suggestedCategory: "案例",
  suggestedAltText: "室內廚房檯面與櫥櫃的清潔作業畫面",
  suggestedFilename: "kitchen-cleaning-case.webp",
  confidence: "medium",
  reasoning: "畫面可辨識為室內廚房區域，但無法確認施工地址或實際成效。",
};

describe("CMS 媒體 AI 圖片分析草稿", () => {
  it("傳遞圖片網址並驗證結構化草稿，僅回傳建議資料", async () => {
    const runModel = vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify(validDraft) } }] })) as never;
    await expect(analyzeCmsMediaImage(input, runModel)).resolves.toEqual(validDraft);
    expect(runModel).toHaveBeenCalledWith(expect.objectContaining({
      model: "gemini-3-flash-preview",
      messages: expect.arrayContaining([expect.objectContaining({ role: "user", content: expect.arrayContaining([expect.objectContaining({ type: "image_url", image_url: { url: input.imageUrl, detail: "low" } })]) })]),
    }));
    expect(buildCmsMediaImageAnalysisPrompt(input)).toContain(".webp");
  });

  it("拒絕缺欄位、錯誤信心值或不安全檔名的模型輸出", async () => {
    const runModel = vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ ...validDraft, confidence: "certain", suggestedFilename: "folder/photo.webp" }) } }] })) as never;
    await expect(analyzeCmsMediaImage(input, runModel)).rejects.toThrow();
  });

  it("將模型失敗安全地交由呼叫端處理", async () => {
    const runModel = vi.fn(async () => { throw new Error("模型暫時無法使用"); }) as never;
    await expect(analyzeCmsMediaImage(input, runModel)).rejects.toThrow("模型暫時無法使用");
  });
});
