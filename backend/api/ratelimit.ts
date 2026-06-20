import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client using Expo environment variables
export const redis = new Redis({
  url: process.env.EXPO_PUBLIC_UPSTASH_REDIS_REST_URL!,
  token: process.env.EXPO_PUBLIC_UPSTASH_REDIS_REST_TOKEN!,
});

// Create a new ratelimiter that allows 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

/**
 * Helper function to check rate limit for a given identifier (e.g., userId)
 * @param identifier The user ID, IP address, or any unique string to rate limit against
 * @returns Object indicating if the request is allowed and remaining requests
 */
export async function checkRateLimit(identifier: string) {
  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // If Redis fails, we might want to let the request through (fail open) 
    // or block it (fail closed). We'll fail open here for better UX.
    return { success: true, limit: 10, remaining: 10, reset: 0 };
  }
}
