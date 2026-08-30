// Style-chat edge function.
//
// What this does (post-upgrade):
//   1. Authenticates the user via Clerk "supabase" JWT.
//   2. Rate-limits per user (30/min, fail-open if Upstash env not set).
//   3. Builds a 24-hour user-state context from real Supabase tables
//      (wardrobe_items, logged_outfits, planned_events, streak_logs).
//   4. Injects the context + a token-frugal system prompt.
//   5. Forwards the request to OpenAI on `gpt-4o-mini`, hard-capped at
//      800 output tokens. `prompt_cache_key: userId` lets OpenAI cache
//      the static system prefix across turns (≈70% saving on long sessions).
//   6. Streams the response back unchanged when `stream:true` is set.
//   7. Side-channel: `GET ?action=weather&city=...` returns a real
//      `WeatherSnapshot` from Open-Meteo (used by the client's
//      `show_weather` tool renderer to fill in temp/condition).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { buildContextBlock } from "./recent_context.ts";
import {
  checkRateLimit,
  getUserIdFromJwt,
  rateLimitBody,
} from "../_shared/rate-limit.ts";
import { fetchWeather, fetchWeatherAt } from "../_shared/weather.ts";
import { createUserClient } from "../_shared/supabase-client.ts";

declare const Deno: any;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// System prompt — short and rule-heavy. The 24h user state is appended below.
const BASE_SYSTEM_PROMPT = `You are StyleAI, the user's AI fashion assistant inside the Look AI app.

LANGUAGE — Hinglish by default. Reply in Hinglish (Roman script) unless the user clearly writes two consecutive messages in pure English. A single "Hi" or "thanks" does not flip the language. The user is Indian and expects Hinglish; English-only replies feel robotic. Mirror short English words (e.g. "ok", "ya") inside an otherwise Hinglish sentence.

Be brief, warm, and concrete.

⚠️ HARDEST RULE — READ FIRST ⚠️
ONE tool call per turn. ONE. Pick the single most useful tool for THIS turn and stop. Never invent a tool name. Never concatenate two names into one. The runtime will REJECT any tool call whose name is not in the list below, including concatenated junk like:
  ❌ "suggest_outfitshow_recent_outfits"
  ❌ "show_weathershow_date_picker"
  ❌ "save_outfit_to_calendarquick_log_outfit"
  ❌ "show_weather_show_recent_outfits"
If the user wants two things, do ONE in this turn and the OTHER in your NEXT turn.

Available tools (use EXACTLY these names, one tool per turn):
- show_weather
- suggest_outfit
- show_date_picker
- show_calendar_date
- show_streak
- show_recent_outfits
- compare_outfits
- quick_log_outfit
- save_outfit_to_calendar

Rules:
- You may emit ONLY ONE tool call per turn. Never concatenate names. If you would naturally call two tools, do the more important one this turn and explain the other in plain text so the next turn can pick it up.
- If the answer fits in 1–2 sentences, respond with plain text — no tool.
- Never reference wardrobe items, outfits, or events that are NOT in the "Recent User State" section below. If the user asks about something that isn't in the context, say you don't have that info and offer to scan a new item.
- Avoid filler openers ("Sure!", "Here's…", "Of course!"). Start with the substance.
- If you're unsure between two tools, pick the one whose output the user can act on most directly.
- For show_weather: the user's current GPS location is provided in a <user_location>lat=… lon=… locality=…</user_location> block appended to this prompt. Pass the locality (or "Your area" if locality is missing) as the 'city' arg — the client fills in real coordinates automatically. NEVER ask the user for a city.

Outfit suggestions (HARD rules):
- For suggest_outfit, you MUST pass \`items[].id\` for every item, copying the [id] tag from the "### Wardrobe" list in the 24h context below. Do NOT invent item names — the resolver on the server drops any item whose id is not in the user's wardrobe.
- If the wardrobe list in the context is empty, do NOT call suggest_outfit. Respond with a short Hinglish nudge like "Pehle 4-5 items scan karo, phir main outfits suggest kar sakta hu."
- Each outfit must have at least 3 items, with at least one Top, one Bottom, and (when the wardrobe has them) one Footwear and one Accessory.

Variety across turns (very important — users hate seeing the same outfit twice):
- This is a multi-turn chat. If the user asks for the same occasion again, or just says "doosra / another / try again", look at what you suggested earlier in this conversation (it's in your message history) and do NOT repeat the same item combination.
- Two ways to vary: (a) pick a different combination of the user's items, or (b) reuse the same items but give a different VIBE in the \`why\` and \`style_note\` (e.g. "Smart-Casual" with dark tones, "Weekend Relaxed" with loose layering, "Sporty Errand" with the active pieces). Same 3 items + 3 different vibes is fine — same 3 items + the same "relaxed weekend" copy is NOT.
- If the wardrobe has fewer than 5 items in the context, ALSO add one short Hinglish sentence in your plain-text reply (NOT in the tool args) telling the user to scan 2-3 more items for more variety, e.g. "Aur variety ke liye 2-3 items aur scan karo." This goes alongside the cards, not inside them.

Outfit explanations (very important — users want to understand WHY):
- For every outfit you suggest, put ONE short sentence in the \`why\` field of that outfit explaining the pick. Focus on: weather fit ("breathable cotton for 32°C"), occasion match ("dark colors work for evening"), or color balance ("white tee breaks up the black jacket").
- Plain Hinglish (Roman script) by default. Mirror the user's language if they wrote in English.
- NO fashion jargon: never use words like "monochrome", "tonal", "athleisure", "elevated basics", "capsule", "quiet luxury". Just say what the outfit does in everyday words.
- Keep the \`why\` field to 1 short sentence — the user will see it on the outfit card.

Plain text alongside \`suggest_outfit\` (HARD rule — prevents the card from being shown twice):
- The streamed plain text that you write BEFORE the \`suggest_outfit\` tool call must be ONE short Hinglish sentence (max ~15 words). Its job is to add NEW information, not to re-list the card.
- NEVER include any of the following in the plain text while also calling \`suggest_outfit\`:
  - Markdown image syntax (no \`![alt](url)\` of wardrobe items)
  - Bullet points or numbered lists describing the items
  - The \`why\` or \`style_note\` text — those fields are already shown on the card
  - Markdown headings (\`#\`, \`##\`) for the card content
- Examples of CORRECT plain text (use one of these styles):
  - "Pehla wala try karo — ya agar doosra mood ho toh batao."
  - "Aur variety ke liye 2-3 items aur scan karo, abhi wardrobe chhota hai."
- Examples of WRONG plain text (the model sometimes does this — never again):
  - ❌ "Here's what you can wear for a casual day:\\n\\n![shirt](url)\\n![jeans](url)\\n\\n• Style Note: Smart-Casual\\n• Why: Mix of cozy and semi-formal"
  - ❌ "## Outfit\\n- Gray hoodie\\n- Blue jeans\\n- White tee"
`;

