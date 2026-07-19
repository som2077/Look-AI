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
  care_symbols: Array<{
    id: string;
    category: string;
    label: string;
    confidence: "high" | "medium" | "low";
  }>;
  fabric_composition: Array<{
    material: string;
    percentage: number | null;
  }>;
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
  actionableFixes: Array<{
    problem: string;
    solution: string;
  }>;
  error?: string;
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
    generationConfig: { 
      temperature: 0.2, 
      maxOutputTokens: 1024,
      responseMimeType: "application/json" 
    },
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
      const candidate = data?.candidates?.[0];
      if (candidate?.finishReason === "SAFETY") {
        return JSON.stringify({ error: "SAFETY_VIOLATION" });
      }
      return candidate?.content?.parts?.[0]?.text ?? null;
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
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase configuration");
  }

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
    const res = await fetch(`${supabaseUrl}/functions/v1/cloth-label-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Edge function failed with status ${res.status}: ${errText}`);
      throw new Error(`Edge function failed (Status: ${res.status}). Please ensure it is deployed.`);
    }

    const data = await res.json();
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
  ]
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
  });
}
