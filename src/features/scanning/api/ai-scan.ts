/**
 * Gemini Scan Services — Extended AI scanning for Look AI
 * Handles: Full Cloth Scan, Care Label OCR, Fit Check, Multi-Item Wardrobe Scan
 */

import { supabase } from "@/shared/supabase/client";
import { captureFeatureError } from "@/shared/telemetry/sentry";
import * as FileSystem from "expo-file-system";


// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpenAIVisionResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: { content?: string };
  }>;
}


export interface LabelAnalysis {
  is_valid_apparel: boolean;
  rejection_reason: string | null;
  care_symbols: {
    id: string;
    category: string;
    label: string;
    confidence: "high" | "medium" | "low";
  }[];
  title: string | null;
  instructions: string | null;
  label_standard_guess: "iso_ginetex" | "astm" | "unclear";
  needs_user_review: boolean;
  review_notes: string | null;
  error?: string;
}

import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";

export interface FitCheckAnalysis {
  colorHarmony: number;
  silhouette: number;
  cohesion: number;
  occasion: number;
  fit: number;
  strengths: string[];
  improvements: string[];
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
  mode: "cloth" | "fitcheck" | "label" = "cloth",
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
    model: mode === "label" ? "gpt-4o" : "gpt-4o-mini",
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

const LABEL_PROMPT = `Analyze this image. Check if it is a care/brand label for clothing, footwear, or accessories.
If it is NOT an apparel label (e.g., food, electronics, random object), set "is_valid_apparel" to false, provide a "rejection_reason", and return null for the rest.
If valid, extract care symbols and generate a care guide. Return JSON:
{
  "is_valid_apparel": true or false,
  "rejection_reason": "Explanation if false, else null",
  "care_symbols": [{"id": "wash","category": "washing","label": "Wash cold","confidence": "high"}],
  "title": "A short, descriptive title related to the item (e.g., Cotton T-Shirt Care Guide, Denim Washing Instructions)",
  "instructions": "Write a short, friendly, and conversational paragraph explaining how to care for this item. Do NOT use numbered lists or bullet points. Speak naturally like a human giving helpful advice.",
  "label_standard_guess": "unclear",
  "needs_user_review": false,
  "review_notes": "null"
}`;

export async function analyzeClothLabel(
  imageUri: string,
): Promise<LabelAnalysis> {
  const text = await callOpenAIVision(imageUri, LABEL_PROMPT, "label", 600);
  return parseJson<LabelAnalysis>(text, {
    is_valid_apparel: false,
    rejection_reason: "Failed to parse the image properly.",
    care_symbols: [],
    title: null,
    instructions: null,
    label_standard_guess: "unclear",
    needs_user_review: true,
    review_notes: "Parse error.",
  });
}


// ─── Mode 3: Fit Check Analysis ───────────────────────────────────────────────

const getFitcheckPrompt = (profile: { bodyType: string, height: number, stylePreferences: string[], gender: string }) => `You are a high-end fashion AI stylist. Analyze the full-body outfit photo, taking into account the user's physical profile and style preferences. Return ONLY valid JSON matching this exact schema: {"colorHarmony": 9.2, "silhouette": 7.8, "cohesion": 8.1, "occasion": 6.5, "fit": 9.0, "strengths": ["string"], "improvements": ["string"]}. All scores must be out of 10.0 (one decimal place). Score 'fit' and 'silhouette' based on what flatters their specific body type and aligns with their style preferences.

User Profile:
Gender: ${profile.gender || 'Not specified'}
Body Type: ${profile.bodyType || 'Not specified'}
Height: ${profile.height ? profile.height + 'cm' : 'Not specified'}
Style Preferences: ${profile.stylePreferences?.join(", ") || 'Not specified'}

Analyze this outfit:`;

export async function analyzeFitCheck(
  imageUri: string,
): Promise<FitCheckAnalysis> {
  const state = useOnboardingState.getState();
  
  const fallbackData: FitCheckAnalysis = {
    colorHarmony: 8.0,
    silhouette: 8.0,
    cohesion: 8.0,
    occasion: 8.0,
    fit: 8.0,
    strengths: ["Great attempt!"],
    improvements: ["Could not fully analyze the image. Please try again with a clearer photo."],
  };

  const prompt = getFitcheckPrompt({
    bodyType: state.bodyType,
    height: state.height,
    stylePreferences: state.stylePreferences,
    gender: state.gender,
  });

  const text = await callOpenAIVision(imageUri, prompt, "fitcheck", 400);
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
