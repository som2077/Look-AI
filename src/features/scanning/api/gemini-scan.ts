/**
 * Gemini Scan Services — Extended AI scanning for Look AI
 * Handles: Full Cloth Scan, Barcode Image, Care Label OCR, Fit Check
 */

import { supabase } from "@/shared/supabase/client";
import * as FileSystem from "expo-file-system";

const MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Core Gemini caller ───────────────────────────────────────────────────────

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
      console.warn("[Gemini-Scan] FileSystem read failed, attempting fetch fallback:", fsErr);
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
    console.error("[Gemini-Scan] uriToBase64 failed:", err);
    throw err;
  }
}

async function callGeminiVision(
  imageUri: string,
  prompt: string,
): Promise<string | null> {
  let base64: string;
  try {
    base64 = await uriToBase64(imageUri);
  } catch (err) {
    console.error("[Gemini-Scan] Error converting image URI to base64:", err);
    return null;
  }

  const mimeType = imageUri.toLowerCase().endsWith(".png")
    ? "image/png"
    : "image/jpeg";

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };

  for (const model of MODELS) {
    let textResponse: string | null = null;
    let invokeFailed = false;

    try {
      const { data, error } = await supabase.functions.invoke("gemini-proxy", {
        body: { model, body },
      });

      if (error) {
        console.warn(`[Gemini-Scan] Edge function failed for ${model}, attempting direct fetch...`, error);
        invokeFailed = true;
      } else {
        const candidate = data?.candidates?.[0];
        if (candidate?.finishReason === "SAFETY") {
          return JSON.stringify({ error: "SAFETY_VIOLATION" });
        }
        textResponse = candidate?.content?.parts?.[0]?.text || null;
      }
    } catch (err) {
      console.warn(`[Gemini-Scan] Invoke exception for ${model}, attempting direct fetch...`, err);
      invokeFailed = true;
    }

    if (invokeFailed) {
      // Fallback to direct fetch
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("[Gemini-Scan] No EXPO_PUBLIC_GEMINI_API_KEY available for fallback.");
        continue;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Gemini-Scan] Direct fetch failed for ${model}:`, res.status, errText);
        continue;
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];
      if (candidate?.finishReason === "SAFETY") {
        return JSON.stringify({ error: "SAFETY_VIOLATION" });
      }
      textResponse = candidate?.content?.parts?.[0]?.text || null;
    }

    if (!textResponse) {
      console.warn(`[Gemini-Scan] Empty response from model ${model}`);
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

export interface FullClothingAnalysis {
  category: string;
  subCategory: string;
  primaryColor: string;
  secondaryColors: string[];
  pattern: string;
  fabricGuess: string;
  fit: string;
  sleeveType: string;
  neckType: string;
  season: string[];
  occasion: string[];
  formalityScore: number;
  versatilityTags: string[];
  brand?: string;
  careInstructions?: string;
  notes?: string;
  colorHex?: string;
  confidence: number;
  error?: string;
}

// ─── 1. Full Clothing Scan ────────────────────────────────────────────────────

const CLOTH_PROMPT = `You are a STRICT fashion AI validator and analyzer. 
STEP 1: EVALUATE IMAGE TYPE.
- If you see a FULL HUMAN BODY (e.g. head to toe, or waist up showing an outfit), or a person wearing multiple clothing items (like jeans + jacket), YOU MUST REJECT IT. To reject, return exactly: {"category": "Full Body", "confidence": 0} and ignore all other fields. Do NOT try to extract a single item like a jacket from a full body photo.
- If you see NO clothing at all, return exactly: {"category": "Not Clothing", "confidence": 0}.

STEP 2: ANALYZE SINGLE ITEM.
ONLY IF the image is a clear shot of a SINGLE clothing item, accessory, or footwear (e.g., laid flat, on a hanger, or a very close-up shot of just the item), return a valid JSON object with EXACTLY these fields:
{
  "category": "MUST BE EXACTLY ONE OF: T-Shirt, Polo Shirt, Shirt, Blouse, Crop Top, Tank Top, Hoodie, Sweatshirt, Sweater, Cardigan, Jacket, Blazer, Coat, Jeans, Trousers, Chinos, Cargo Pants, Joggers, Shorts, Leggings, Skirt, Dress, Jumpsuit, Romper, Suit, Tracksuit, Co-ord Set, Activewear, Swimwear, Loungewear",
  "subCategory": "e.g., Slim Fit Jeans, Graphic T-Shirt, Zip-up Hoodie",
  "primaryColor": "MUST EXACTLY match one of: White, Ivory, Beige, Light-Gray, Dark-Gray, Black, Light-Yellow, Yellow, Turmeric, Orange, Coral, Red, Pink, Hot-Pink, Light-Green, Green, Olive, Dark-Olive, Teal, Khaki, Cyan, Sky-Blue, Blue, Navy, Lavender, Purple, Burgundy, Camel, Brown, Dark-Brown, Magenta, Gold, Silver, Colorful",
  "secondaryColors": ["color1", "color2"] (if applicable, else empty array),
  "pattern": "Solid, Striped, Checked, Floral, Printed, Textured, etc.",
  "fabricGuess": "Cotton, Denim, Silk, Polyester, Wool, etc.",
  "fit": "Slim, Regular, Oversized, Loose, or Unknown",
  "sleeveType": "Full, Half, Sleeveless, 3/4th, or null",
  "neckType": "Round, V-neck, Collar, Turtleneck, or null",
  "season": ["Spring", "Summer", "Autumn", "Winter", "Monsoon", "All Season"], (MUST ONLY contain exact matches from this list)
  "occasion": ["Casual", "Smart Casual", "Business Casual", "Formal", "Office", "College", "Party", "Wedding", "Festive", "Traditional", "Date Night", "Travel", "Beach", "Gym", "Sports", "Outdoor", "Lounge", "Sleepwear", "Interview", "All Occasion"], (MUST ONLY contain exact matches from this list)
  "formalityScore": number from 1 to 10 (1 = very casual, 10 = very formal),
  "versatilityTags": ["pairs well with denim", "good for layering", etc.],
  "brand": "Guess brand if visible, otherwise return 'Unknown'",
  "careInstructions": "Determine standard care instructions by guessing the fabric material. Provide 2-3 short, specific washing/drying rules (e.g., 'Machine wash cold. Do not bleach. Tumble dry low.'). If unsure, provide safe defaults like 'Hand wash cold. Dry flat.'",
  "notes": "Write a stylish, engaging 1-2 sentence fashion note describing the vibe of the item, how it feels, and a quick styling tip.",
  "colorHex": "hex code (e.g. #FF5733) if the color doesn't perfectly match the primaryColor list, otherwise empty string",
  "confidence": number between 0.0 and 1.0
}
Return only valid JSON. No markdown, no explanation.`;

export async function analyzeClothingFull(
  imageUri: string, // Can be Cloudinary URL or local URI
): Promise<FullClothingAnalysis> {
  const text = await callGeminiVision(imageUri, CLOTH_PROMPT);
  return parseJson<FullClothingAnalysis>(text, {
    category: "Top",
    subCategory: "T-shirt",
    primaryColor: "White",
    secondaryColors: [],
    pattern: "Solid",
    fabricGuess: "Cotton",
    fit: "Regular",
    sleeveType: "Half",
    neckType: "Round",
    season: ["All Season"],
    occasion: ["Casual"],
    formalityScore: 3,
    versatilityTags: ["Pairs well with jeans"],
    brand: "Unknown",
    careInstructions: "Machine wash cold",
    notes: "A casual item",
    colorHex: "",
    confidence: 0.8,
  });
}

// ─── 2. Barcode Image Analysis ────────────────────────────────────────────────

const BARCODE_PROMPT = `You are a clothing product analyst. Look at this clothing item image or its barcode/tag label.
IMPORTANT: This app is STRICTLY for clothing and fashion. If the image contains NO clothing, fashion accessories, or related tags (e.g., if it is food, animals, groceries, or random objects), you MUST set itemName to "Not Clothing" and brand to "Unknown". DO NOT try to analyze non-clothing items.

Extract all visible product information and return ONLY a valid JSON:
{
  "brand": "brand name visible on tag or item (e.g. H&M, Zara, Nike, Unknown)",
  "itemName": "product name from tag (e.g. Slim Fit Shirt)",
  "size": "size if visible (e.g. M, L, XL, 32, Unknown)",
  "color": "color mentioned on tag or visible (e.g. Navy Blue)",
  "price": "price if visible on tag (e.g. Rs. 999, Not visible)",
  "material": "fabric composition if visible (e.g. 100% Cotton, Unknown)",
  "rawText": "all text visible in the image combined as a single string"
}
Return only valid JSON. No markdown.`;

export async function analyzeBarcodeImage(
  imageUri: string,
): Promise<BarcodeAnalysis> {
  const text = await callGeminiVision(imageUri, BARCODE_PROMPT);
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

// ─── 3. Care Label OCR ────────────────────────────────────────────────────────

export async function analyzeClothLabel(
  imageUri: string,
): Promise<LabelAnalysis> {
  let base64Image: string;
  try {
    base64Image = await uriToBase64(imageUri);
  } catch (error) {
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
      review_notes: "Could not read image file",
      error: "Could not read image file",
    };
  }

  try {
    const { data, error: edgeError } = await supabase.functions.invoke(
      "cloth-label-scan",
      {
        body: { base64Image },
      },
    );

    if (edgeError) {
      console.error(`Edge function failed:`, edgeError);
      throw new Error(`Edge function failed. Please ensure it is deployed.`);
    }

    if (!data.success) {
      throw new Error(data.error || "Edge function failed");
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
      review_notes: "Could not analyze the label via edge function.",
      error: err.message,
    };
  }
}

// ─── 4. Fit Check Analysis ────────────────────────────────────────────────────

const FITCHECK_PROMPT = `You are a professional fashion stylist. Analyze this full-body outfit photo.
IMPORTANT: This app is STRICTLY for clothing and fashion. If the image contains NO person wearing an outfit or no fashion items, you MUST set fitScore to 0, rating to "Not an Outfit", and provide a fix like "Please upload a photo of a person wearing an outfit."

Return ONLY a valid JSON:
{
  "fitScore": number from 0 to 100 (overall outfit score),
  "ratingTitle": "Short title, e.g., 'Good Fit ✨', 'Needs Tweaks', 'Perfect Look'",
  "ratingSubtitle": "Short subtitle explaining the score briefly",
  "silhouette": {
    "bodyShape": "Rectangle, Hourglass, Triangle, Inverted Triangle, or Oval",
    "waistBalance": "e.g., 'High-Waist Balance', 'Low-Waist Drop'",
    "topRatio": number (e.g. 42 for a 42:58 ratio),
    "bottomRatio": number (e.g. 58),
    "explanation": "Short explanation of this proportion"
  },
  "fitPrecision": {
    "shoulderFit": { "status": "Perfect", "Tight", or "Loose", "text": "Short detail" },
    "sleeveLength": { "status": "Perfect", "Short", or "Long", "text": "Short detail" },
    "trouserBreak": { "status": "Perfect", "Short", or "Long", "text": "Short detail" }
  },
  "colorTheory": {
    "hexColors": ["#RRGGBB", "#RRGGBB", "#RRGGBB"] (extract 2-4 dominant colors from outfit),
    "harmony": "e.g., 'Analogous Harmony', 'Monochrome'",
    "contrastExplanation": "Short explanation of contrast level"
  },
  "styleCategory": {
    "archetype": "Minimalist, Streetwear, Old Money, etc.",
    "trendScore": number from 0 to 100 (0=Dated, 100=Trending)
  },
  "actionableFixes": [
    { "problem": "What is wrong (e.g., 'Chest area tight')", "solution": "How to fix it (e.g., 'Size up or try relaxed fit')" },
    { "problem": "Another issue", "solution": "Another fix" }
  ],
  "outfitPieces": {
    "top": "Name of top piece, e.g., 'White oxford shirt' or null if none",
    "bottom": "Name of bottom piece, e.g., 'Navy chinos' or null if none",
    "footwear": "Name of footwear, e.g., 'White sneakers' or null if none",
    "accessories": "Name of accessories, e.g., 'Silver watch' or null if none"
  }
}
Be constructive and highly specific. Return only valid JSON. No markdown.`;

export async function analyzeFitCheck(
  imageUri: string,
): Promise<FitCheckAnalysis> {
  const text = await callGeminiVision(imageUri, FITCHECK_PROMPT);
  return parseJson<FitCheckAnalysis>(text, {
    fitScore: 75,
    ratingTitle: "Good Look ✨",
    ratingSubtitle: "A solid outfit with room for minor tweaks.",
    silhouette: {
      bodyShape: "Unknown",
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
      hexColors: ["#1D1A27", "#F9FAFB", "#E9EBF8"],
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
      {
        problem: "Slightly loose silhouette",
        solution: "Consider tucking in your shirt for a more polished look",
      },
    ],
    outfitPieces: {
      top: "White oxford shirt",
      bottom: "Navy chinos",
      footwear: "White sneakers",
      accessories: null,
    },
  });
}
