// ─── Shared API error types + user-facing message mapping ─────────────────────
// Ports the mapping previously living in the (unused) ErrorHandler.ts so every
// fetch path — Supabase reads, edge functions, external APIs — fails in the
// same, user-readable way.

/** Error with an HTTP status + retryability, produced by request() / fetch paths. */
export class ApiError extends Error {
  readonly status: number;
  readonly retryable: boolean;
  readonly code: string;

  constructor(message: string, status: number, retryable = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryable = retryable;
    this.code = String(status);
  }
}

/** Backoff delay (ms) for the Nth retry: 1s, 2s, 4s, ... */
export function backoffDelay(attempt: number): number {
  return 1000 * 2 ** attempt;
}

/** Sleep helper for retry loops. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True when the error is worth retrying (network blip, timeout, 429, 5xx). */
export function isTransientError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.retryable;
  }

  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const msg = error.message.toLowerCase();
    if (name === "aborterror") return true; // request() timeout abort
    return (
      msg.includes("network request failed") ||
      msg.includes("failed to fetch") ||
      msg.includes("fetch failed") ||
      msg.includes("network") ||
      msg.includes("timeout")
    );
  }

  return false;
}

/** Map a thrown value to a short, user-facing message. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message || `Request failed (${error.status})`;
  }

  const err = error instanceof Error ? error : null;
  const msg = (err?.message ?? String(error)).toLowerCase();

  if (msg.includes("too small") || msg.includes("invalid image")) {
    return "Image too small. Please use a clearer photo.";
  }
  if (msg.includes("background removal")) {
    return "Background removal failed. Try a simpler background.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "You're going a little fast. Please wait and try again.";
  }
  if (
    msg.includes("timeout") ||
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("fetch failed")
  ) {
    return "Network timeout. Check your connection and retry.";
  }
  if (err?.name === "AbortError") {
    return "The request timed out. Please try again.";
  }
  return err?.message || "Something went wrong. Please try again.";
}
