/**
 * Gemini Scan Services — Extended AI scanning for Look AI
 * Handles: Full Cloth Scan, Barcode Image, Care Label OCR, Fit Check, Multi-Item Wardrobe Scan
 */

import { supabase } from "@/shared/supabase/client";
import { SYSTEM_PROMPTS } from "./prompts";
export const DISABLE_AI_SCAN = false;
import * as FileSystem from "expo-file-system";

const MODELS = [
  "gpt-4o-mini"
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpenAIVisionResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: { content?: string };
  }>;
}

export interface BarcodeAnalysis {
  brand: string;
  itemName: string;
  size: string;
  color: string;
  price: string;
  material: string;
  rawText: string;
  careInstructions?: string;
  notes?: string;
  error?: string;
}

export interface LabelAnalysis {
  care_symbols: {
    id: string;
    category: string;
    label: string;
    confidence: "high" | "medium" | "low";
  }[];
  fabric_composition: {
    material: string;
    percentage: number | null;
  }[];
  brand: string | null;
  size: string | null;
  origin_text: string | null;
  detected_language: string | null;
  original_text: string | null;
  translated_text: string | null;
  label_standard_guess: "iso_ginetex" | "astm" | "unclear";
  needs_user_review: boolean;
  review_notes: string | null;
  error?: string;
}

export interface FitCheckAnalysis {
  fitScore: number;
  ratingTitle: string;
  ratingSubtitle: string;
  silhouette: {
    bodyShape: string;
    waistBalance: string;
    topRatio: number;
    bottomRatio: number;
    explanation: string;
  };
  fitPrecision: {
    shoulderFit: { status: "Perfect" | "Tight" | "Loose"; text: string };
    sleeveLength: { status: "Perfect" | "Short" | "Long"; text: string };
    trouserBreak: { status: "Perfect" | "Short" | "Long"; text: string };
  };
  colorTheory: {
    hexColors: string[];
    harmony: string;
    contrastExplanation: string;
  };
  styleCategory: {
    archetype: string;
    trendScore: number;
  };
  actionableFixes: {
    problem: string;
    solution: string;
  }[];
  outfitPieces: {
    top: string | null;
    bottom: string | null;
    footwear: string | null;
    accessories: string | null;
  };
  error?: string;
}

export interface FullClothingAnalysis {
  name: string;
  category: string;
  subCategory: string;
  color: string;
  primaryColor?: string; // For backward compatibility
  colorHex: string;
  occasion: string[];
  season: string[];
  brand: string;
  careInstructions: string;
  notes: string;
  // Validation flag — set to "Not Clothing" when image is rejected
  validationStatus?: "ok" | "not_clothing" | "full_body" | "multiple_items" | "unclear";
}

// ─── Token & Image Optimization Helpers ────────────────────────────────────────

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
      console.warn("[ai-scan] FileSystem read failed, attempting fetch fallback:", fsErr);
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
    console.error("[ai-scan] uriToBase64 failed:", err);
    throw err;
  }
}

/**
 * Prepares image URL for OpenAI Vision API.
 * Uses direct Cloudinary / HTTP URLs with CDN optimization to eliminate Base64 overhead.
 */
async function prepareVisionImageUrl(imageUri: string): Promise<string> {
  if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
    if (imageUri.includes("cloudinary.com") && !imageUri.includes("w_768")) {
      return imageUri.replace("/upload/", "/upload/w_768,c_limit,q_auto/");
    }
    return imageUri;
  }
  const base64 = await uriToBase64(imageUri);
  const mimeType = imageUri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

async function callOpenAIVision(
  imageUri: string,
  prompt: string,
  mode: "cloth" | "barcode" | "fitcheck" = "cloth",
  maxTokens: number = 350
): Promise<string | null> {
  let url: string;
  try {
    url = await prepareVisionImageUrl(imageUri);
  } catch (err) {
    console.error("[AI-Scan] Error preparing vision image URL:", err);
    return null;
  }

  // "low" detail consumes only 85 tokens per photo vs 765+ tokens for default "high" detail!
  const detail = mode === "barcode" ? "auto" : "low";

  const body = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url,
              detail,
            },
          },
        ],
      },
    ],
  };

  for (const model of MODELS) {
    let textResponse: string | null = null;
    let invokeFailed = false;

    try {
      const { data, error } = await supabase.functions.invoke("openai-proxy", {
        body: { model, body },
      });

      if (error) {
        console.warn(`[AI-Scan] Edge function failed for ${model}:`, error);
        invokeFailed = true;
      } else {
        const choice = data?.choices?.[0];
        if (choice?.finish_reason === "content_filter") {
          return JSON.stringify({ error: "SAFETY_VIOLATION" });
        }
        textResponse = choice?.message?.content || null;
      }
    } catch (err) {
      console.warn(`[AI-Scan] Invoke exception for ${model}:`, err);
      invokeFailed = true;
    }

    if (invokeFailed || !textResponse) {
      continue;
    }

    return textResponse;
  }
  return null;
}

