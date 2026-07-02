/**
 * Gemini Vision API — Clothing Analyzer
 * Analyzes a clothing image and extracts structured metadata.
 */

export interface ClothingAnalysis {
  name: string;
  category:
    | "top"
    | "bottoms"
    | "footwear"
    | "outerwear"
    | "dress"[]
    | "ethnic"
    | "accessory";
  color: string;
  colorHex: string;
  occasion: "Casual" | "Office" | "Party" | "Wedding" | "Date" | "Gym";
  season: "All" | "Summer" | "Winter" | "Monsoon" | "Spring";
  matchingColors: Array<{ name: string; hex: string }>;
  confidence: number; // 0-1
}

const SYSTEM_PROMPT = `You are a fashion AI assistant. Analyze the clothing item in the image and return ONLY a valid JSON object (no markdown, no explanation) with exactly these fields:
{
  "name": "descriptive item name (e.g. Navy Blue Denim Jacket)",
  "category": one of: "top" | "bottoms" | "footwear" | "outerwear" | "dress" | "ethnic" | "accessory",
  "color": "human readable color name (e.g. Navy Blue)",
  "colorHex": "hex color code of the dominant color (e.g. #1B3A6B)",
  "occasion": one of: "Casual" | "Office" | "Party" | "Wedding" | "Date" | "Gym",
  "season": one of: "All" | "Summer" | "Winter" | "Monsoon" | "Spring",
  "matchingColors": [
    { "name": "color name", "hex": "#hexcode" },
    { "name": "color name", "hex": "#hexcode" },
    { "name": "color name", "hex": "#hexcode" }
  ],
  "confidence": a number between 0.7 and 1.0
}
Be specific and accurate. Always return valid JSON only.`;

/**
 * Converts a local file URI to base64 encoded string.
 */
async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Analyzes a clothing image using Gemini Vision API.
 * @param imageUri - Local file URI of the image
 * @returns Structured clothing analysis or null on error
 */
export async function analyzeClothingImage(
  imageUri: string,
): Promise<ClothingAnalysis | null> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      console.warn("Gemini API key not set. Using fallback analysis.");
      return getFallbackAnalysis();
    }

    const base64Image = await uriToBase64(imageUri);
    const mimeType = imageUri.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg";

    const requestBody = {
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    };

    // ── Try models in order, fall back on quota errors ──────────────────────
    const MODELS = [
      "gemini-2.5-flash-lite",  // current lightweight model
      "gemini-2.5-flash",       // standard fast model
      "gemini-2.0-flash-lite",  // fallback
    ];

    let lastError = "";

    for (const model of MODELS) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.status === 429) {
        lastError = `${model} quota exceeded`;
        console.warn(`[Gemini] ${model} quota exceeded, trying next model...`);
        continue; // try next model
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Gemini] ${model} error:`, errText);
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[Gemini] No JSON from ${model}:`, text);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]) as ClothingAnalysis;
      console.log(`[Gemini] ✅ Success with model: ${model}`);
      return parsed;
    }

    // All models failed
    console.warn(`[Gemini] All models failed. Last error: ${lastError}. Using fallback.`);
    return getFallbackAnalysis();
  } catch (err) {
    console.error("analyzeClothingImage error:", err);
    return getFallbackAnalysis();
  }
}

/**
 * Fallback analysis when API is unavailable or key is missing.
 */
function getFallbackAnalysis(): ClothingAnalysis {
  return {
    name: "Casual Top",
    category: "top",
    color: "White",
    colorHex: "#FFFFFF",
    occasion: "Casual",
    season: "All",
    matchingColors: [
      { name: "Navy Blue", hex: "#1B3A6B" },
      { name: "Beige", hex: "#F5F0E8" },
      { name: "Olive Green", hex: "#6B7A3A" },
    ],
    confidence: 0.75,
  };
}
