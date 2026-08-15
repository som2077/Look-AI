import { ApiError, backoffDelay, isTransientError, sleep } from "./errors";

// ─── request() — single wrapper for external HTTP calls ───────────────────────
// Adds: AbortController timeout, exponential-backoff retry on transient
// failures, JSON handling, and normalization of every failure into ApiError.
// Route all external fetch() calls (Shein, ASOS, weather, AI fallback,
// Cloudinary, planner edge function) through this so timeout/retry/error
// behavior is consistent.

export interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  /** Abort after this many ms. Default 10s. */
  timeoutMs?: number;
  /** Retries on transient failures. Default 2. Pass 0 to fail fast. */
  retries?: number;
  /** External cancellation (e.g. from a parent AbortController). */
  signal?: AbortSignal;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function wireAbort(
  timeoutMs: number,
  externalSignal?: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort);
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    },
  };
}

export async function request<T = unknown>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = "GET",
    headers,
    body,
    timeoutMs = 10_000,
    retries = 2,
    signal,
  } = options;

  let lastError: unknown;
  let attempt = 0;

  while (attempt <= retries) {
    const { signal: timeoutSignal, cleanup } = wireAbort(timeoutMs, signal);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: timeoutSignal,
      });

      if (!res.ok) {
        let detail = "";
        try {
          const json = await res.json();
          detail = json?.error ?? json?.message ?? json?.detail ?? "";
        } catch {
          // non-JSON error body — fall through to the status message
        }
        throw new ApiError(
          typeof detail === "string" && detail
            ? detail
            : `Request failed (${res.status})`,
          res.status,
          isRetryableStatus(res.status),
        );
      }

      if (res.status === 204) {
        return undefined as T;
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (attempt < retries && isTransientError(err)) {
        await sleep(backoffDelay(attempt));
        attempt++;
        continue;
      }
      throw err;
    } finally {
      cleanup();
    }
  }

  throw lastError;
}