function parseJson<T>(text: string | null, fallback: T): T {
  if (!text) return fallback;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
}

// ─── Mode 1: Scan Cloth ───────────────────────────────────────────────────────

const CLOTH_PROMPT = `You are a STRICT fashion AI clothing analyzer. Analyze images of single clothing items, footwear, or accessories.

STEP 1: VALIDATE IMAGE TYPE.
Check what is in the image:
- If image shows a full body person wearing clothes → return: {"validationStatus": "full_body", "category": "Full Body", "confidence": 0}
- If image shows multiple items at once → return: {"validationStatus": "multiple_items", "category": "Not Clothing", "confidence": 0}
- If image has no clothing/fashion item at all (food, landscape, selfie, text) → return: {"validationStatus": "not_clothing", "category": "Not Clothing", "confidence": 0}
- If image is too blurry/dark to analyze → return: {"validationStatus": "unclear", "category": "Not Clothing", "confidence": 0}

STEP 2: ANALYZE THE SINGLE FASHION ITEM.
Valid items include: tops, bottoms, footwear, accessories, bags, ethnic wear, activewear, outerwear — for men or women.

Return ONLY valid JSON:
{
  "name": "e.g. Navy Blue Hoodie, White Sneakers, Leather Tote Bag",
  "category": "Top | Bottoms | Footwear | Accessory | Outerwear | Dress | Ethnic | Activewear | Headwear",
  "subCategory": "e.g. Graphic Tee, Slim Fit Jeans, Chelsea Boots, Crossbody Bag",
  "primaryColor": "White, Black, Blue, Navy, Red, Green, Yellow, Gray, Brown, Beige, Pink, Purple, Orange, Khaki",
  "secondaryColors": [],
  "pattern": "Solid | Striped | Checked | Printed | Floral | Camo | Geometric",
  "fabricGuess": "Cotton | Denim | Wool | Polyester | Leather | Linen | Silk | Synthetic",
  "fit": "Slim | Regular | Loose | Oversized | Fitted",
  "sleeveType": "Full | Half | Sleeveless | null",
  "neckType": "Round | V-neck | Collar | Polo | Turtleneck | null",
  "season": ["All Season"],
  "occasion": ["Casual"],
  "careInstructions": "Machine wash cold, tumble dry low",
  "notes": "1 short styling tip for this item",
  "colorHex": "#RRGGBB",
  "validationStatus": "ok",
  "confidence": 0.9
}`;

export async function analyzeClothingFull(
  imageUri: string,
): Promise<FullClothingAnalysis> {
  const text = await callOpenAIVision(imageUri, CLOTH_PROMPT, "cloth", 400);
  return parseJson<FullClothingAnalysis>(text, {
    name: "Fashion Item",
    category: "Top",
    subCategory: "T-shirt",
    color: "White",
    primaryColor: "White",
    colorHex: "#FFFFFF",
    occasion: ["Casual"],
    season: ["All Season"],
    brand: "Unknown",
    careInstructions: "Machine wash cold",
    notes: "A casual staple item",
    validationStatus: "ok",
  });
}

// ─── Barcode Image Analysis ───────────────────────────────────────────────────

const BARCODE_PROMPT = `Extract product details from clothing tag image. Return JSON:
{
  "brand": "Brand or Unknown",
  "itemName": "Item name or Clothing Item",
  "size": "Size or Unknown",
  "color": "Color or Unknown",
  "price": "Price or Not visible",
  "material": "Material or Unknown",
  "rawText": "visible text"
}`;

export async function analyzeBarcodeImage(
  imageUri: string,
): Promise<BarcodeAnalysis> {
  const text = await callOpenAIVision(imageUri, BARCODE_PROMPT, "barcode", 200);
  return parseJson<BarcodeAnalysis>(text, {
    brand: "Unknown",
    itemName: "Clothing Item",
    size: "Unknown",
    color: "Unknown",
    price: "Not visible",
    material: "Unknown",
    rawText: "",
  });
}

// ─── Mode 2: Cloth Label OCR ──────────────────────────────────────────────────

export async function analyzeClothLabel(
  imageUri: string,
): Promise<LabelAnalysis> {
  try {
    let payload: object;
    if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
      const imageUrl = imageUri.includes("cloudinary.com") && !imageUri.includes("w_768")
        ? imageUri.replace("/upload/", "/upload/w_768,c_limit,q_auto/")
        : imageUri;
      payload = { imageUrl };
    } else {
      const base64Image = await uriToBase64(imageUri);
      payload = { base64Image };
    }

    const { data, error: edgeError } = await supabase.functions.invoke(
      "cloth-label-scan",
      { body: payload }
    );

    if (edgeError || !data?.success) {
      throw new Error(edgeError?.message || data?.error || "Label scan failed");
    }

    return data.result as LabelAnalysis;
  } catch (err: any) {
    console.error("Error calling cloth-label-scan:", err);
    return {
      care_symbols: [],
      fabric_composition: [],
      brand: null,
      size: null,
      origin_text: null,
      detected_language: null,
      original_text: null,
      translated_text: null,
      label_standard_guess: "unclear",
      needs_user_review: true,
      review_notes: "Could not analyze label.",
      error: err.message,
    };
  }
}

