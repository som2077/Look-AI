// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getUserIdFromJwt, rateLimitBody } from "../_shared/rate-limit.ts";
import {
  ValidationError,
  asEnum,
  isObject,
  isString,
  readJsonBody,
  validationErrorResponse,
} from "../_shared/validate.ts";
import { fetchWithTimeout } from "../_shared/fetch-with-timeout.ts";
declare const Deno: any;

// Whitelist the only planner steps the client is allowed to request. An
// unknown step previously fell through to a 200 `{success:false}`.
const STEPS = [
  "weather_text",
  "ask_occasion",
  "parse_occasion",
  "suggest_outfit",
  "no_wardrobe",
  "plan_saved",
] as const;
const stepEnum = asEnum(STEPS);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function callOpenAI(
  openaiKey: string,
  prompt: string,
  jsonMode = false,
  maxTokens = 120,
): Promise<string> {
  const model = "gpt-4o-mini";
  try {
    const body: any = {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: jsonMode ? 0.1 : 0.7,
      max_tokens: maxTokens,
    };
    if (jsonMode) body.response_format = { type: "json_object" };

    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(body),
      },
      // planner-agent calls cap at 120 max_tokens; 20s is a safe upper bound.
      { timeoutMs: 20_000, retries: 1, backoffMs: 500 },
    );

    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? "";
    }
    const errText = await res.text();
    if (res.status === 429) {
      throw new Error(
        `Rate limit exceeded: Please wait 60 seconds before trying again.`,
      );
    }
    throw new Error(`OpenAI API Error: ${errText}`);
  } catch (e: any) {
    throw new Error(`OpenAI request failed: ${e.message}`);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

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

  // Rate limit: 30 calls/min/user (planner chat can fire several steps in a row)
  const rl = await checkRateLimit("planner-agent", userId, 30, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("planner-agent", 60), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const body = await readJsonBody(req);
    const obj = isObject(body) ? body : {};
    const step = stepEnum(obj.step, "step");
    const context = isObject(obj.context) ? obj.context : {};
    const user_message = isString(obj.user_message) ? obj.user_message : "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("EXPO_PUBLIC_OPENAI_API_KEY");
    if (!openaiKey) throw new Error("Missing OPENAI_API_KEY");

    const weather = context.weather ?? {};
    const wx = `${weather.tempC ?? "?"}°C, ${weather.condition ?? "pleasant"}, ${weather.rainPct ?? "?"}% rain`;
    let result: any = {};

    switch (step) {
      case "weather_text": {
        const prompt = `You are a friendly AI fashion stylist in Look AI. English, warm, brief.\nPlan: ${context.date} at ${context.time}. Weather: ${wx}.\nWrite 2 short sentences commenting on weather and finding outfit.`;
        result.text = await callOpenAI(openaiKey, prompt, false, 60);
        break;
      }

      case "ask_occasion": {
        const prompt = `You are a friendly AI fashion stylist in Look AI. Casual, warm.\nPlan: ${context.date} at ${context.time}. Weather: ${wx}.\nWrite 1 short casual question asking about the occasion/destination.`;
        result.text = await callOpenAI(openaiKey, prompt, false, 40);
        break;
      }

      case "parse_occasion": {
        const prompt = `Extract occasion from: "${user_message}"\nJSON ONLY: {"occasion": "<Casual|Work|Formal|Party|Date|Wedding|Workout|Travel|Beach>"}`;
        const raw = await callOpenAI(openaiKey, prompt, true, 25);
        try {
          result = JSON.parse(raw.trim());
        } catch {
          result = { occasion: "Casual" };
        }
        break;
      }

      case "suggest_outfit": {
        const clothesSummary = (context.clothes ?? [])
          .slice(0, 6)
          .map(
            (c: any) =>
              `${c.category ?? "item"} (${c.primary_color ?? c.primaryColor ?? c.color ?? ""})`,
          )
          .join(", ");
        const prompt = `You are a friendly AI stylist in Look AI.\nPlan: ${context.date} at ${context.time}, Occasion: ${context.occasion}, Weather: ${wx}\nAvailable: ${clothesSummary || "general items"}\nWrite 2 concise sentences presenting outfit. End: "Try this out — it'll look great! 🔥"`;
        result.text = await callOpenAI(openaiKey, prompt, false, 120);
        break;
      }

      case "no_wardrobe": {
        const prompt = `You are a friendly AI stylist. User has no matching clothes for: ${context.occasion}, weather: ${wx}.\nWrite 2 short positive sentences encouraging scanning a new item.`;
        result.text = await callOpenAI(openaiKey, prompt, false, 50);
        break;
      }

      case "plan_saved": {
        const prompt = `Outfit plan saved for ${context.date} at ${context.time}, occasion: ${context.occasion}.\nWrite 1 short celebratory confirmation sentence with 1 emoji.`;
        result.text = await callOpenAI(openaiKey, prompt, false, 45);
        break;
      }

      default:
        throw new Error(`Unknown step: ${step}`);
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[planner-agent]", error);
    // Client-caused failures (bad JSON, unknown step, bad field) → 400.
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, corsHeaders);
    }
    // Gemini / env failures are server-side → 500, no longer a fake 200.
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
