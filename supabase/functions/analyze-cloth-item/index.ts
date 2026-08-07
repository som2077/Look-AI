// @ts-ignore: Deno import is not recognized by standard TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { base64Image } = await req.json();

    if (!base64Image) {
      throw new Error("Missing base64Image parameter");
    }

    const cloudinaryUrl = Deno.env.get("CLOUDINARY_URL");
    const cloudinaryPreset = Deno.env.get("CLOUDINARY_PRESET");
    const removebgKey = Deno.env.get("REMOVEBG_API_KEY");
    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");

    if (!cloudinaryUrl || !cloudinaryPreset || !removebgKey || !geminiKey) {
      throw new Error("Missing required environment variables");
    }

    const cloudName = cloudinaryUrl.split("@")[1];

    // 1. Upload original image to Cloudinary
    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64Image}`);
    formData.append("upload_preset", cloudinaryPreset);
    formData.append("folder", "cloth-items/originals");

    const cloudinaryOriginalRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData },
    );
    const originalData = (await cloudinaryOriginalRes.json()) as any;
    if (!originalData.secure_url) {
      throw new Error("Failed to upload original image to Cloudinary");
    }
    const originalUrl = originalData.secure_url;

    // 2. Call remove.bg API
    const removebgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": removebgKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: originalUrl,
        size: "auto",
      }),
    });

    if (!removebgRes.ok) {
      throw new Error("Failed to remove background");
    }

    // We get a binary blob back
    const bgRemovedBlob = await removebgRes.blob();

    // 3. Upload background-removed PNG to Cloudinary
    const bgFormData = new FormData();
    bgFormData.append("file", bgRemovedBlob, "bg-removed.png");
    bgFormData.append("upload_preset", cloudinaryPreset);
    bgFormData.append("folder", "cloth-items/bg-removed");

    const cloudinaryBgRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: bgFormData },
    );
    const bgData = (await cloudinaryBgRes.json()) as any;
    if (!bgData.secure_url) {
      throw new Error(
        "Failed to upload background-removed image to Cloudinary",
      );
    }
    const bgRemovedUrl = bgData.secure_url;

    // 4. Get base64 of the bgRemoved image for Gemini Vision
    const bgArrayBuffer = await bgRemovedBlob.arrayBuffer();
    const bgBase64 = btoa(
      String.fromCharCode(...new Uint8Array(bgArrayBuffer)),
    );

    // 5. Analyze with Gemini 2.0 Flash Vision
    const visionPrompt = `Analyze this clothing item image. Extract the following details: clothType, color, material, pattern, style, fit, condition, sleeve_type, neckline, notable_features, seasonality, care_hints. Respond ONLY with valid JSON. No markdown.`;

    const geminiVisionRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: visionPrompt },
                { inline_data: { mime_type: "image/png", data: bgBase64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.2 },
        }),
      },
    );

    const visionJson = (await geminiVisionRes.json()) as any;
    const rawVisionText =
      visionJson?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Strip markdown formatting if any
    const cleanVisionText = rawVisionText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsedVision = JSON.parse(cleanVisionText);

    // 6. Map vision data to form fields using Gemini Flash text model
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

    const geminiTextRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
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
      textJson?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const cleanFlashText = rawFlashText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsedFormFields = JSON.parse(cleanFlashText);

    // 7. Return complete response
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
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
