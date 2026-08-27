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

    console.log(\`[openai-proxy] Received request for model: \${model}, streaming: \${!!openAiBody.stream}\`);
    
    const openAiKey =
      Deno.env.get("OPENAI_API_KEY") ||
      Deno.env.get("EXPO_PUBLIC_OPENAI_API_KEY");

    if (!openAiKey) {
      console.error(\`[openai-proxy] Missing OPENAI_API_KEY environment variable\`);
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    const url = \`https://api.openai.com/v1/chat/completions\`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${openAiKey}\`,
      },
      body: JSON.stringify(openAiBody),
    });

    if (!res.ok) {
      console.error(\`[openai-proxy] OpenAI error response status: \${res.status}\`);
      const data = await res.text();
      return new Response(data, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: res.status,
      });
    }

    if (openAiBody.stream) {
      return new Response(res.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: res.status,
      });
    }
  } catch (error) {
    return validationErrorResponse(error, corsHeaders);
  }
});
