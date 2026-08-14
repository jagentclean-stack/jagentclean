import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const publicSources = [
  "client/src/App.tsx",
  "client/src/pages/Home.tsx",
  "client/src/pages/Services.tsx",
  "client/src/pages/About.tsx",
  "client/src/pages/Cases.tsx",
  "client/src/pages/Blog.tsx",
  "client/src/pages/FAQ.tsx",
  "client/src/pages/Process.tsx",
  "client/src/pages/Contact.tsx",
  "client/src/pages/Testimonials.tsx",
  "client/src/components/Header.tsx",
  "client/src/components/Footer.tsx",
  "client/src/components/FloatingContactMenu.tsx",
  "client/src/components/AIChatAdvisor.tsx",
  "client/src/components/SEOHead.tsx",
];

const prohibitedLiterals = [
  "06-3584567",
  "jagentclean@gmail.com",
  "台南市安南區國安街45巷12號",
  "https://lin.ee/ynvoHjh",
  "王先生",
  "陳小姐",
  "林總經理",
  "科技公司 CEO",
  "連鎖咖啡店經理",
  "國際貿易公司",
];

describe("公開內容的 CMS 來源防回歸", () => {
  it("僅首頁與客戶回饋頁呈現 CMS 評論資料", () => {
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    const testimonials = readFileSync(resolve(process.cwd(), "client/src/pages/Testimonials.tsx"), "utf8");
    const pagesWithoutReviews = ["About", "Services", "Process", "FAQ", "Contact", "Cases", "Blog"]
      .map((name) => readFileSync(resolve(process.cwd(), `client/src/pages/${name}.tsx`), "utf8"))
      .join("\n");

    expect(app).toContain('path={"/"} component={Home}');
    expect(app).toContain('path={"/testimonials"} component={Testimonials}');
    expect(home).toContain("homepageContent?.reviews");
    expect(testimonials).toContain("homepage.useQuery");
    expect(pagesWithoutReviews).not.toMatch(/\breviews\b|TestimonialCard/);
  });

  it("使用中的公開頁面與全域元件不含舊聯繫資料或示例客戶評論", () => {
    const contents = publicSources.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
    prohibitedLiterals.forEach((literal) => expect(contents).not.toContain(literal));
  });

  it("評論頁只以 CMS homepage 資料映射評論並保留空白狀態", () => {
    const testimonials = readFileSync(resolve(process.cwd(), "client/src/pages/Testimonials.tsx"), "utf8");
    expect(testimonials).toContain("homepage.useQuery");
    expect(testimonials).toMatch(/reviews\.map/);
    expect(testimonials).toContain('data-testid="reviews-empty"');
  });
});
