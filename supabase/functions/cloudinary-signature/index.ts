// @ts-ignore: Deno import is not recognized by standard TS
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import CryptoJS from "npm:crypto-js";
import {
  checkRateLimit,
  getUserIdFromJwt,
  rateLimitBody,
} from "../_shared/rate-limit.ts";
import {
  isRequiredString,
  readJsonBody,
  validationErrorResponse,
} from "../_shared/validate.ts";

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

  // Rate limit: signing oracle — cap at 20/min/user so an abused anon key
  // can't burn unbounded Cloudinary API secret churn.
  const rl = await checkRateLimit("cloudinary-signature", userId, 20, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("cloudinary-signature", 60), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const body = await readJsonBody(req);
    const paramsToSign = isRequiredString(
      (body as Record<string, unknown>)?.paramsToSign,
      "paramsToSign",
    );

    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    if (!apiSecret) {
      throw new Error("Missing CLOUDINARY_API_SECRET environment variable");
    }

    const signature = CryptoJS.SHA1(paramsToSign + apiSecret).toString();

    return new Response(JSON.stringify({ signature }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return validationErrorResponse(error, corsHeaders);
  }
});
