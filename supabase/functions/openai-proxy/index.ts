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

// @ts-ignore: Declare Deno globally
declare const Deno: any;

const ALLOWED_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
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

  const authHeader = req.headers.get("Authorization");
  const userId = getUserIdFromJwt(authHeader) || "anon_user";

  const rl = await checkRateLimit("openai-proxy", userId, 30, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("openai-proxy", 60), {
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
    const openAiBody = obj.body;
    
    // Ensure the model matches what the client asked for (enforced by enum)
    openAiBody.model = model;

    console.log(`[openai-proxy] Received request for model: ${model}`);
    
    const openAiKey =
      Deno.env.get("OPENAI_API_KEY") ||
      Deno.env.get("EXPO_PUBLIC_OPENAI_API_KEY");

    if (!openAiKey) {
      console.error(`[openai-proxy] Missing OPENAI_API_KEY environment variable`);
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    const url = `https://api.openai.com/v1/chat/completions`;
    console.log(`[openai-proxy] Forwarding request to OpenAI...`);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAiKey}`,
      },
      body: JSON.stringify(openAiBody),
    });

    console.log(`[openai-proxy] OpenAI responded with status: ${res.status}`);
    const data = await res.json();
    
    if (!res.ok) {
      console.error(`[openai-proxy] OpenAI error response:`, JSON.stringify(data));
    } else {
      console.log(`[openai-proxy] OpenAI success, tokens used: ${data.usage?.total_tokens}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.status,
    });
  } catch (error) {
    return validationErrorResponse(error, corsHeaders);
  }
});
