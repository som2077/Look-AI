/**
 * Gemini Scan Services — Extended AI scanning for Look AI
 * Handles: Full Cloth Scan, Care Label OCR, Fit Check, Multi-Item Wardrobe Scan
 */

import { supabase } from "@/shared/supabase/client";
import { captureFeatureError, addAppBreadcrumb } from "@/shared/telemetry/sentry";
import * as FileSystem from "expo-file-system";


// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpenAIVisionResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: { content?: string };
  }>;
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
  rating?: number;
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
  mode: "cloth" | "fitcheck" = "cloth",
  maxTokens: number = 350
): Promise<string | null> {
  let url: string;
  try {
    url = await prepareVisionImageUrl(imageUri);
  } catch (err) {
    console.error("[AI-Scan] Error preparing vision image URL:", err);
    return null;
  }

  const detail = "low";

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

  try {
    const openAiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (openAiKey) {
      console.log("[AI-Scan] Fast-Path: Calling OpenAI directly");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        console.warn("[AI-Scan] Direct OpenAI call failed", await res.text());
        return null;
      }
      const data = await res.json();
      
      // Print token usage to console
      if (data.usage) {
        console.log(`[AI-Scan] Token Usage -> Input: ${data.usage.prompt_tokens} | Output: ${data.usage.completion_tokens} | Total: ${data.usage.total_tokens}`);
      }
      
      const choice = data?.choices?.[0];
      if (choice?.finish_reason === "content_filter") {
        return JSON.stringify({ error: "SAFETY_VIOLATION" });
      }
      return choice?.message?.content || null;
    }

    // Fallback to edge function if no local key
    const { data, error } = await supabase.functions.invoke("openai-proxy", {
      body: { model: "gpt-4o-mini", body },
    });

    if (error) {
      console.warn(`[AI-Scan] Edge function failed:`, error);
      return null;
    } 

    // Print token usage to console
    if (data && data.usage) {
      console.log(`[AI-Scan] Token Usage (Edge) -> Input: ${data.usage.prompt_tokens} | Output: ${data.usage.completion_tokens} | Total: ${data.usage.total_tokens}`);
    }
    
    const choice = data?.choices?.[0];
    if (choice?.finish_reason === "content_filter") {
      return JSON.stringify({ error: "SAFETY_VIOLATION" });
    }
    return choice?.message?.content || null;
    
  } catch (err) {
    console.warn(`[AI-Scan] Invoke exception:`, err);
    return null;
  }
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
- If image has no clothing/fashion item at all (e.g., food, landscape, text only) → return: {"validationStatus": "not_clothing", "category": "Not Clothing", "confidence": 0}
- If image shows a full body person or multiple items → DO NOT REJECT. Instead, pick the MOST PROMINENT clothing item in the image and analyze it.

STEP 2: ANALYZE THE SINGLE FASHION ITEM.
Return ONLY valid JSON using EXACTLY these constrained values:

CATEGORIES: "Top" | "Bottom" | "One-Piece" | "Outerwear" | "Footwear" | "Accessories" | "Other"
SUBCATEGORIES (must match Category):
- Top: "T-Shirt", "Shirt", "Polo Shirt", "Blouse", "Tank Top", "Crop Top", "Sweater", "Hoodie", "Sweatshirt", "Cardigan", "Tunic", "Kurta"
- Bottom: "Jeans", "Trousers", "Pants", "Chinos", "Shorts", "Skirt", "Leggings", "Joggers", "Sweatpants", "Cargo Pants"
- One-Piece: "Dress", "Jumpsuit", "Romper", "Playsuit"
- Outerwear: "Jacket", "Blazer", "Coat", "Trench Coat", "Puffer", "Vest", "Overcoat", "Leather Jacket", "Denim Jacket"
- Footwear: "Sneakers", "Running Shoes", "Boots", "Sandals", "Heels", "Flats", "Loafers", "Formal Shoes", "Slippers", "Slides", "Mules"
- Accessories: "Bag", "Backpack", "Belt", "Wallet", "Watch", "Sunglasses", "Hat", "Cap", "Scarf", "Gloves", "Tie", "Jewelry"
- Other: "Other"

OCCASIONS: "Everyday", "Casual", "Work / Office", "Business", "Formal", "Semi-Formal", "Party", "Wedding", "Festive / Celebration", "Traditional / Cultural", "Date / Romantic", "Dinner", "Evening", "Night Out", "Travel", "Vacation / Resort", "Beach", "Outdoor", "Sports / Active", "Gym / Workout", "Lounge / Home", "School / University", "Interview", "Ceremony", "Religious / Spiritual", "Funeral / Memorial"

