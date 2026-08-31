// @ts-ignore: Deno import is not recognized by standard TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { serializeCareSymbolsForPrompt } from "../_shared/careSymbols.ts";
import { checkRateLimit, getUserIdFromJwt, rateLimitBody } from "../_shared/rate-limit.ts";
import {
  isRequiredString,
  readJsonBody,
} from "../_shared/validate.ts";
import { loadPrompt, renderPrompt } from "../_shared/prompt-loader.ts";
import { fetchWithTimeout } from "../_shared/fetch-with-timeout.ts";

// @ts-ignore: Declare Deno globally
declare const Deno: any;

// Hoisted env — re-read on every request was a tiny waste per scan.
const OPENAI_API_KEY =
  Deno.env.get("OPENAI_API_KEY") ||
  Deno.env.get("EXPO_PUBLIC_OPENAI_API_KEY") ||
  "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Load the cloth label OCR prompt configuration
const promptConfig = loadPrompt("cloth_label_ocr");

function buildSystemPrompt(): string {
  const systemPrompt = promptConfig.system_prompt as string;
  const userTemplate = promptConfig.user_template as string;
  return `${systemPrompt}\n\n${userTemplate}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: require a real user JWT (Clerk "supabase" template, carries `sub`).
  // Supabase's verify_jwt accepts anon keys (they're project-signed JWTs), so
  // gate on the presence of a user id to block anon-key / service-role abuse.
  const authHeader = req.headers.get("Authorization");
  const userId = getUserIdFromJwt(authHeader) || "anon_user";

  // Rate limit: 10 scans/min/user
  const rl = await checkRateLimit("cloth-label-scan", userId, 10, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("cloth-label-scan", 60), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const body = await readJsonBody(req) as Record<string, unknown>;
    const base64Image = body?.base64Image as string | undefined;
    const imageUrl = body?.imageUrl as string | undefined;

    if (!base64Image && !imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing base64Image or imageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const prompt = buildSystemPrompt();
    const configuredTemp = (promptConfig.temperature as number) ?? 0.1;
    const configuredMaxTokens = (promptConfig.maxTokens as number) ?? 300;

    const formattedImageUrl = imageUrl
      ? imageUrl
      : `data:image/jpeg;base64,${base64Image!.includes(",") ? base64Image!.split(",")[1].trim() : base64Image!.trim()}`;

    let data: any = null;
    let lastError = "";

    const response = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: configuredTemp,
        max_tokens: configuredMaxTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: formattedImageUrl,
                  detail: "low",
                },
              },
            ],
          },
        ],
      }),
    },
      { timeoutMs: 30_000, retries: 1, backoffMs: 500 },
    );

    if (response.ok) {
      data = await response.json();
    } else {
      lastError = await response.text();
    }

    if (!data) {
      throw new Error(`OpenAI API Error: ${lastError}`);
    }

    const rawText = data?.choices?.[0]?.message?.content || "{}";

    // Attempt to parse JSON safely
    let parsedResult = {};
    try {
      const cleanText = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      parsedResult = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse AI JSON output:", rawText);
      throw new Error("Invalid JSON response from AI");
    }

    return new Response(
      JSON.stringify({ success: true, result: parsedResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in cloth-label-scan:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error?.status ?? 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
