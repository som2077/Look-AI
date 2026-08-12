// ASOS product feed proxy (Expo web / SSR only — not called from native).
// Validates query params, applies a fetch timeout, and normalizes failures so
// callers never see a raw upstream error shape.

const DEFAULT_TIMEOUT_MS = 10_000;

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export async function GET(request: Request) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST || "asos2.p.rapidapi.com";

  if (!apiKey) {
    return Response.json(
      { error: "Missing RAPIDAPI_KEY server env" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const store = String(url.searchParams.get("store") || "US");
  const country = String(url.searchParams.get("country") || "US");
  const categoryId = clampInt(url.searchParams.get("categoryId"), 4209, 1, 1e9);
  const limit = clampInt(url.searchParams.get("limit"), 10, 1, 50);
  const offset = clampInt(url.searchParams.get("offset"), 0, 0, 1e5);
  const sort = String(url.searchParams.get("sort") || "freshness");

  const upstream = new URL("https://asos2.p.rapidapi.com/products/v2/list");
  upstream.searchParams.set("store", store);
  upstream.searchParams.set("offset", String(offset));
  upstream.searchParams.set("categoryId", String(categoryId));
  upstream.searchParams.set("limit", String(limit));
  upstream.searchParams.set("country", country);
  upstream.searchParams.set("sort", sort);
  upstream.searchParams.set("currency", "USD");
  upstream.searchParams.set("sizeSchema", "US");
  upstream.searchParams.set("lang", "en-US");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      signal: controller.signal,
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": apiHost,
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return Response.json({ products: data.products ?? [] });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    return Response.json(
      { error: timedOut ? "Upstream timed out" : "Upstream request failed" },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
