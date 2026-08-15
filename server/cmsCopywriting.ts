import { z } from "zod";
import { invokeLLM } from "./_core/llm";

const channelSchema = z.enum(["facebook", "instagram", "line", "googleBusiness", "seoArticle"]);

export const cmsCopywritingInputSchema = z.object({
  scenario: z.string().trim().min(3, "請描述本次服務情境").max(2_000),
  keyPoints: z.string().trim().max(2_000).optional().default(""),
  tone: z.enum(["professional", "warm", "concise", "premium"]),
  channels: z.array(channelSchema).min(1, "請至少選擇一種文案格式").max(5),
});

export type CmsCopywritingInput = z.infer<typeof cmsCopywritingInputSchema>;

const socialDraftSchema = z.object({
  headline: z.string().trim().max(100),
  body: z.string().trim().min(1).max(2_500),
  hashtags: z.array(z.string().trim().max(80)).max(12),
});

export const cmsCopywritingDraftSchema = z.object({
  facebook: socialDraftSchema,
  instagram: socialDraftSchema,
  line: socialDraftSchema,
  googleBusiness: socialDraftSchema,
  seoArticle: z.object({
    title: z.string().trim().max(100),
    metaDescription: z.string().trim().max(180),
    outline: z.array(z.string().trim().max(140)).min(3).max(8),
    body: z.string().trim().min(1).max(5_000),
  }),
});

export type CmsCopywritingDraft = z.infer<typeof cmsCopywritingDraftSchema>;

export const CMS_COPYWRITING_OUTPUT_SCHEMA = {
  name: "cms_marketing_copy_draft",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["facebook", "instagram", "line", "googleBusiness", "seoArticle"],
    properties: {
      facebook: socialOutputSchema(),
      instagram: socialOutputSchema(),
      line: socialOutputSchema(),
      googleBusiness: socialOutputSchema(),
      seoArticle: {
        type: "object",
        additionalProperties: false,
        required: ["title", "metaDescription", "outline", "body"],
        properties: {
          title: { type: "string" },
          metaDescription: { type: "string" },
          outline: { type: "array", items: { type: "string" } },
          body: { type: "string" },
        },
      },
    },
  },
} as const;

function socialOutputSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["headline", "body", "hashtags"],
    properties: {
      headline: { type: "string" },
      body: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
    },
  };
}

export function buildCmsCopywritingPrompt(input: CmsCopywritingInput) {
  return [
    "你是潔特務清潔的資深品牌文案編輯。使用繁體中文，為內部 CMS 產生『尚未發布』的行銷文案草稿。",
    "絕對只能依據使用者提供的服務情境與重點寫作。不得自行編造價格、優惠、服務範圍、證照、獎項、客戶評價、施工成果、健康或安全保證、案例或數據。",
    "不要寫成客戶評論或見證；若提供資料不足，請採中性、可供人工補充的描述。每份文案均為草稿，需經人工事實查核與編輯後才能發佈。",
    `語氣：${toneLabel(input.tone)}。`,
    `使用者要求重點格式：${input.channels.join("、")}。仍請依輸出結構填滿所有欄位；未被選取的格式請提供極精簡且中性的備用草稿。`,
    `服務情境：${input.scenario}`,
    `補充重點：${input.keyPoints || "未提供"}`,
  ].join("\n");
}

function toneLabel(tone: CmsCopywritingInput["tone"]) {
  return ({
    professional: "專業、清楚、可信賴",
    warm: "親切、溫暖、自然",
    concise: "精簡、直接、易讀",
    premium: "高品質、克制、企業感",
  } as const)[tone];
}

export function parseCmsCopywritingDraft(content: string): CmsCopywritingDraft {
  const parsed: unknown = JSON.parse(content);
  return cmsCopywritingDraftSchema.parse(parsed);
}

export async function generateCmsCopywritingDraft(input: CmsCopywritingInput): Promise<CmsCopywritingDraft> {
  const result = await invokeLLM({
    model: "gpt-5-mini",
    maxTokens: 3_000,
    outputSchema: CMS_COPYWRITING_OUTPUT_SCHEMA,
    messages: [
      { role: "system", content: "你只能回傳符合指定 JSON 結構的內容。" },
      { role: "user", content: buildCmsCopywritingPrompt(input) },
    ],
  });
  const content = result.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("AI 文案服務未回傳可讀取的草稿內容");
  return parseCmsCopywritingDraft(content);
}
