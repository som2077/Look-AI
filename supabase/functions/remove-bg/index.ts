// @ts-ignore: Deno import is not recognized by standard TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore: Declare Deno globally
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

    const cleanBase64 = base64Image.includes(",")
      ? base64Image.split(",")[1].trim()
      : base64Image.trim();

    const keysEnv =
      Deno.env.get("REMOVEBG_API_KEYS") ||
      Deno.env.get("EXPO_PUBLIC_REMOVE_BG_API_KEYS") ||
      Deno.env.get("REMOVEBG_API_KEY");

    if (!keysEnv) {
      throw new Error("Missing REMOVEBG_API_KEYS environment variable");
    }

    const keys = keysEnv
      .split(",")
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);

    if (keys.length === 0) {
      throw new Error("No valid remove.bg API keys found");
    }

    let lastError: any = null;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const formData = new FormData();
      formData.append("image_file_b64", cleanBase64);
      formData.append("size", "auto");
      formData.append("format", "png");
      formData.append("response_type", "base64");

      try {
        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": key,
            Accept: "application/json",
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const b64 = data.data?.result_b64;
          if (b64) {
            return new Response(JSON.stringify({ result_b64: b64 }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        } else {
          const errText = await response.text();
          console.warn(`[RemoveBG] Key ${i} failed (${response.status}): ${errText}`);
          lastError = new Error(`Key ${i} failed: ${errText}`);
        }
      } catch (e: any) {
        console.warn(`[RemoveBG] Key ${i} network error:`, e);
        lastError = e;
      }
    }

    throw new Error(
      "All remove.bg API keys failed. Last error: " + (lastError?.message || "Unknown"),
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
