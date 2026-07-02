/**
 * Gemini Scan Services — Extended AI scanning for Look AI
 * Handles: Full Cloth Scan, Barcode Image, Care Label OCR, Fit Check
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FullClothingAnalysis {
  name: string;
  category: "top" | "bottoms" | "footwear" | "outerwear" | "dress" | "ethnic" | "accessory";
  color: string;
  colorHex: string;
  material: string;
  pattern: string;
  sleeveType: string;
  neckType: string;
  occasion: "Casual" | "Office" | "Party" | "Wedding" | "Date" | "Gym";
  season: "All" | "Summer" | "Winter" | "Monsoon" | "Spring";
  matchingColors: Array<{ name: string; hex: string }>;
  confidence: number;
}

export interface BarcodeAnalysis {
  brand: string;
  itemName: string;
  size: string;
  color: string;
  price: string;
  material: string;
  rawText: string;
}

export interface LabelAnalysis {
  rawText: string;
  washTemp: string;
  ironInstructions: string;
  bleach: string;
  drying: string;
  fabricComposition: string;
  aiExplanation: string;
}

export interface FitCheckAnalysis {
  fitScore: number;
  colorHarmony: string;
  occasionMatch: string;
  layering: string;
  suggestions: string[];
  rating: string;
  outfitItems: string[];
}

// ─── Core Gemini caller ───────────────────────────────────────────────────────

async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function callGeminiVision(
  imageUri: string,
  prompt: string,
): Promise<string | null> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    return null;
  }

  let base64: string;
  try {
    base64 = await uriToBase64(imageUri);
  } catch {
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
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
  };

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (res.status === 429) continue;
      if (!res.ok) continue;
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch {
      continue;
    }
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

// ─── 1. Full Clothing Scan ────────────────────────────────────────────────────

const CLOTH_PROMPT = `You are a fashion AI. Analyze the clothing item in this image.
IMPORTANT: This app is STRICTLY for clothing and fashion. If the image contains NO clothing, fashion accessories, or related items (e.g., if it is food, animals, random objects), you MUST set name and category to "Not Clothing", set color, material, pattern, sleeveType, neckType to "Unknown", and set confidence to 0. DO NOT try to analyze non-clothing items.

Return ONLY a valid JSON object with exactly these fields:
{
  "name": "descriptive item name (e.g. Navy Blue Denim Jacket)",
  "category": one of: "top" | "bottoms" | "footwear" | "outerwear" | "dress" | "ethnic" | "accessory",
  "color": "human readable color (e.g. Navy Blue)",
  "colorHex": "dominant hex color (e.g. #1B3A6B)",
  "material": "fabric type (e.g. Cotton, Polyester, Denim, Silk, Wool)",
  "pattern": "pattern type (e.g. Solid, Stripes, Floral, Checks, Polka Dots)",
  "sleeveType": "sleeve type (e.g. Full Sleeve, Half Sleeve, Sleeveless, N/A)",
  "neckType": "neck type (e.g. Round Neck, V-Neck, Collar, Turtleneck, N/A)",
  "occasion": one of: "Casual" | "Office" | "Party" | "Wedding" | "Date" | "Gym",
  "season": one of: "All" | "Summer" | "Winter" | "Monsoon" | "Spring",
  "matchingColors": [{"name":"color name","hex":"#hexcode"}, {"name":"color name","hex":"#hexcode"}, {"name":"color name","hex":"#hexcode"}],
  "confidence": number between 0.7 and 1.0 (or 0 if not clothing)
}
Return only valid JSON. No markdown, no explanation.`;

export async function analyzeClothingFull(
  imageUri: string,
): Promise<FullClothingAnalysis> {
  const text = await callGeminiVision(imageUri, CLOTH_PROMPT);
  return parseJson<FullClothingAnalysis>(text, {
    name: "Casual Top",
    category: "top",
    color: "White",
    colorHex: "#FFFFFF",
    material: "Cotton",
    pattern: "Solid",
    sleeveType: "Half Sleeve",
    neckType: "Round Neck",
    occasion: "Casual",
    season: "All",
    matchingColors: [
      { name: "Navy Blue", hex: "#1B3A6B" },
      { name: "Beige", hex: "#F5F0E8" },
      { name: "Olive", hex: "#6B7A3A" },
    ],
    confidence: 0.75,
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

const LABEL_PROMPT = `You are a clothing care expert. Analyze this clothing care label image.
IMPORTANT: This app is STRICTLY for clothing and fashion. If the image contains NO clothing, clothing labels, or fashion items (e.g., if it is a food label, nutrition facts, or random object), you MUST set aiExplanation to "This does not appear to be a clothing care label." and all other fields to "Not detected". DO NOT try to extract non-clothing information.

Extract care instructions and return ONLY a valid JSON:
{
  "rawText": "all text visible on the label",
  "washTemp": "washing instructions (e.g. Machine wash cold 30C, Hand wash only)",
  "ironInstructions": "ironing instructions (e.g. Iron on low heat, Do not iron)",
  "bleach": "bleach instructions (e.g. Do not bleach, Bleach when needed)",
  "drying": "drying instructions (e.g. Tumble dry low, Hang dry, Do not tumble dry)",
  "fabricComposition": "fabric percentages (e.g. 80% Cotton 20% Polyester)",
  "aiExplanation": "Simple 2-3 sentence explanation of how to care for this item in plain English"
}
Return only valid JSON. No markdown.`;

export async function analyzeClothLabel(
  imageUri: string,
): Promise<LabelAnalysis> {
  const text = await callGeminiVision(imageUri, LABEL_PROMPT);
  return parseJson<LabelAnalysis>(text, {
    rawText: "Could not read label",
    washTemp: "Not detected",
    ironInstructions: "Not detected",
    bleach: "Not detected",
    drying: "Not detected",
    fabricComposition: "Not detected",
    aiExplanation:
      "Could not extract care instructions from this label. Please try capturing a clearer image of the label.",
  });
}

// ─── 4. Fit Check Analysis ────────────────────────────────────────────────────

const FITCHECK_PROMPT = `You are a professional fashion stylist. Analyze this full-body outfit photo.
IMPORTANT: This app is STRICTLY for clothing and fashion. If the image contains NO person wearing an outfit or no fashion items (e.g., if it is food, animals, or random objects), you MUST set fitScore to 0, rating to "Not an Outfit", and suggestions to ["Please upload a photo of a person wearing an outfit or fashion items."]. DO NOT try to style non-clothing items.

Return ONLY a valid JSON:
{
  "fitScore": number from 0 to 100 (overall outfit score),
  "colorHarmony": "Excellent" | "Good" | "Needs Work",
  "occasionMatch": "Casual" | "Office" | "Party" | "Wedding" | "Date" | "Gym" | "Streetwear",
  "layering": "short feedback about layering (e.g. Great layering, Could add a jacket, Clean minimal look)",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "rating": "Stylish" | "Good Look" | "Needs Work" | "Try These Tips" | "Not an Outfit",
  "outfitItems": ["detected item 1", "detected item 2", "detected item 3"]
}
Be constructive and specific. Return only valid JSON. No markdown.`;

export async function analyzeFitCheck(
  imageUri: string,
): Promise<FitCheckAnalysis> {
  const text = await callGeminiVision(imageUri, FITCHECK_PROMPT);
  return parseJson<FitCheckAnalysis>(text, {
    fitScore: 75,
    colorHarmony: "Good",
    occasionMatch: "Casual",
    layering: "Clean and minimal look",
    suggestions: [
      "Try adding a statement accessory",
      "Consider tucking in your shirt for a more polished look",
      "Your color combination works well together",
    ],
    rating: "Good Look",
    outfitItems: ["Top", "Bottoms", "Footwear"],
  });
}