JSON FORMAT:
{
  "name": "e.g. Navy Blue Hoodie, White Sneakers, Leather Tote Bag",
  "brand": "Detect brand text or leave blank",
  "category": "<MUST BE ONE OF THE EXACT CATEGORIES ABOVE>",
  "subCategory": "<MUST BE ONE OF THE EXACT SUBCATEGORIES FOR THE CATEGORY ABOVE>",
  "color": "White, Black, Blue, Navy, Red, Green, Yellow, Gray, Brown, Beige, Pink, Purple, Orange, Khaki",
  "season": ["All Season", "Summer", "Winter", "Spring", "Fall"],
  "occasion": ["<MUST BE FROM OCCASIONS LIST ABOVE>", "<CAN HAVE MULTIPLE>"],
  "careInstructions": "Machine wash cold, tumble dry low etc",
  "notes": "1 short styling tip",
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
    rating: 5,
    validationStatus: "ok",
  });
}


// ─── Mode 2: Cloth Label OCR ──────────────────────────────────────────────────

const LABEL_PROMPT = `Extract information from this clothing care label.
Translate any foreign text into English.
Return ONLY valid JSON using exactly this format:
{
  "care_symbols": [
    {
      "id": "e.g., wash_30, bleach_no, iron_low",
      "category": "washing | bleaching | drying | ironing | dry_cleaning | wringing",
      "label": "e.g., Machine wash cold",
      "confidence": "high"
    }
  ],
  "fabric_composition": [
    {
      "material": "e.g., Cotton",
      "percentage": 100
    }
  ],
  "brand": "brand name if visible, else null",
  "size": "size if visible, else null",
  "origin_text": "e.g., Made in China, else null",
  "detected_language": "e.g., English, French, else null",
  "original_text": "Extract all raw text visible on the label",
  "translated_text": "Translate original_text to English if needed",
  "label_standard_guess": "unclear",
  "needs_user_review": false,
  "review_notes": "Any caveats or null"
}`;

export async function analyzeClothLabel(
  imageUri: string,
): Promise<LabelAnalysis> {
  const text = await callOpenAIVision(imageUri, LABEL_PROMPT, "cloth", 600);
  return parseJson<LabelAnalysis>(text, {
    care_symbols: [],
    fabric_composition: [],
    brand: null,
    size: null,
    origin_text: null,
    detected_language: "English",
    original_text: null,
    translated_text: null,
    label_standard_guess: "unclear",
    needs_user_review: true,
    review_notes: "Failed to parse properly.",
  });
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
    const isTimeout = err.message?.toLowerCase().includes('timeout');
    captureFeatureError(err, 'cloth_label', 'analyze', isTimeout ? 'ai_timeout' : 'ai_generation_failed');
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
  

  const fallbackData: FitCheckAnalysis = {
    fitScore: 85,
    ratingTitle: "Fallback Result",
    ratingSubtitle: "Unable to analyze completely.",
    silhouette: {
      bodyShape: "Balanced",
      waistBalance: "Standard Balance",
      topRatio: 50,
      bottomRatio: 50,
      explanation: "Fallback proportions.",
    },
    fitPrecision: {
      shoulderFit: { status: "Perfect", text: "N/A" },
      sleeveLength: { status: "Perfect", text: "N/A" },
      trouserBreak: { status: "Perfect", text: "N/A" },
    },
    colorTheory: {
      hexColors: ["#1D1A27", "#F9FAFB"],
      harmony: "Neutral",
      contrastExplanation: "Fallback contrast.",
    },
    styleCategory: {
      archetype: "Casual",
      trendScore: 50,
    },
    actionableFixes: [],
    outfitPieces: {
      top: null,
      bottom: null,
      footwear: null,
      accessories: null,
    },
  };

  const text = await callOpenAIVision(imageUri, FITCHECK_PROMPT, "fitcheck", 400);
  return parseJson<FitCheckAnalysis>(text, fallbackData);
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
  } catch (err: any) {
    const isTimeout = err.message?.toLowerCase().includes('timeout');
    captureFeatureError(err, 'wardrobe', 'ai_outfit_recommendation', isTimeout ? 'ai_timeout' : 'ai_generation_failed');
    console.error("[analyzeMultiClothingWardrobe] Error:", err);
    return null;
  }
}
