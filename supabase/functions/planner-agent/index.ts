// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getUserIdFromJwt, rateLimitBody } from "../_shared/rate-limit.ts";
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODELS = ["gemini-1.5-flash", "gemini-2.0-flash"];

async function callGemini(
  geminiKey: string,
  prompt: string,
  jsonMode = false,
): Promise<string> {
  let lastErr = "";
  for (const model of MODELS) {
    try {
      const body: any = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: jsonMode ? 0.1 : 0.7,
          maxOutputTokens: jsonMode ? 60 : 200,
        },
      };
      if (jsonMode) body.generationConfig.responseMimeType = "application/json";

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (res.ok) {
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
      const errText = await res.text();
      // If we get a rate limit error (429), throw it immediately so the user sees it
      if (res.status === 429) {
        throw new Error(
          `Rate limit exceeded (${model}): Please wait 60 seconds before trying again.`,
        );
      }
      // Only continue to the next model for 503s or other generic errors
      if (res.status !== 503) throw new Error(`${model}: ${errText}`);
      lastErr = errText;
    } catch (e: any) {
      lastErr = e.message;
    }
  }
  throw new Error(`All models failed: ${lastErr}`);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit: 30 calls/min/user (planner chat can fire several steps in a row)
  const rl = await checkRateLimit("planner-agent", getUserIdFromJwt(authHeader), 30, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("planner-agent", 60), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const { step, context = {}, user_message = "" } = await req.json();
    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!geminiKey) throw new Error("Missing GOOGLE_GEMINI_API_KEY");

    const weather = context.weather ?? {};
    const wx = `${weather.tempC ?? "?"}°C, ${weather.condition ?? "pleasant"}, ${weather.rainPct ?? "?"}% rain`;
    let result: any = {};

    switch (step) {
      case "weather_text": {
        const prompt = `You are a friendly AI fashion stylist in the Look AI wardrobe app. Always respond in English. Warm and brief.\n\nUser is planning an outfit for: ${context.date} at ${context.time}.\nWeather: ${wx}.\n\nWrite exactly 2 short sentences:\n1. Comment warmly on the weather.\n2. Say you'll find the perfect outfit.\nNo questions. No lists.`;
        result.text = await callGemini(geminiKey, prompt);
        break;
      }

      case "ask_occasion": {
        const prompt = `You are a friendly AI fashion stylist in the Look AI wardrobe app. Always respond in English. Casual, warm tone.\n\nPlan: ${context.date} at ${context.time}. Weather: ${wx}.\n\nWrite ONE casual question asking what the occasion is or where they're going. Max 1-2 sentences. Don't list options.\nExample: "Where are you heading to? Let me know, so I can find the perfect outfit!"`;
        result.text = await callGemini(geminiKey, prompt);
        break;
      }

      case "parse_occasion": {
        const prompt = `Extract the occasion from: "${user_message}"\n\nRespond with ONLY valid JSON:\n{"occasion": "<Casual|Work|Formal|Party|Date|Wedding|Workout|Travel|Beach>"}\n\nRules: wedding→Wedding, work→Work, party→Party, date→Date, workout→Workout, travel→Travel, beach→Beach, formal→Formal, else→Casual`;
        const raw = await callGemini(geminiKey, prompt, true);
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
        const prompt = `You are a friendly AI fashion stylist. Always respond in English.\n\nPlan: ${context.date} at ${context.time}, Occasion: ${context.occasion}, Weather: ${wx}\nAvailable: ${clothesSummary || "general wardrobe items"}\n\nWrite 2-3 short enthusiastic sentences presenting the outfit. Be specific about why it works. End with: "Try this out — it'll look absolutely perfect! 🔥"`;
        result.text = await callGemini(geminiKey, prompt);
        break;
      }

      case "no_wardrobe": {
        const prompt = `You are a friendly AI fashion stylist. Respond in English.\n\nUser has no matching clothes for: ${context.occasion}, weather: ${wx}.\n\nWrite 2 short sympathetic sentences. Say nothing matched, encourage scanning a new item. Stay positive.`;
        result.text = await callGemini(geminiKey, prompt);
        break;
      }

      case "plan_saved": {
        const prompt = `You are a friendly AI fashion stylist. Respond in English.\n\nOutfit plan saved for ${context.date} at ${context.time}, occasion: ${context.occasion}.\n\nWrite 1-2 short celebratory sentences. Confirm plan is saved, say you'll send a reminder the day before. Use one emoji.`;
        result.text = await callGemini(geminiKey, prompt);
        break;
      }

      default:
        throw new Error(`Unknown step: ${step}`);
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[planner-agent]", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
