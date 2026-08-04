import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
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
    const {
      person_image_url,
      garment_image_url,
      garment_photo_type,
      garment_category,
    } = await req.json();

    if (!person_image_url || !garment_image_url) {
      return new Response(
        JSON.stringify({
          error: "person_image_url and garment_image_url are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Map footwear to auto for fal.ai compatibility
    const mappedCategory =
      garment_category === "footwear" ? "auto" : garment_category;

    const falKey = Deno.env.get("FAL_KEY");
    if (!falKey) {
      return new Response(
        JSON.stringify({ error: "FAL_KEY environment variable is missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Call fal.ai API
    const falResponse = await fetch("https://fal.run/fal-ai/fashn/tryon/v1.6", {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_image: person_image_url,
        garment_image: garment_image_url,
        garment_photo_type: garment_photo_type || "model",
        category: mappedCategory || "tops",
      }),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      console.error("fal.ai error:", errorText);
      return new Response(
        JSON.stringify({ error: `fal.ai request failed: ${errorText}` }),
        {
          status: falResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const falData = await falResponse.json();

    // Extract the image URL. fal.ai generally returns either `{ images: [{ url: "..." }] }` or `{ image: { url: "..." } }`
    // We'll check common patterns.
    let resultUrl = "";
    if (falData.images && falData.images.length > 0) {
      resultUrl = falData.images[0].url;
    } else if (falData.image && falData.image.url) {
      resultUrl = falData.image.url;
    } else {
      console.error("Unexpected fal.ai response structure:", falData);
      return new Response(
        JSON.stringify({
          error: "Unexpected response structure from fal.ai",
          data: falData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ resultUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
