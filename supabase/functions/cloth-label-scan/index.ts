// @ts-ignore: Deno import is not recognized by standard TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { serializeCareSymbolsForPrompt } from "../_shared/careSymbols.ts";

// @ts-ignore: Declare Deno globally
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function buildSystemPrompt(): string {
  const table = serializeCareSymbolsForPrompt();
  return `You are a garment care label reader for a fashion wardrobe app.

You will be shown a photo of a clothing care label. Identify every care symbol visible using ONLY the reference table below — do not rely on general knowledge of care symbols, since regional variants (e.g. US ASTM D5489) look similar but differ in meaning. If a symbol in the image combines multiple features from the table (e.g. a washing tub with '40' AND a single bar underneath, or a tumble dry square with 1 dot AND a single bar), you MUST output ALL the individual matching symbol IDs (e.g. output both 'wash_warm_40' AND 'wash_permanent_press') rather than failing to match. If a symbol truly does not match any entry or combination in this table, do not guess an id; instead set "needs_user_review": true and describe it in "review_notes".

REFERENCE TABLE (ISO 3758 / GINETEX):
${table}
## general_rules
- Washing temperatures are shown as a numeral written inside the tub symbol (e.g. "40" for 40°C), not as dots.
- Drying and ironing heat levels are shown as dots inside the symbol — more dots means a higher setting, within that category only.
- If no bleaching symbol is present on a label, any type of bleach is permitted.
- Milder forms of treatment and lower temperatures than those indicated on the label are always permitted, even if not explicitly shown.
- A cross (X) through any symbol means that treatment must not be used.
- One bar underneath a symbol means a milder/gentle version of that treatment is required; two bars mean a very mild/delicate version.
- GINETEX specifies symbols should appear in this order on a label: Washing → Bleaching → Drying → Ironing → Professional Care.

Also extract:
- Fabric composition text (material + percentage), in whatever language it is printed
- Brand name and size, if visible
- Any "Made in ..." origin text
- Detect the language of any printed text, and translate it to English in "translated_text" (leave "translated_text" null if the original is already English, or if there is no text to translate)

If a symbol's style looks like the US ASTM standard (e.g. dot-only temperature encoding), map it to the closest equivalent ISO symbol from the table. Do not flag needs_user_review just because the label has English text or looks hybrid. Only flag needs_user_review if a symbol is completely unreadable or has no equivalent meaning in the table.

Respond with ONLY valid JSON matching this exact shape, no markdown fences, no preamble:
{
  "care_symbols": [{ "id": "string", "category": "string", "label": "string", "confidence": "high" | "medium" | "low" }],
  "fabric_composition": [{ "material": "string", "percentage": 100 }],
  "brand": "string | null",
  "size": "string | null",
  "origin_text": "string | null",
  "detected_language": "string | null",
  "original_text": "string | null",
  "translated_text": "string | null",
  "label_standard_guess": "iso_ginetex" | "astm" | "unclear",
  "needs_user_review": true,
  "review_notes": "string | null"
}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { base64Image } = await req.json();
    if (!base64Image) {
      throw new Error("Missing base64Image parameter");
    }

    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!geminiKey) {
      throw new Error("Missing GOOGLE_GEMINI_API_KEY");
    }

    const prompt = buildSystemPrompt();

    const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
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
              temperature: 0.1,
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
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
