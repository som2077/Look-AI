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

    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!geminiKey) {
      throw new Error("Missing GOOGLE_GEMINI_API_KEY");
    }

    const prompt = buildSystemPrompt();
    const configuredModel = promptConfig.model as string;
    const configuredTemp = (promptConfig.temperature as number) ?? 0.1;
    const configuredMaxTokens = (promptConfig.maxTokens as number) ?? 1000;

    const MODELS = [
      configuredModel,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ].filter((model, index, models) => model && models.indexOf(model) === index);

    let data: any = null;
    let lastError = "";

    for (const model of MODELS) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: { mime_type: "image/jpeg", data: base64Image },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: configuredTemp,
              maxOutputTokens: configuredMaxTokens,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (response.ok) {
        data = await response.json();
        break;
      } else {
        lastError = await response.text();
        // If it's a 429, we continue to the next model in the list
      }
    }

    if (!data) {
      throw new Error(`Gemini API Error: ${lastError}`);
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Attempt to parse JSON safely
    let parsedResult = {};
    try {
      const cleanText = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      parsedResult = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON output:", rawText);
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
