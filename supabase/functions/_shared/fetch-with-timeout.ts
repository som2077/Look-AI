// Shared HTTP helper for edge functions. AbortController-based timeouts so
// hangs against upstream APIs (fal.ai, remove.bg, Gemini, OpenAI) don't pin
// the worker forever — Supabase kills the worker at ~150s, but we'd rather
// surface a clean 504 well before that.

export class TimeoutError extends Error {
  status = 504;
  constructor(ms: number) {
    super(`Upstream request timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export interface FetchWithTimeoutOptions {
  /** Hard timeout in ms. Default 30_000. */
  timeoutMs?: number;
  /** Number of retries on transient failure (network error or 5xx). Default 0. */
  retries?: number;
  /** Initial backoff in ms; doubled per attempt. Default 500. */
  backoffMs?: number;
}

/** Returns true if the error / status is worth retrying. */
function isRetryable(status: number, err: unknown): boolean {
  if (err instanceof TimeoutError) return true;
  // Network errors (no status) → retry once.
  if (status === 0) return true;
  // 429 / 5xx → retry.
  return status === 429 || (status >= 500 && status < 600);
}

/** Sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * fetch() with an AbortController-driven timeout and optional exponential
 * backoff retries. Throws `TimeoutError` on timeout; re-throws the last
 * upstream error after retries are exhausted.
 */
export async function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  opts: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const maxRetries = Math.max(0, opts.retries ?? 0);
  const backoff = opts.backoffMs ?? 500;
  let lastErr: unknown = null;
  let lastStatus = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // Honor any caller-provided signal too.
    const externalSignal = init.signal;
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      lastStatus = res.status;
      if (res.ok || !isRetryable(res.status, null)) {
        return res;
      }
      // Drain body so the connection is released.
      try { await res.text(); } catch { /* ignore */ }
      lastErr = new Error(`Upstream returned ${res.status}`);
    } catch (err: any) {
      lastErr = err;
      // AbortError from our controller → TimeoutError, else network error.
      if (err?.name === "AbortError") {
        lastErr = new TimeoutError(timeoutMs);
      }
    } finally {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
    }

    if (attempt < maxRetries && isRetryable(lastStatus, lastErr)) {
      await sleep(backoff * Math.pow(2, attempt));
    }
  }

  throw lastErr ?? new Error("fetchWithTimeout failed without a captured error");
}
