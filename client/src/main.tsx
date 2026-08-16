import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { getQueryKey } from "@trpc/react-query";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import { consumePublicCmsBootstrapState, enablePublicQueryCachePersistence, restorePublicQueryCache } from "./lib/publicQueryCache";
import "./index.css";

const queryClient = new QueryClient();
// 先還原短期工作階段快取，再以每次 HTML 導覽隨附的最新伺服器資料覆蓋。
// 若順序相反，舊的 sessionStorage 可能會在設定已儲存後重新顯示舊版頁尾文字。
restorePublicQueryCache(queryClient);
const publicBootstrap = consumePublicCmsBootstrapState();
if (publicBootstrap) {
  queryClient.setQueryData(getQueryKey(trpc.cms.publicContent.footer), publicBootstrap.footer);
  queryClient.setQueryData(getQueryKey(trpc.cms.publicContent.menus), publicBootstrap.menus);
  queryClient.setQueryData(getQueryKey(trpc.cms.publicContent.siteSettings), publicBootstrap.siteSettings);
}
enablePublicQueryCachePersistence(queryClient);

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

// Parallax effect is deliberately registered only in the browser. The guarded
// entry keeps this module reusable by the future server renderer.
if (typeof window !== "undefined") {
  window.addEventListener("scroll", () => {
    const parallaxElements = document.querySelectorAll("[style*=\"--parallax-offset\"]");
    parallaxElements.forEach((element) => {
      const offset = window.scrollY * 0.3;
      (element as HTMLElement).style.setProperty("--parallax-offset", `${offset}px`);
    });
  }, { passive: true });
}
