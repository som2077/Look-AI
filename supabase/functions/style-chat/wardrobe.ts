// Real wardrobe / activity query, scoped to the last 24 hours.
//
// Why "last 24 hours"?
//   The chat's system prompt only needs the user's *current* state — what they
//   added, wore, planned, or are on a streak for, in the last 24h. Older data
//   dilutes the prompt, raises token cost, and isn't what the user is asking
//   about right now.
//
// All tables are scoped to the caller's `user_id` via the row-level security
// policies that already exist (the JWT we pass in is the user's Clerk
// "supabase" template token, so RLS filters for us — we don't need to add a
// `WHERE user_id = ...` filter; it's enforced at the database level).
//
// Token budget: every section is hard-capped so the total stays under ~1200
// tokens once the orchestrator (recent_context.ts) wraps it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export interface Recent24hContext {
  today: string;
  userProfile: string;
  wardrobe24h: string;
  loggedOutfits24h: string;
  plannedEvents24h: string;
  streak24h: string;
  totalChars: number;
}

// Section caps (chars). Sum should stay under ~4500 chars (~1100-1300 tokens).
const CAPS = {
  wardrobe: 2400, // ~600 tokens
  outfits: 700, // ~175 tokens
  events: 700, // ~175 tokens
  streak: 200, // ~50 tokens
  profile: 400, // ~100 tokens
};

function trim(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n…(truncated)";
}

function escape(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s).replace(/[\r\n]+/g, " ").trim();
}

function clampName(s: string | null | undefined, n = 40): string {
  const t = escape(s);
  return t.length > n ? t.slice(0, n) + "…" : t;
}

/**
 * Build a 24h-snapshot of the user's fashion state. Caller is the edge
 * function; the result is appended to the system prompt.
 *
 * @param token The user's Clerk "supabase" template JWT.
 * @param supabaseUrl e.g. https://xxx.supabase.co (from env).
 * @param supabaseAnonKey e.g. eyJ…anon… (from env).
 */
