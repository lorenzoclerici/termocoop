import "server-only";

import { getRelatiaConfig } from "./env";

export type RelatiaAuthScheme = "Token" | "Bearer";

export class RelatiaApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly body: string;

  constructor(status: number, path: string, body: string) {
    super(`Relatia ${path} → HTTP ${status}`);
    this.name = "RelatiaApiError";
    this.status = status;
    this.path = path;
    this.body = body;
  }
}

type RelatiaFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /**
   * Auth scheme. Default: "Token" (Relatia standard).
   * Use "Bearer" only as fallback for complete-info after a 401.
   */
  authScheme?: RelatiaAuthScheme;
  signal?: AbortSignal;
};

function buildUrl(
  baseUrl: string,
  path: string,
  searchParams?: RelatiaFetchOptions["searchParams"],
): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalized}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function requestRelatia<T>(
  path: string,
  options: RelatiaFetchOptions = {},
): Promise<T> {
  const { baseUrl, token } = getRelatiaConfig();
  const scheme = options.authScheme ?? "Token";
  const url = buildUrl(baseUrl, path, options.searchParams);

  const headers: Record<string, string> = {
    Authorization: `${scheme} ${token}`,
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new RelatiaApiError(response.status, path, text);
  }

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new RelatiaApiError(
      response.status,
      path,
      `Risposta non JSON: ${text.slice(0, 200)}`,
    );
  }
}

/**
 * Standard Relatia call with Authorization: Token …
 */
export function relatiaFetch<T>(
  path: string,
  options?: Omit<RelatiaFetchOptions, "authScheme">,
): Promise<T> {
  return requestRelatia<T>(path, { ...options, authScheme: "Token" });
}

/**
 * GET /api/deals/{id}/complete-info/
 * Tries Token first; on 401 retries once with Bearer (only for this endpoint).
 */
export async function fetchDealCompleteInfo<T>(dealId: string): Promise<T> {
  const path = `/api/deals/${dealId}/complete-info/`;

  try {
    return await requestRelatia<T>(path, { authScheme: "Token" });
  } catch (error) {
    if (error instanceof RelatiaApiError && error.status === 401) {
      return requestRelatia<T>(path, { authScheme: "Bearer" });
    }
    throw error;
  }
}

export async function fetchMe<T = unknown>(): Promise<T> {
  return relatiaFetch<T>("/api/me/");
}
