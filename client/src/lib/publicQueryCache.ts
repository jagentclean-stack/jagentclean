import { dehydrate, hydrate, type DehydratedState, type Query, type QueryClient } from "@tanstack/react-query";
import superjson from "superjson";

const STORAGE_KEY = "jagent-public-query-cache-v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEnvelope = {
  expiresAt: number;
  state: DehydratedState;
};

export type PublicCmsBootstrapState = {
  footer: unknown;
  menus: unknown;
  siteSettings: unknown;
};

declare global {
  interface Window {
    __JAGENT_PUBLIC_CMS_STATE__?: PublicCmsBootstrapState;
  }
}

function isPublicCmsQuery(query: Query) {
  return JSON.stringify(query.queryKey).includes("publicContent");
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/** Restores only previously serialised public CMS data; authenticated data is never persisted. */
export function restorePublicQueryCache(queryClient: QueryClient) {
  if (!canUseSessionStorage()) return;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const cached = superjson.parse<CacheEnvelope>(raw);
    if (!cached?.expiresAt || cached.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    hydrate(queryClient, cached.state);
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}

/** Consumes the server-rendered public payload before any live query is issued. */
export function consumePublicCmsBootstrapState(): PublicCmsBootstrapState | null {
  if (typeof window === "undefined") return null;
  const state = window.__JAGENT_PUBLIC_CMS_STATE__;
  delete window.__JAGENT_PUBLIC_CMS_STATE__;
  return state ?? null;
}

function persistPublicQueryCache(queryClient: QueryClient) {
  if (!canUseSessionStorage()) return;

  try {
    const state = dehydrate(queryClient, { shouldDehydrateQuery: isPublicCmsQuery });
    if (state.queries.length === 0) return;

    const envelope: CacheEnvelope = { expiresAt: Date.now() + CACHE_TTL_MS, state };
    window.sessionStorage.setItem(STORAGE_KEY, superjson.stringify(envelope));
  } catch {
    // Storage can be disabled or full; live tRPC queries remain the source of truth.
  }
}

/** Persists a debounced, short-lived cache after successful public CMS queries complete. */
export function enablePublicQueryCachePersistence(queryClient: QueryClient) {
  if (!canUseSessionStorage()) return () => undefined;

  let timer: number | undefined;
  return queryClient.getQueryCache().subscribe(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => persistPublicQueryCache(queryClient), 120);
  });
}

export const publicQueryCacheTestUtils = { STORAGE_KEY, CACHE_TTL_MS, isPublicCmsQuery };