const FORCED_MODEL = "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 800;
const REQUEST_TIMEOUT_MS = 30_000;

async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  // ── Side-channel: weather lookup ────────────────────────────────────────
  // `GET /functions/v1/style-chat?action=weather&city=Mumbai&date=2026-08-30`
  // returns a real Open-Meteo snapshot so the client can render
  // WeatherCard without the model hallucinating temperature/condition.
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("action") === "weather") {
      // Weather is treated as unauthenticated public data (any logged-in
      // app user can look up weather) — we still rate-limit per IP-ish
      // key (the JWT sub) to prevent abuse.
      const authHeader = req.headers.get("Authorization");
      const userId = getUserIdFromJwt(authHeader);
      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      const rl = await checkRateLimit("style-chat", userId, 30, 60);
      if (!rl.allowed) {
        return new Response(rateLimitBody("style-chat", 60), {
          status: rl.status,
          headers: rl.headers,
        });
      }
      const city = url.searchParams.get("city")?.trim();
      const date = url.searchParams.get("date")?.trim() || undefined;
      // Lat/lon + reverse-geocoded locality, when the client has them
      // (the chat always passes these on real devices). Coordinate-based
      // lookups skip the geocode step, so they're both faster and more
      // accurate than asking the model for a city name.
      const latParam = url.searchParams.get("lat");
      const lonParam = url.searchParams.get("lon");
      const locality = url.searchParams.get("locality")?.trim() || null;
      const lat = latParam ? Number(latParam) : NaN;
      const lon = lonParam ? Number(lonParam) : NaN;
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

      if (!hasCoords && !city) {
        return new Response(
          JSON.stringify({ error: "Missing city or lat/lon parameter" }),
          { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
        );
      }
      const snap = hasCoords
        ? await fetchWeatherAt(lat, lon, locality, date)
        : await fetchWeather(city!, date);
      if (!snap) {
        return new Response(
          JSON.stringify({
            error: "Weather lookup failed",
            ...(hasCoords ? { locality } : { city }),
          }),
          { status: 502, headers: { ...CORS, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify(snap), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  }

  // ── Side-channel: outfit resolver ──────────────────────────────────────
  // `POST /functions/v1/style-chat?action=resolve-outfit` takes the AI's
  // raw suggest_outfit args (just label/style_note/why + items[].id),
  // joins the IDs against the caller's wardrobe_items, and returns the
  // resolved items with real names + images. RLS enforces ownership so a
  // user can never see another user's items even if they guess IDs.
  if (
    req.method === "POST" &&
    new URL(req.url).searchParams.get("action") === "resolve-outfit"
  ) {
    const authHeader = req.headers.get("Authorization");
    const userId = getUserIdFromJwt(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const rl = await checkRateLimit("style-chat", userId, 60, 60);
    if (!rl.allowed) {
      return new Response(rateLimitBody("style-chat", 60), {
        status: rl.status,
        headers: rl.headers,
      });
    }

    const body = await readJsonBody(req);
    if (!isObject(body)) {
      // Don't reject with 400 — the client falls into a hard-error path
      // that retries the same tool call repeatedly. Instead, treat it as
      // "no items supplied" so the card can show a friendly empty state.
      // Also re-read the raw body so we can see what actually arrived.
      let rawPreview = "<unreadable>";
      try {
        const cloned = req.clone();
        const text = await cloned.text();
        rawPreview = text.slice(0, 500);
      } catch {
        // ignore
      }
      console.warn(
        "[resolve-outfit] body was not a JSON object; returning empty note.",
        "raw=",
        rawPreview,
        "content-type=",
        req.headers.get("content-type"),
        "content-length=",
        req.headers.get("content-length"),
      );
      return new Response(
        JSON.stringify({
          occasion: "",
          outfits: [],
          note:
            "I couldn't read the items from the AI's response. Try asking again.",
        }),
        { headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const rawOutfits = Array.isArray((body as any).outfits)
      ? (body as any).outfits
      : [];
    const occasion = typeof (body as any).occasion === "string"
      ? (body as any).occasion
      : "";

    // Collect every requested id (deduped) so we can do a single IN-lookup.
    const idSet = new Set<string>();
    for (const o of rawOutfits) {
      if (!isObject(o)) continue;
      const items = Array.isArray((o as any).items) ? (o as any).items : [];
      for (const it of items) {
        if (isObject(it) && typeof (it as any).id === "string") {
          idSet.add((it as any).id);
        }
      }
    }
    const ids = Array.from(idSet);

    // Resolve IDs → wardrobe rows. RLS filters to the caller's user_id.
    const supabaseUrl = Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ??
      Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const byId = new Map<string, Record<string, unknown>>();
    let wardrobeSize = 0;
    if (ids.length > 0) {
      try {
        const sb = createUserClient(
          supabaseUrl,
          supabaseAnonKey,
          authHeader!.replace("Bearer ", ""),
        );
        const { data: rows, error } = await sb
          .from("wardrobe_items")
          .select(
            "id, custom_name, brand, category, sub_category, primary_color, image_url, original_image_url",
          )
          .in("id", ids);
        if (error) {
          console.warn("[resolve-outfit] wardrobe query failed:", error);
        } else if (Array.isArray(rows)) {
          for (const r of rows as any[]) byId.set(r.id, r);
        }
        // Also fetch the user's total wardrobe size so the client can
        // surface a "scan more for variety" hint when the wardrobe is
        // too small to generate distinct outfits each turn.
        const { count: totalCount, error: countErr } = await sb
          .from("wardrobe_items")
          .select("id", { count: "exact", head: true });
        if (!countErr && typeof totalCount === "number") {
          wardrobeSize = totalCount;
        }
        // Diagnostic: log the request, the user, and what we got back so
        // we can tell whether the AI is fabricating IDs vs RLS is filtering.
        console.log(
          "[resolve-outfit] user=",
          userId,
          "wardrobeSize=",
          wardrobeSize,
          "requested=",
          ids.length,
          "ids=",
          ids.slice(0, 6).join(","),
          ids.length > 6 ? `…(+${ids.length - 6})` : "",
          "found=",
          Array.isArray(rows) ? rows.length : 0,
          "missing=",
          ids.filter((x) => !byId.has(x)).slice(0, 6).join(","),
        );
      } catch (err) {
        console.warn("[resolve-outfit] wardrobe query threw:", err);
      }
    }

    // Build the resolved response. Items the AI passed but that don't
    // resolve to a real row are silently dropped.
    const outfits = rawOutfits.map((o: any) => {
      if (!isObject(o)) return null;
      const label = typeof o.label === "string" ? o.label : "";
      const style_note = typeof o.style_note === "string" ? o.style_note : "";
      const why = typeof o.why === "string" ? o.why : undefined;
      const score = typeof o.score === "number" ? o.score : undefined;
      const requested = Array.isArray(o.items) ? o.items.length : 0;
      const items: any[] = [];
      if (Array.isArray(o.items)) {
        for (const it of o.items) {
          if (!isObject(it) || typeof it.id !== "string") continue;
          const row = byId.get(it.id);
          if (!row) continue;
          items.push({
            id: it.id,
            name: row.custom_name ?? "Item",
            category: row.category ?? "—",
            sub_category: row.sub_category ?? null,
            color: row.primary_color ?? null,
            image_url: row.image_url ?? row.original_image_url ?? null,
          });
        }
      }
      return {
        label,
        items,
        style_note,
        why,
        score,
        resolved_count: items.length,
        requested_count: requested,
      };
    }).filter(Boolean);

    // If the AI fabricated every id (or sent nothing), surface a single
    // top-level `note` so the card can show a clear nudge instead of the
    // generic "Here's what you can wear for X" title.
    const totalResolved = outfits.reduce(
      (acc: number, o: any) => acc + (o?.resolved_count ?? 0),
      0,
    );
    const totalRequested = outfits.reduce(
      (acc: number, o: any) => acc + (o?.requested_count ?? 0),
      0,
    );
    let note: string | undefined;
    if (totalRequested === 0) {
      note =
        "Mujhe abhi aapki wardrobe se koi item nahi mila. Pehle 4-5 kapde scan karo, phir main outfits suggest kar sakta hu.";
    } else if (totalResolved === 0) {
      note = occasion
        ? `I couldn't match any items in your wardrobe to "${occasion}". Try a different occasion, or scan a few more pieces first.`
        : "I couldn't match any items in your wardrobe. Try scanning a few more pieces first.";
    }

    return new Response(
      JSON.stringify({ occasion, outfits, note, wardrobe_size: wardrobeSize }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const userId = getUserIdFromJwt(authHeader);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────
  const rl = await checkRateLimit("style-chat", userId, 30, 60);
  if (!rl.allowed) {
    return new Response(rateLimitBody("style-chat", 60), {
      status: rl.status,
      headers: rl.headers,
    });
  }

  try {
    const body = await readJsonBody(req);
    if (!isObject(body)) {
      return new Response(
        JSON.stringify({ error: "Request body must be a JSON object" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const stream = body.stream === true;
    const clientTools = Array.isArray(body.tools) ? body.tools : undefined;

    // `userLocation` is the device's actual GPS coordinates, attached by
    // the chat client on every send. We inject it into the system prompt
    // so the model can use the real location for weather lookups instead
    // of asking the user or falling back to a stale `home_city`.
    const rawLocation = isObject(body.userLocation) ? body.userLocation : null;
    const userLat = rawLocation && Number.isFinite(Number(rawLocation.lat))
      ? Number(rawLocation.lat)
      : null;
    const userLon = rawLocation && Number.isFinite(Number(rawLocation.lon))
      ? Number(rawLocation.lon)
      : null;
    const userLocality = typeof rawLocation?.locality === "string" &&
        rawLocation.locality.trim().length > 0
      ? rawLocation.locality.trim()
      : null;
    const hasUserLocation = userLat !== null && userLon !== null;
    const userLocationBlock = hasUserLocation
      ? `\n\n<user_location>lat=${userLat!.toFixed(3)} lon=${userLon!.toFixed(3)}` +
        `${userLocality ? ` locality=${userLocality}` : ""}</user_location>`
      : "";

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // ── 24h context ────────────────────────────────────────────────────────
    const supabaseUrl = Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ??
      Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const ctx = await buildContextBlock(
      authHeader!.replace("Bearer ", ""),
      supabaseUrl,
      supabaseAnonKey,
      messages,
    );

    // The system prompt we send to OpenAI is BASE_SYSTEM_PROMPT + 24h block.
    // We use prompt_cache_key so OpenAI caches BASE_SYSTEM_PROMPT across
    // turns; the 24h block is per-user and also stable within a session.
    // The <user_location> block is appended right after the base prompt so
    // it's part of the same cached prefix when the user is in one place
    // (the common case).
    const systemContent = ctx.block
      ? `${BASE_SYSTEM_PROMPT}${userLocationBlock}\n\n${ctx.block}`
      : `${BASE_SYSTEM_PROMPT}${userLocationBlock}`;

    // Append to (not replace) any client-provided system message. The
    // client sends a tiny Hinglish reminder; replacing it would erase
    // that personality. Appending keeps the reminder at the top (so the
    // model reads it first) and the real prompt + context below.
    const newMessages = [...messages];
    if (newMessages[0]?.role === "system") {
      const prior = typeof newMessages[0].content === "string"
        ? newMessages[0].content
        : "";
      newMessages[0] = {
        ...newMessages[0],
        content: prior ? `${prior}\n\n${systemContent}` : systemContent,
      };
    } else {
      newMessages.unshift({ role: "system", content: systemContent });
    }

    // ── OpenAI call ────────────────────────────────────────────────────────
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ||
      Deno.env.get("EXPO_PUBLIC_OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    const openaiBody: Record<string, unknown> = {
      model: FORCED_MODEL,
      messages: newMessages,
      max_tokens: MAX_OUTPUT_TOKENS,
      // Stop on triple newline — prevents multi-paragraph filler outputs
      // that bloat the completion token count.
      stop: ["\n\n\n"],
      // Per-user cache key — OpenAI caches the static system prompt prefix
      // across all turns of the same user for 5–10 minutes.
      prompt_cache_key: `style-chat:${userId}`,
      // Force one tool call per turn. With gpt-4o-mini the model sometimes
      // tries to satisfy multiple intents at once by concatenating tool
      // names (e.g. "suggest_outfitshow_date_picker"). Single-call mode
      // makes the model pick one and finish the turn.
      parallel_tool_calls: false,
    };
    if (stream) openaiBody.stream = true;
    if (clientTools && clientTools.length > 0) openaiBody.tools = clientTools;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    const upstreamRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(openaiBody),
        signal: controller.signal,
      },
    ).finally(() => clearTimeout(timeoutId));

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      console.error(
        `[style-chat] OpenAI ${upstreamRes.status} for user=${userId} ctxChars=${ctx.charCount}:`,
        errText.slice(0, 200),
      );
      return new Response(
        JSON.stringify({
          error: `OpenAI upstream error: ${upstreamRes.status}`,
        }),
        {
          status: 502,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    if (stream) {
      // Pass the stream straight back. Don't buffer.
      return new Response(upstreamRes.body, {
        headers: {
          ...CORS,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    const json = await upstreamRes.json();
    return new Response(JSON.stringify(json), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error(`[style-chat] user=${userId}:`, message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }
});
