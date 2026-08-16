/**
 * 將 CMS 文章內容轉為由 React 原生轉義的純文字段落。
 * 不使用 dangerouslySetInnerHTML，故即使內容含有惡意標籤或屬性也只會被當成文字處理。
 */
export function articleTextBlocks(content: string | null | undefined): string[] {
  if (!content) return [];

  const withParagraphBreaks = content
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6]|blockquote)\s*>/gi, "\n\n");
  const textOnly = withParagraphBreaks
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'");

  return textOnly
    .split(/\n\s*\n+/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
