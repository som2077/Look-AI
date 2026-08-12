// @ts-ignore: Deno import is not recognized by standard TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import CryptoJS from "npm:crypto-js";
import { checkRateLimit, getUserIdFromJwt, rateLimitBody } from "../_shared/rate-limit.ts";
import {
  isRequiredString,
  readJsonBody,
} from "../_shared/validate.ts";

// @ts-ignore: Declare Deno globally to satisfy TS compiler in IDE
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: require a real user JWT (Clerk "supabase" template, carries `sub`).
  // Supabase's verify_jwt accepts anon keys (they're project-signed JWTs), so
  // gate on the presence of a user id to block anon-key / service-role abuse.
  const authHeader = req.headers.get("Authorization");
  const userId = getUserIdFromJwt(authHeader);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit: 5 calls/min/user (multi-step: up to 4 Gemini + 1 remove.bg + 2 Cloudinary)
  const rl = await checkRateLimit("analyze-cloth-item", userId, 5, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("analyze-cloth-item", 60), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const body = await readJsonBody(req);
    const base64Image = isRequiredString(
      (body as Record<string, unknown>)?.base64Image,
      "base64Image",
    );

    // Clean base64 string
    const cleanBase64 = base64Image.includes(",")
      ? base64Image.split(",")[1].trim()
      : base64Image.trim();

    // Detect mime type
    let mimeType = "image/jpeg";
    if (base64Image.startsWith("data:image/png")) mimeType = "image/png";
    else if (base64Image.startsWith("data:image/webp")) mimeType = "image/webp";

    const cloudinaryUrl = Deno.env.get("CLOUDINARY_URL") || "";
    const apiSecret =
      Deno.env.get("CLOUDINARY_API_SECRET") ||
      (cloudinaryUrl ? cloudinaryUrl.split(":")[2]?.split("@")[0] : "");
    const apiKey =
      Deno.env.get("EXPO_PUBLIC_CLOUDINARY_API_KEY") ||
      (cloudinaryUrl ? cloudinaryUrl.split("://")[1]?.split(":")[0] : "");
    const cloudName =
      Deno.env.get("EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME") ||
      (cloudinaryUrl ? cloudinaryUrl.split("@")[1] : "");

    const keysEnv =
      Deno.env.get("REMOVEBG_API_KEYS") ||
      Deno.env.get("EXPO_PUBLIC_REMOVE_BG_API_KEYS") ||
      Deno.env.get("REMOVEBG_API_KEY") ||
      "";
    const removeBgKeys = keysEnv
      .split(",")
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);

    const geminiKey =
      Deno.env.get("GOOGLE_GEMINI_API_KEY") ||
      Deno.env.get("EXPO_PUBLIC_GEMINI_API_KEY");

    if (!geminiKey) {
      throw new Error("Missing GOOGLE_GEMINI_API_KEY environment variable");
    }

    // 1. Upload original image to Cloudinary
    let originalUrl: string | null = null;
    let bgRemovedUrl: string | null = null;
    let bgBase64 = cleanBase64;

    if (cloudName) {
      try {
        const timestamp = Math.round(Date.now() / 1000).toString();
        const originalFolder = "cloth-items/originals";
        let originalSignature = "";

        if (apiSecret) {
          const paramsToSign = `folder=${originalFolder}&timestamp=${timestamp}`;
          originalSignature = CryptoJS.SHA1(paramsToSign + apiSecret).toString();
        }

        const formData = new FormData();
        formData.append("file", `data:${mimeType};base64,${cleanBase64}`);
        formData.append("timestamp", timestamp);
        formData.append("folder", originalFolder);
        if (apiKey) formData.append("api_key", apiKey);
        if (originalSignature) formData.append("signature", originalSignature);

        const cloudinaryOriginalRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData },
        );
        const originalData = (await cloudinaryOriginalRes.json()) as any;
        if (originalData?.secure_url) {
          originalUrl = originalData.secure_url;
          bgRemovedUrl = originalUrl;
        }
      } catch (cloudErr) {
        console.warn("Cloudinary upload original error:", cloudErr);
      }
    }

    // 2. Remove background using remove.bg (Try all available API keys)
    let removedBgB64: string | null = null;

    for (let i = 0; i < removeBgKeys.length; i++) {
      const key = removeBgKeys[i];
      try {
        const removeBgFormData = new FormData();
        removeBgFormData.append("image_file_b64", cleanBase64);
        removeBgFormData.append("size", "auto");
        removeBgFormData.append("format", "png");
        removeBgFormData.append("response_type", "base64");

        const removebgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": key,
            Accept: "application/json",
          },
          body: removeBgFormData,
        });

        if (removebgRes.ok) {
          const bgData = await removebgRes.json();
          if (bgData?.data?.result_b64) {
            removedBgB64 = bgData.data.result_b64;
            bgBase64 = removedBgB64;
            console.log(`[RemoveBG] Successfully removed background with key index ${i}`);
            break;
          }
        } else {
          const errStatus = removebgRes.status;
          console.warn(`[RemoveBG] Key ${i} failed with status ${errStatus}. Trying next key...`);
        }
      } catch (keyErr) {
        console.warn(`[RemoveBG] Key ${i} exception:`, keyErr);
      }
    }

    // 3. Upload background-removed PNG to Cloudinary
    if (removedBgB64 && cloudName) {
      try {
        const bgFolder = "cloth-items/bg-removed";
        const bgTimestamp = Math.round(Date.now() / 1000).toString();
        let bgSignature = "";

        if (apiSecret) {
          const bgParams = `folder=${bgFolder}&timestamp=${bgTimestamp}`;
          bgSignature = CryptoJS.SHA1(bgParams + apiSecret).toString();
        }

        const bgFormData = new FormData();
        bgFormData.append("file", `data:image/png;base64,${removedBgB64}`);
        bgFormData.append("timestamp", bgTimestamp);
        bgFormData.append("folder", bgFolder);
        if (apiKey) bgFormData.append("api_key", apiKey);
        if (bgSignature) bgFormData.append("signature", bgSignature);

        const cloudinaryBgRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: bgFormData },
        );
        const bgCloudData = (await cloudinaryBgRes.json()) as any;
        if (bgCloudData?.secure_url) {
          bgRemovedUrl = bgCloudData.secure_url;
          console.log(`[Cloudinary] bg_removed_url uploaded: ${bgRemovedUrl}`);
        }
      } catch (bgCloudErr) {
        console.warn("Cloudinary bg upload error:", bgCloudErr);
      }
    }

    // 4. Analyze with Gemini Vision (Multi-model fallbacks)
    const visionPrompt = `Analyze this clothing item image. Extract the following details: clothType, color, material, pattern, style, fit, condition, sleeve_type, neckline, notable_features, seasonality, care_hints. Respond ONLY with valid JSON. No markdown.`;

    const MODELS = [
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ];

    let parsedVision: any = null;

    for (const model of MODELS) {
      try {
        const geminiVisionRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: visionPrompt },
                    { inline_data: { mime_type: removedBgB64 ? "image/png" : mimeType, data: bgBase64 } },
                  ],
                },
              ],
              generationConfig: { temperature: 0.2 },
            }),
          },
        );

        const visionJson = (await geminiVisionRes.json()) as any;
        const rawVisionText =
          visionJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (rawVisionText) {
          const cleanVisionText = rawVisionText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          parsedVision = JSON.parse(cleanVisionText);
          break;
        }
      } catch (mErr) {
        console.warn(`Vision model ${model} failed:`, mErr);
      }
    }

    if (!parsedVision) {
      parsedVision = {
        clothType: "Clothing Item",
        color: "Detected Color",
        style: "Casual",
      };
    }

    // 5. Map vision data to form fields
    const textPrompt = `You are a fashion data mapper. Given this vision analysis JSON:
${JSON.stringify(parsedVision)}

Output ONLY a valid JSON object matching this schema:
{
  "season": "Spring / Summer / Autumn / Winter / All Season",
  "occasion": "Casual / Formal / Party / etc",
  "category": "Top / Bottom / Outerwear / Dress / Accessory",
  "color": "Primary color",
  "careInstructions": "Short string of care hints",
  "brand": "Brand if identified, else Unknown",
  "notes": "Short summary of style and features"
}
Do not use markdown blocks.`;

    let parsedFormFields: any = null;

    for (const model of MODELS) {
      try {
        const geminiTextRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: textPrompt }] }],
              generationConfig: { temperature: 0.1 },
            }),
          },
        );

        const textJson = (await geminiTextRes.json()) as any;
        const rawFlashText =
          textJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (rawFlashText) {
          const cleanFlashText = rawFlashText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          parsedFormFields = JSON.parse(cleanFlashText);
          break;
        }
      } catch (tErr) {
        console.warn(`Text mapping model ${model} failed:`, tErr);
      }
    }

    if (!parsedFormFields) {
      parsedFormFields = {
        category: "Top",
        occasion: "Casual",
        season: "All Season",
        color: parsedVision?.color || "Multicolor",
        brand: "Unknown",
        careInstructions: "Machine wash cold, tumble dry low",
        notes: "Stylish clothing item.",
      };
    }

    // 6. Return complete response
    return new Response(
      JSON.stringify({
        success: true,
        original_url: originalUrl,
        bg_removed_url: bgRemovedUrl,
        form_fields: parsedFormFields,
        raw_gemini_vision: parsedVision,
        raw_gemini_flash: parsedFormFields,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error?.status ?? 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
