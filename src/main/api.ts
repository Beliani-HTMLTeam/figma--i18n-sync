import { API_TIMEOUT_MS, API_URL } from "./constants";
import type { ApiEnvelope, StaticTranslationType } from "./types";

const HTTP_OK = 200;

function withTimeout<T>(promise: Promise<T>, url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            `Request timed out after ${API_TIMEOUT_MS / 1000}s: ${url}`,
          ),
        ),
      API_TIMEOUT_MS,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function assertEnvelope(payload: unknown, url: string): ApiEnvelope {
  const envelope = payload as Partial<ApiEnvelope> & { message?: string };
  const hasData = typeof envelope?.data === "object" && envelope.data !== null;
  if (envelope?.code !== HTTP_OK || !hasData) {
    const reason =
      envelope?.message ?? `unexpected response (code ${envelope?.code})`;
    throw new Error(`API error for ${url}: ${reason}`);
  }
  return envelope as ApiEnvelope;
}

async function fetchEnvelope(url: string): Promise<ApiEnvelope> {
  const response = await withTimeout(fetch(url), url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return assertEnvelope(await response.json(), url);
}

function createCachedEndpoint<TArgs extends unknown[]>(
  cache: Map<string, Promise<ApiEnvelope>>,
  buildPath: (...args: TArgs) => string,
) {
  return (...args: TArgs): Promise<ApiEnvelope> => {
    const url = `${API_URL}/${buildPath(...args)}`;
    const cached = cache.get(url);
    if (cached) {
      return cached;
    }

    const request = fetchEnvelope(url).catch((error) => {
      cache.delete(url);
      throw error;
    });
    cache.set(url, request);
    return request;
  };
}

export function createApiClient() {
  const cache = new Map<string, Promise<ApiEnvelope>>();

  return {
    getStaticData: createCachedEndpoint(
      cache,
      (type: StaticTranslationType) => `static/${type}`,
    ),
    getSheetRow: createCachedEndpoint(
      cache,
      (year: string, sheetTab: string, row: string) =>
        `dynamic/${year}/${encodeURIComponent(sheetTab)}/${row}`,
    ),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
