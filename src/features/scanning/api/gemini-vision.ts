/**
 * Gemini Vision API — Clothing Analyzer
 * Analyzes a clothing image and extracts structured metadata.
 */

import { supabase } from "@/shared/supabase/client";
import * as FileSystem from "expo-file-system";

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
  matchingColors: { name: string; hex: string }[];
  brand: string;
  careInstructions: string;
  notes: string;
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
  "brand": "Guess brand if visible or return 'Unknown'",
  "careInstructions": "Determine standard care instructions by guessing the fabric material. Provide 2-3 short, specific washing/drying rules (e.g., 'Machine wash cold. Do not bleach. Tumble dry low.'). If unsure, provide safe defaults like 'Hand wash cold. Dry flat.'",
  "notes": "Write a stylish, engaging 1-2 sentence fashion note describing the vibe of the item, how it feels, and a quick styling tip.",
  "confidence": a number between 0.7 and 1.0
}
Be specific and accurate. Always return valid JSON only.`;

/**
 * Converts a local file URI to base64 encoded string.
 */
async function uriToBase64(uri: string): Promise<string> {
  if (!uri) return "";

  if (uri.startsWith("data:image")) {
    return uri.split(",")[1] || "";
  }

  if (
    uri.startsWith("file://") ||
    uri.startsWith("/") ||
    uri.startsWith("content://") ||
    uri.startsWith("ph://")
  ) {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      if (base64) return base64;
    } catch (fsErr) {
      console.warn("[Gemini-Vision] FileSystem read failed, attempting fetch fallback:", fsErr);
    }
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("[Gemini-Vision] uriToBase64 failed:", err);
    throw err;
  }
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
    let base64Image: string;
    try {
      base64Image = await uriToBase64(imageUri);
    } catch (err) {
      console.error("[Gemini-Vision] Error converting image URI to base64:", err);
      return null;
    }

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
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    let lastError = "";

    for (const model of MODELS) {
      let textResponse: string | null = null;
      let invokeFailed = false;

      try {
        const { data, error: edgeError } = await supabase.functions.invoke("gemini-proxy", {
          body: { model, body: requestBody },
        });

        if (edgeError) {
          console.warn(`[Gemini-Vision] Edge function failed for ${model}, attempting direct fetch...`, edgeError);
          invokeFailed = true;
        } else {
          textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
        }
      } catch (invokeErr) {
        console.warn(`[Gemini-Vision] Invoke exception for ${model}, attempting direct fetch...`, invokeErr);
        invokeFailed = true;
      }

      if (invokeFailed) {
        // Fallback to direct fetch
        const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
          console.error("[Gemini-Vision] No EXPO_PUBLIC_GEMINI_API_KEY available for fallback.");
          continue;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Gemini-Vision] Direct fetch failed for ${model}:`, res.status, errText);
          continue;
        }

        const data = await res.json();
        textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      }

      if (!textResponse) {
        console.error(`[Gemini-Vision] No text returned from ${model}`);
        continue;
      }

      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[Gemini-Vision] No JSON from ${model}:`, textResponse);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]) as ClothingAnalysis;
      console.log(`[Gemini-Vision] ✅ Success with model: ${model}`);
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
const getFallbackAnalysis = (): ClothingAnalysis => {
  return {
    name: "Classic Denim Jacket",
    category: "outerwear",
    color: "Blue",
    colorHex: "#3b82f6",
    occasion: "Casual",
    season: "All",
    matchingColors: [
      { name: "White", hex: "#ffffff" },
      { name: "Black", hex: "#000000" },
    ],
    brand: "Unknown",
    careInstructions: "Machine wash cold, tumble dry low",
    notes: "A timeless classic for any casual outfit.",
    confidence: 0.8,
  };
};
