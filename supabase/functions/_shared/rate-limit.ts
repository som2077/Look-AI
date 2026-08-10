// Fixed-window rate limiter backed by Upstash Redis REST API.
//
// Design:
//  - Key: `rl::{fn}::{userId}` — one counter per user per function.
//  - Fixed window: Redis INCR, then EXPIRE set on the first hit of a window.
//    When the counter is over the limit, the caller gets a 429 with Retry-After.
//  - Fail-open: if the Upstash env vars are missing or the REST call throws, the
//    request is ALLOWED. Rate limiting must never become an availability risk.
//
// Env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (also read with the
// EXPO_PUBLIC_ prefix for compatibility with the app's existing .env).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export interface RateLimitResult {
  allowed: boolean;
  status?: number;
  headers: Record<string, string>;
}

/** Extract the `sub` (user id) from a Bearer JWT without verifying it. */
export function getUserIdFromJwt(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return payload?.sub ?? payload?.userId ?? null;
  } catch {
    return null;
  }
}

export async function checkRateLimit(
  fnName: string,
  userId: string | null,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  // No user -> can't key the counter; let auth (upstream) handle it.
  if (!userId) return { allowed: true, headers: CORS };

  const url =
    Deno.env.get("UPSTASH_REDIS_REST_URL") ||
    Deno.env.get("EXPO_PUBLIC_UPSTASH_REDIS_REST_URL");
  const token =
    Deno.env.get("UPSTASH_REDIS_REST_TOKEN") ||
    Deno.env.get("EXPO_PUBLIC_UPSTASH_REDIS_REST_TOKEN");

  // Not configured -> fail open.
  if (!url || !token) return { allowed: true, headers: CORS };

  const key = `rl:${fnName}:${userId}`;

  try {
    const incrRes = await fetch(`${url}/incr/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const incrJson = await incrRes.json();
    const count =
      typeof incrJson?.result === "number" ? incrJson.result : NaN;

    if (count === 1) {
      // First hit in this window — set TTL (best-effort, one extra REST call).
      await fetch(`${url}/expire/${key}/${windowSeconds}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    if (!Number.isFinite(count)) {
      console.warn(`[rate-limit] Unexpected Upstash response for ${fnName}`);
      return { allowed: true, headers: CORS };
    }

    if (count > limit) {
      return {
        allowed: false,
        status: 429,
        headers: {
          ...CORS,
          "Content-Type": "application/json",
          "Retry-After": String(windowSeconds),
        },
      };
    }

    return { allowed: true, headers: CORS };
  } catch (err) {
    console.warn(`[rate-limit] Upstash error (fail-open) for ${fnName}:`, err);
    return { allowed: true, headers: CORS };
  }
}

/** Convenience: JSON body for a 429 response. */
export function rateLimitBody(fnName: string, windowSeconds: number) {
  return JSON.stringify({
    error: `Rate limit exceeded for ${fnName}. Please retry in ${windowSeconds}s.`,
  });
}