// ─── Mode 3: Fit Check Analysis ───────────────────────────────────────────────

const FITCHECK_PROMPT = `Analyze this full-body outfit photo. Return ONLY valid JSON:
{
  "fitScore": number 0-100,
  "ratingTitle": "Short title (e.g. 'Good Fit ✨')",
  "ratingSubtitle": "1 line description",
  "silhouette": {
    "bodyShape": "Rectangle, Hourglass, Triangle, or Oval",
    "waistBalance": "Standard Balance",
    "topRatio": 50,
    "bottomRatio": 50,
    "explanation": "Brief proportion note"
  },
  "fitPrecision": {
    "shoulderFit": { "status": "Perfect", "text": "Fits well" },
    "sleeveLength": { "status": "Perfect", "text": "Good length" },
    "trouserBreak": { "status": "Perfect", "text": "Good break" }
  },
  "colorTheory": {
    "hexColors": ["#RRGGBB", "#RRGGBB"],
    "harmony": "Neutral",
    "contrastExplanation": "Short contrast note"
  },
  "styleCategory": {
    "archetype": "Casual",
    "trendScore": 75
  },
  "actionableFixes": [
    { "problem": "Issue", "solution": "Fix suggestion" }
  ],
  "outfitPieces": {
    "top": "Top item description",
    "bottom": "Bottom item description",
    "footwear": "Shoes description",
    "accessories": null
  }
}`;

export async function analyzeFitCheck(
  imageUri: string,
): Promise<FitCheckAnalysis> {
  const MOCK_AI = true; // SET THIS TO TRUE TO BYPASS AI FOR UI TESTING

  const mockData: FitCheckAnalysis = {
    fitScore: 93,
    ratingTitle: "Good Look ✨",
    ratingSubtitle: "A solid outfit with room for minor tweaks.",
    silhouette: {
      bodyShape: "Balanced",
      waistBalance: "Standard Balance",
      topRatio: 50,
      bottomRatio: 50,
      explanation: "Balanced proportions.",
    },
    fitPrecision: {
      shoulderFit: { status: "Perfect", text: "Shoulders fit well" },
      sleeveLength: { status: "Perfect", text: "Sleeves are correct length" },
      trouserBreak: { status: "Perfect", text: "Good break length" },
    },
    colorTheory: {
      hexColors: ["#1D1A27", "#F9FAFB"],
      harmony: "Neutral",
      contrastExplanation: "Medium contrast tonal look.",
    },
    styleCategory: {
      archetype: "Casual",
      trendScore: 70,
    },
    actionableFixes: [
      {
        problem: "Outfit lacks personal touch",
        solution: "Try adding a statement accessory",
      },
    ],
    outfitPieces: {
      top: "Top piece",
      bottom: "Bottom piece",
      footwear: "Footwear",
      accessories: null,
    },
  };

  if (MOCK_AI) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return mockData;
  }

  const text = await callOpenAIVision(imageUri, FITCHECK_PROMPT, "fitcheck", 400);
  return parseJson<FitCheckAnalysis>(text, mockData);
}

// ─── Mode 4: Wardrobe Selection Scan (Up to 5 Selected Images) ────────────────

export async function analyzeMultiClothingWardrobe(
  imageUris: string[],
  occasion?: string
): Promise<{ outfitTitle: string; stylistAdvice: string; selectedIndexes: number[]; formalityScore: number } | null> {
  if (!imageUris || imageUris.length === 0) return null;
  const urisToProcess = imageUris.slice(0, 5); // Limit max 5 wardrobe items

  try {
    const imageItems = await Promise.all(
      urisToProcess.map(async (uri, index) => {
        const url = await prepareVisionImageUrl(uri);
        return [
          { type: "text", text: `Item #${index + 1}:` },
          { type: "image_url", image_url: { url, detail: "low" } }
        ];
      })
    );

    const content = [
      {
        type: "text",
        text: `Analyze these ${urisToProcess.length} wardrobe items for an outfit recommendation${occasion ? ` for ${occasion}` : ""}. Return ONLY valid JSON: {"outfitTitle": "title", "stylistAdvice": "1-2 lines advice", "selectedIndexes": [0, 1], "formalityScore": 7}`
      },
      ...imageItems.flat()
    ];

    const body = {
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }]
    };

    const { data, error } = await supabase.functions.invoke("openai-proxy", {
      body: { model: "gpt-4o-mini", body }
    });

    if (error) return null;
    const jsonText = data?.choices?.[0]?.message?.content;
    return parseJson(jsonText, null);
  } catch (err) {
    console.error("[analyzeMultiClothingWardrobe] Error:", err);
    return null;
  }
}
