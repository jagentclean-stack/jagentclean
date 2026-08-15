import { z } from "zod";
import { invokeLLM, type InvokeResult } from "./_core/llm";

export const cmsMediaImageAnalysisInputSchema = z.object({
  imageUrl: z.string().url("圖片網址格式不正確"),
  filename: z.string().trim().min(1, "圖片檔名不可空白").max(255),
  mimeType: z.string().trim().max(100).nullable().optional(),
});

export type CmsMediaImageAnalysisInput = z.infer<typeof cmsMediaImageAnalysisInputSchema>;

export const cmsMediaImageAnalysisDraftSchema = z.object({
  suggestedCategory: z.string().trim().min(1).max(80),
  suggestedAltText: z.string().trim().min(1).max(240),
  suggestedFilename: z.string().trim().min(1).max(255).refine(
    (value) => !/[\\/\u0000-\u001f]/.test(value),
    "建議檔名不可包含路徑或控制字元",
  ),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string().trim().min(1).max(500),
});

export type CmsMediaImageAnalysisDraft = z.infer<typeof cmsMediaImageAnalysisDraftSchema>;

export const CMS_MEDIA_IMAGE_ANALYSIS_OUTPUT_SCHEMA = {
  name: "cms_media_image_analysis_draft",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["suggestedCategory", "suggestedAltText", "suggestedFilename", "confidence", "reasoning"],
    properties: {
      suggestedCategory: { type: "string" },
      suggestedAltText: { type: "string" },
      suggestedFilename: { type: "string" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      reasoning: { type: "string" },
    },
  },
} as const;

type ModelInvoker = (params: Parameters<typeof invokeLLM>[0]) => Promise<InvokeResult>;

function preserveExtension(filename: string) {
  const suffix = filename.match(/(\.[a-z0-9]{1,12})$/i)?.[1];
  return suffix ? `原檔副檔名為 ${suffix}，建議檔名必須保留相同副檔名。` : "原檔沒有可辨識副檔名；建議檔名不得自行加入副檔名。";
}

export function buildCmsMediaImageAnalysisPrompt(input: CmsMediaImageAnalysisInput) {
  return [
    "你是潔特務清潔 CMS 的媒體中繼資料編輯。請使用繁體中文，僅根據圖片中可見的內容產生『尚未套用』的中繼資料建議。",
    "此結果只是草稿，絕對不會直接寫入媒體資料；使用者必須人工檢查、套用並另行儲存。",
    "不得猜測人物身分、地址、客戶名稱、施工成果、價格、健康或安全效果，也不得將無法確認的內容描述為事實。畫面不足以判斷時，請選擇低信心並以保守、中性的文字描述。",
    "suggestedCategory 請使用簡潔的 CMS 分類，例如：首頁、服務、案例、品牌、團隊、文章或其他。",
    "suggestedAltText 必須描述實際可見畫面，適合無障礙與 SEO，避免關鍵字堆砌與宣傳性承諾。",
    "suggestedFilename 請用簡潔、小寫英文與連字號組成，描述畫面主題，不可包含路徑或資料夾。",
    preserveExtension(input.filename),
    `目前檔名：${input.filename}`,
    `媒體格式：${input.mimeType || "未提供"}`,
  ].join("\n");
}

export function parseCmsMediaImageAnalysisDraft(content: string): CmsMediaImageAnalysisDraft {
  return cmsMediaImageAnalysisDraftSchema.parse(JSON.parse(content));
}

export async function analyzeCmsMediaImage(
  rawInput: CmsMediaImageAnalysisInput,
  runModel: ModelInvoker = invokeLLM,
): Promise<CmsMediaImageAnalysisDraft> {
  const input = cmsMediaImageAnalysisInputSchema.parse(rawInput);
  const result = await runModel({
    model: "gemini-3-flash-preview",
    maxTokens: 700,
    outputSchema: CMS_MEDIA_IMAGE_ANALYSIS_OUTPUT_SCHEMA,
    messages: [
      { role: "system", content: "你只能回傳符合指定 JSON 結構的內容。" },
      {
        role: "user",
        content: [
          { type: "text", text: buildCmsMediaImageAnalysisPrompt(input) },
          { type: "image_url", image_url: { url: input.imageUrl, detail: "low" } },
        ],
      },
    ],
  });
  const content = result.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("AI 圖片分析服務未回傳可讀取的草稿內容");
  return parseCmsMediaImageAnalysisDraft(content);
}
