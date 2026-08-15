// @ts-ignore: Deno import is not recognized by standard TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { serializeCareSymbolsForPrompt } from "../_shared/careSymbols.ts";
import { checkRateLimit, getUserIdFromJwt, rateLimitBody } from "../_shared/rate-limit.ts";
import {
  isRequiredString,
  readJsonBody,
} from "../_shared/validate.ts";
import { loadPrompt, renderPrompt } from "../_shared/prompt-loader.ts";

// @ts-ignore: Declare Deno globally
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Load the cloth label OCR prompt configuration
const promptConfig = loadPrompt("cloth_label_ocr");

function buildSystemPrompt(): string {
  const table = serializeCareSymbolsForPrompt();
  const systemPrompt = promptConfig.system_prompt as string;
  const userTemplate = promptConfig.user_template as string;

  // Render the template with the reference table
  return `${systemPrompt}\n\n${renderPrompt(userTemplate, { reference_table: table })}`;
}

serve(async (req: Request) => {
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

  // Rate limit: 10 scans/min/user
  const rl = await checkRateLimit("cloth-label-scan", userId, 10, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("cloth-label-scan", 60), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const body = await readJsonBody(req);
    const base64Image = isRequiredString(
      (body as Record<string, unknown>)?.base64Image,
      "base64Image",
    );

    const openaiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("EXPO_PUBLIC_OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const prompt = buildSystemPrompt();
    const configuredTemp = (promptConfig.temperature as number) ?? 0.1;
    const configuredMaxTokens = (promptConfig.maxTokens as number) ?? 1000;

    let data: any = null;
    let lastError = "";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      }),
    });

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
