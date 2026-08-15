import { describe, expect, it } from "vitest";
import {
  buildCmsCopywritingPrompt,
  cmsCopywritingInputSchema,
  parseCmsCopywritingDraft,
} from "./cmsCopywriting";

const validDraft = {
  facebook: { headline: "服務紀錄", body: "依現場需求進行清潔服務。", hashtags: ["#潔特務清潔"] },
  instagram: { headline: "服務紀錄", body: "依現場需求進行清潔服務。", hashtags: ["#潔特務清潔"] },
  line: { headline: "服務紀錄", body: "依現場需求進行清潔服務。", hashtags: [] },
  googleBusiness: { headline: "服務紀錄", body: "依現場需求進行清潔服務。", hashtags: [] },
  seoArticle: {
    title: "清潔服務規劃重點",
    metaDescription: "整理本次服務情境與規劃重點。",
    outline: ["服務需求", "執行規劃", "後續建議"],
    body: "本文依已提供的服務情境整理，實際內容應由編輯確認後使用。",
  },
};

describe("CMS AI 文案草稿契約", () => {
  it("驗證輸入限制並保留選取的文案通路", () => {
    const input = cmsCopywritingInputSchema.parse({
      scenario: "完成一戶浴室除霉清潔的服務紀錄",
      keyPoints: "請勿承諾效果",
      tone: "professional",
      channels: ["facebook", "line"],
    });
    expect(input.channels).toEqual(["facebook", "line"]);
    expect(buildCmsCopywritingPrompt(input)).toContain("不得自行編造價格、優惠");
  });

  it("只接受符合結構且可供人工編輯的草稿", () => {
    expect(parseCmsCopywritingDraft(JSON.stringify(validDraft)).seoArticle.outline).toHaveLength(3);
    expect(() => parseCmsCopywritingDraft(JSON.stringify({ facebook: validDraft.facebook }))).toThrow();
  });

  it("拒絕模型回傳的無效 JSON 或不完整草稿，避免將不可信內容交給工作區呈現", () => {
    expect(() => parseCmsCopywritingDraft("not-json")).toThrow();
    expect(() => parseCmsCopywritingDraft(JSON.stringify({ ...validDraft, facebook: { headline: "缺少必要欄位" } }))).toThrow();
  });
});
