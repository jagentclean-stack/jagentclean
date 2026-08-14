import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "./ThemeContext";

describe("ThemeProvider SSR 相容性", () => {
  it("在沒有瀏覽器 localStorage 的伺服器環境仍可安全渲染", () => {
    expect(() => renderToStaticMarkup(<ThemeProvider defaultTheme="light" switchable><span>內容</span></ThemeProvider>)).not.toThrow();
  });
});