export async function getRecent24hContext(
  token: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<Recent24hContext> {
  // A user-scoped client. We pass the user's JWT as the Authorization header
  // on every request; Supabase RLS then enforces user_id = auth.uid() for us.
  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Run all queries in parallel; each is best-effort. If one fails we want
  // the chat to keep working with whatever else came back.
  //
  // Date cutoffs:
  //   - `cutoffIso`        : 24h ago as a full ISO timestamp. Used for
  //                          timestamp columns (created_at).
  //   - `yesterdayDate`    : 24h ago as YYYY-MM-DD. Used for DATE columns
  //                          (last_worn_date, activity_date, event_date).
  //   - `todayDate`        : today as YYYY-MM-DD. Used to include events
  //                          that are today or in the future.
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const todayDate = new Date().toISOString().slice(0, 10);

  const [profileRes, wardrobeRes, outfitsRes, eventsRes, streakRes] =
    await Promise.allSettled([
      sb
        .from("user_profiles")
        .select(
          "nickname, username, style_preferences, body_type, gender, weather_city",
        )
        .maybeSingle(),
      sb
        .from("wardrobe_items")
        .select(
          "id, custom_name, brand, category, sub_category, primary_color, occasion, season, image_url, original_image_url, last_worn_date, created_at",
        )
        // Show items the user recently added OR recently wore. The OR
        // keeps the wardrobe panel useful even on quiet days.
        .or(
          `created_at.gt.${cutoffIso},last_worn_date.gt.${yesterdayDate}`,
        )
        .order("created_at", { ascending: false })
        .limit(20),
      sb
        .from("logged_outfits")
        .select("id, title, occasion, date, image_url, score, created_at")
        .gte("created_at", cutoffIso)
        .order("created_at", { ascending: false })
        .limit(5),
      sb
        .from("planned_events")
        .select(
          "id, event_date, event_time, occasion_label, location, status, created_at",
        )
        // Show events recently added OR upcoming (today/future).
        .or(
          `created_at.gt.${cutoffIso},event_date.gte.${todayDate}`,
        )
        .order("event_date", { ascending: true })
        .limit(5),
      sb
        .from("streak_logs")
        .select("activity_date, activity_type")
        .gte("activity_date", yesterdayDate),
    ]);

  // ── user profile ─────────────────────────────────────────────────────────
  let userProfile = "(no profile data)";
  if (profileRes.status === "fulfilled" && profileRes.value.data) {
    const p = profileRes.value.data as Record<string, unknown>;
    const bits: string[] = [];
    if (p.nickname || p.username) bits.push(`name=${p.nickname || p.username}`);
    if (p.gender) bits.push(`gender=${p.gender}`);
    if (p.body_type) bits.push(`body=${p.body_type}`);
    if (Array.isArray(p.style_preferences) && p.style_preferences.length) {
      bits.push(`styles=${(p.style_preferences as string[]).join("|")}`);
    }
    if (p.weather_city) bits.push(`home_city=${p.weather_city}`);
    userProfile = bits.join("; ");
  }

  // ── wardrobe (24h slice, top 20) ──────────────────────────────────────────
  let wardrobe24h = "(no recent items)";
  if (wardrobeRes.status === "fulfilled" && Array.isArray(wardrobeRes.value.data)) {
    const items = wardrobeRes.value.data as any[];
    if (items.length > 0) {
      const lines = items.map((it) => {
        const occ = Array.isArray(it.occasion) && it.occasion.length
          ? it.occasion.slice(0, 3).join("|")
          : "—";
        const img = it.image_url || it.original_image_url || "";
        return `- [${it.id}] ${clampName(it.custom_name)} | ${it.category || "?"}/${escape(it.sub_category) || "—"} | ${escape(it.primary_color) || "—"} | occ=${occ}${img ? ` | img=${img}` : ""}`;
      });
      wardrobe24h = `${items.length} item${items.length === 1 ? "" : "s"}:\n${lines.join("\n")}`;
    }
  }
  wardrobe24h = trim(wardrobe24h, CAPS.wardrobe);

  // ── logged outfits (24h) ──────────────────────────────────────────────────
  let loggedOutfits24h = "(none today)";
  if (outfitsRes.status === "fulfilled" && Array.isArray(outfitsRes.value.data)) {
    const o = outfitsRes.value.data as any[];
    if (o.length > 0) {
      loggedOutfits24h = o
        .map(
          (x) =>
            `- [${x.id}] ${clampName(x.title, 30)} | ${escape(x.occasion) || "—"} | ${x.date || ""} | score=${x.score ?? "—"}`,
        )
        .join("\n");
    }
  }
  loggedOutfits24h = trim(loggedOutfits24h, CAPS.outfits);

  // ── planned events (today + next) ────────────────────────────────────────
  let plannedEvents24h = "(none planned)";
  if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value.data)) {
    const e = eventsRes.value.data as any[];
    if (e.length > 0) {
      plannedEvents24h = e
        .map(
          (x) =>
            `- [${x.id}] ${x.event_date}${x.event_time ? " " + x.event_time : ""} | ${clampName(x.occasion_label, 30)} | ${escape(x.location) || "—"} | ${x.status || "tentative"}`,
        )
        .join("\n");
    }
  }
  plannedEvents24h = trim(plannedEvents24h, CAPS.events);

  // ── streak activity in last 24h ───────────────────────────────────────────
  let streak24h = "0 activities in last 24h";
  if (streakRes.status === "fulfilled" && Array.isArray(streakRes.value.data)) {
    const acts = streakRes.value.data as any[];
    const byType: Record<string, number> = {};
    for (const a of acts) {
      const k = a.activity_type || "unknown";
      byType[k] = (byType[k] || 0) + 1;
    }
    if (Object.keys(byType).length) {
      streak24h = Object.entries(byType)
        .map(([k, v]) => `${v}× ${k}`)
        .join(", ");
    }
  }
  streak24h = trim(streak24h, CAPS.streak);

  // ── today (helps with date-aware questions) ───────────────────────────────
  const today = todayDate;

  // Final assembly: a single string the orchestrator can drop straight into
  // the system prompt. Sections are short on purpose.
  const totalChars =
    userProfile.length +
    wardrobe24h.length +
    loggedOutfits24h.length +
    plannedEvents24h.length +
    streak24h.length;

  return {
    today,
    userProfile: trim(userProfile, CAPS.profile),
    wardrobe24h,
    loggedOutfits24h,
    plannedEvents24h,
    streak24h,
    totalChars,
  };
}
