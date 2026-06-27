export async function checkRateLimit(identifier: string) {
  try {
    const response = await fetch("/api/ratelimit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });

    if (!response.ok) {
      throw new Error("Rate limit request failed");
    }

    const result = await response.json();
    return {
      success: result.success ?? true,
      limit: result.limit ?? 10,
      remaining: result.remaining ?? 10,
      reset: result.reset ?? 0,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    return { success: true, limit: 10, remaining: 10, reset: 0 };
  }
}
