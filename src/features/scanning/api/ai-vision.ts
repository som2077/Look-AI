/**
 * AI Vision API — Clothing Analyzer (Optimized)
 * Analyzes a clothing image and extracts structured metadata using low-token vision detail.
 */

import { supabase } from "@/shared/supabase/client";
import * as FileSystem from "expo-file-system";
import { DISABLE_AI_SCAN } from "./ai-scan";

export interface ClothingAnalysis {
  name: string;
  category:
  | "top"
  | "bottoms"
  | "footwear"
  | "outerwear"
  | "dress"
  | "ethnic"
  | "accessory"
  | "headwear";
  color: string;
  colorHex: string;
  occasion: "Casual" | "Office" | "Party" | "Wedding" | "Date" | "Gym";
  season: "All" | "Summer" | "Winter" | "Monsoon" | "Spring";
  matchingColors: { name: string; hex: string }[];
  brand: string;
  careInstructions: string;
  notes: string;
  confidence: number;
}

const SYSTEM_PROMPT = `Analyze clothing or wearable image. Return ONLY valid JSON:
{
  "name": "Item name",
  "category": "top|bottoms|footwear|outerwear|dress|ethnic|accessory|headwear",
  "color": "Color",
  "colorHex": "#RRGGBB",
  "occasion": "Casual|Office|Party|Wedding|Date|Gym",
  "season": "All|Summer|Winter|Monsoon|Spring",
  "matchingColors": [{"name": "White", "hex": "#ffffff"}],
  "brand": "Brand or Unknown",
  "careInstructions": "1 wash rule",
  "notes": "1 style line",
  "confidence": 0.9
}`;

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
      console.warn("[ai-vision] FileSystem read failed:", fsErr);
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
    console.error("[ai-vision] uriToBase64 failed:", err);
    throw err;
  }
}

async function prepareVisionImageUrl(imageUri: string): Promise<string> {
  if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
    if (imageUri.includes("cloudinary.com") && !imageUri.includes("w_")) {
      return imageUri.replace("/upload/", "/upload/w_512,c_limit,q_auto/");
    }
    return imageUri;
  }
  const base64 = await uriToBase64(imageUri);
  const mimeType = imageUri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

export async function analyzeClothingImage(
  imageUri: string,
): Promise<ClothingAnalysis | null> {
  if (DISABLE_AI_SCAN) {
    return getFallbackAnalysis();
  }

  try {
    const imageUrl = await prepareVisionImageUrl(imageUri);

    const requestBody = {
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SYSTEM_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low", // 85 input tokens instead of 765+ tokens
              },
            },
          ],
        },
      ],
    };

    const { data, error: edgeError } = await supabase.functions.invoke("openai-proxy", {
      body: { model: "gpt-4o-mini", body: requestBody },
    });

    if (edgeError || !data) {
      console.warn(`[AI-Vision] Edge function failed:`, edgeError);
      return getFallbackAnalysis();
    }

    const textResponse = data?.choices?.[0]?.message?.content ?? null;
    if (!textResponse) return getFallbackAnalysis();

    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return getFallbackAnalysis();

    return JSON.parse(jsonMatch[0]) as ClothingAnalysis;
  } catch (err) {
    console.error("analyzeClothingImage error:", err);
    return getFallbackAnalysis();
  }
}

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
