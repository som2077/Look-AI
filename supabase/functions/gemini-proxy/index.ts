// @ts-ignore: Deno import is not recognized by standard TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getUserIdFromJwt, rateLimitBody } from "../_shared/rate-limit.ts";
import {
  ValidationError,
  asEnum,
  isObject,
  readJsonBody,
  validationErrorResponse,
} from "../_shared/validate.ts";
import { fetchWithTimeout } from "../_shared/fetch-with-timeout.ts";

// @ts-ignore: Declare Deno globally
declare const Deno: any;

// Model whitelist — never forward a user-supplied model name. Restricts
// billing blast-radius if a key ever leaks.
const ALLOWED_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;
const modelEnum = asEnum(ALLOWED_MODELS);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

  // Rate limit: 30 calls/min/user (each call can fan out to 1+ Gemini requests)
  const rl = await checkRateLimit("gemini-proxy", userId, 30, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("gemini-proxy", 60), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const body = await readJsonBody(req);
    const obj = isObject(body) ? body : {};
    const model = modelEnum(obj.model, "model");
    if (!isObject(obj.body)) {
      throw new ValidationError("body", "Missing required field: body");
    }
    const geminiBody = obj.body;

    const geminiKey =
      Deno.env.get("GOOGLE_GEMINI_API_KEY") ||
      Deno.env.get("EXPO_PUBLIC_GEMINI_API_KEY");

    if (!geminiKey) {
      throw new Error("Missing GOOGLE_GEMINI_API_KEY environment variable");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiKey,
      },
      body: JSON.stringify(geminiBody),
    }, { timeoutMs: 30_000, retries: 1, backoffMs: 500 });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.status,
    });
  } catch (error) {
    return validationErrorResponse(error, corsHeaders);
  }
});
