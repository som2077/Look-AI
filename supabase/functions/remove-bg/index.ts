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

  try {
    const { base64Image } = await req.json();

    if (!base64Image) {
      throw new Error("Missing base64Image parameter");
    }

    const keysEnv =
      Deno.env.get("REMOVEBG_API_KEYS") || Deno.env.get("REMOVEBG_API_KEY");
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

    let currentKeyIndex = 0;
    let lastError: any = null;

    while (currentKeyIndex < keys.length) {
      const key = keys[currentKeyIndex];

      const formData = new FormData();
      formData.append("image_file_b64", base64Image);
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
          const b64 = data.data.result_b64;
          return new Response(JSON.stringify({ result_b64: b64 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else if (response.status === 402 || response.status === 429) {
          console.warn(
            `Remove.bg key ${currentKeyIndex + 1} failed. Trying next...`,
          );
          currentKeyIndex++;
        } else {
          const errText = await response.text();
          throw new Error(
            `Remove.bg API Error (${response.status}): ${errText}`,
          );
        }
      } catch (e: any) {
        lastError = e;
        if (e.message && e.message.includes("Remove.bg API Error")) {
          throw e; // Hard error
        }
        throw e; // Network error
      }
    }

    throw new Error(
      "All remove.bg API keys are exhausted or failed. Last error: " +
        (lastError?.message || "Unknown"),
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
