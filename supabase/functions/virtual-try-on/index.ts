import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getUserIdFromJwt, rateLimitBody } from "../_shared/rate-limit.ts";
import {
  asEnum,
  isObject,
  isRequiredString,
  readJsonBody,
} from "../_shared/validate.ts";
import { fetchWithTimeout, TimeoutError } from "../_shared/fetch-with-timeout.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const photoTypeEnum = asEnum(["model", "flat-lay"] as const);
const categoryEnum = asEnum(["tops", "bottoms", "footwear"] as const);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: require a real user JWT (Clerk "supabase" template, carries `sub`).
  // Supabase's verify_jwt accepts anon keys (they're project-signed JWTs), so
  // gate on the presence of a user id to block anon-key / service-role abuse.
  const authHeader = req.headers.get("Authorization");
  const userId = getUserIdFromJwt(authHeader);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit: 5 calls/min/user (each call = one paid fal.ai generation)
  const rl = await checkRateLimit("virtual-try-on", userId, 5, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("virtual-try-on", 60), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const body = await readJsonBody(req);
    const obj = isObject(body) ? body : {};
    const person_image_url = isRequiredString(
      obj.person_image_url,
      "person_image_url",
    );
    const garment_image_url = isRequiredString(
      obj.garment_image_url,
      "garment_image_url",
    );
    const garment_photo_type = photoTypeEnum(
      obj.garment_photo_type ?? "model",
      "garment_photo_type",
    );
    const garment_category = categoryEnum(
      obj.garment_category ?? "tops",
      "garment_category",
    );

    // Map footwear to auto for fal.ai compatibility
    const mappedCategory =
      garment_category === "footwear" ? "auto" : garment_category;

    const falKey = Deno.env.get("FAL_KEY");
    if (!falKey) {
      return new Response(
        JSON.stringify({ error: "FAL_KEY environment variable is missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Call fal.ai API. Try-on generation can take 30-60s; abort after 45s
    // and retry once on transient failure so a single slow request doesn't
    // burn the full ~150s Supabase worker budget.
    let falResponse: Response;
    try {
      falResponse = await fetchWithTimeout(
        "https://fal.run/fal-ai/fashn/tryon/v1.6",
        {
          method: "POST",
          headers: {
            Authorization: `Key ${falKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model_image: person_image_url,
            garment_image: garment_image_url,
            garment_photo_type: garment_photo_type || "model",
            category: mappedCategory || "tops",
          }),
        },
        { timeoutMs: 45_000, retries: 1, backoffMs: 1000 },
      );
    } catch (err: any) {
      const isTimeout = err instanceof TimeoutError;
      console.error(`fal.ai ${isTimeout ? "timeout" : "error"}:`, err?.message);
      return new Response(
        JSON.stringify({
          error: isTimeout
            ? "Try-on took too long. Please try again with a clearer photo."
            : `fal.ai request failed: ${err?.message ?? "unknown"}`,
        }),
        {
          status: isTimeout ? 504 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      console.error("fal.ai error:", errorText);
      return new Response(
        JSON.stringify({ error: `fal.ai request failed: ${errorText}` }),
        {
          status: falResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const falData = await falResponse.json();

    // Extract the image URL. fal.ai generally returns either `{ images: [{ url: "..." }] }` or `{ image: { url: "..." } }`
    // We'll check common patterns.
    let resultUrl = "";
    if (falData.images && falData.images.length > 0) {
      resultUrl = falData.images[0].url;
    } else if (falData.image && falData.image.url) {
      resultUrl = falData.image.url;
    } else {
      console.error("Unexpected fal.ai response structure:", falData);
      return new Response(
        JSON.stringify({
          error: "Unexpected response structure from fal.ai",
          data: falData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ resultUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: error?.status ? error.message : "Internal Server Error",
        details: error.message,
      }),
      {
        status: error?.status ?? 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
