import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { enablePublicQueryCachePersistence, publicQueryCacheTestUtils, restorePublicQueryCache } from "./publicQueryCache";

describe("public query cache", () => {
  const memoryStorage = new Map<string, string>();

  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        sessionStorage: {
          getItem: (key: string) => memoryStorage.get(key) ?? null,
          setItem: (key: string, value: string) => memoryStorage.set(key, value),
          removeItem: (key: string) => memoryStorage.delete(key),
          clear: () => memoryStorage.clear(),
        },
        setTimeout,
        clearTimeout,
      },
    });
  });

  afterEach(() => memoryStorage.clear());

  it("restores only a short-lived public CMS cache", async () => {
    const source = new QueryClient();
    const unsubscribe = enablePublicQueryCachePersistence(source);
    const key = [["cms", "publicContent", "homepage"], { type: "query" }];
    source.setQueryData(key, { headline: "測試首頁" });
    await new Promise((resolve) => setTimeout(resolve, 150));
    unsubscribe();

    const target = new QueryClient();
    restorePublicQueryCache(target);
    expect(target.getQueryData(key)).toEqual({ headline: "測試首頁" });
  });

  it("does not persist management or payroll query data", async () => {
    const source = new QueryClient();
    const unsubscribe = enablePublicQueryCachePersistence(source);
    source.setQueryData([["cms", "users", "list"], { type: "query" }], [{ email: "private@example.com" }]);
    source.setQueryData([["payroll", "employees", "list"], { type: "query" }], [{ name: "private" }]);
    await new Promise((resolve) => setTimeout(resolve, 150));
    unsubscribe();

    expect(memoryStorage.get(publicQueryCacheTestUtils.STORAGE_KEY) ?? null).toBeNull();
  });
});
