// Formats a 24h user-state snapshot into a system-prompt section.
//
// This is the "data context" half of the plan's section A:
//   - Calls wardrobe.ts to fetch the 24h snapshot.
//   - Wraps the result in a stable, machine-friendly markdown block.
//   - Hard-caps the section at ~1200 tokens (≈ 4500 chars).
//   - Returns `{ block, charCount, hasData }` so the caller can decide what
//     to do when the user has no recent data (e.g. relax the cap, or pass an
//     "empty state" hint to the model).

import { getRecent24hContext, type Recent24hContext } from "./wardrobe.ts";

// ~1200 tokens == ~4500 chars (English). We leave a 10% headroom so a
// slightly-larger-than-expected wardrobe slice still fits.
const HARD_CHAR_CAP = 4000;

export interface ContextBlock {
  block: string;
  charCount: number;
  hasData: boolean;
}

/**
 * Build the 24h context block. `messages` is included so we can optionally
 * trim more aggressively when the conversation is already long (a future
 * enhancement; today we use the static cap).
 */
export async function buildContextBlock(
  token: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
  _messages: unknown[] = [],
): Promise<ContextBlock> {
  let ctx: Recent24hContext;
  try {
    ctx = await getRecent24hContext(token, supabaseUrl, supabaseAnonKey);
  } catch (err) {
    // If the DB is unavailable, the AI should still work — just with no
    // user-specific context. Returning an empty block is safer than 500ing.
    console.warn("[style-chat] recent-context fetch failed:", err);
    return { block: "", charCount: 0, hasData: false };
  }

  const hasData =
    ctx.wardrobe24h !== "(no recent items)" ||
    ctx.loggedOutfits24h !== "(none today)" ||
    ctx.plannedEvents24h !== "(none planned)" ||
    ctx.streak24h !== "0 activities in last 24h";

  const block = `## Recent User State (last 24 hours, server-filtered)

Today: ${ctx.today}
User: ${ctx.userProfile}

### Wardrobe (recent or recently worn)
${ctx.wardrobe24h}

### Logged outfits (last 24h)
${ctx.loggedOutfits24h}

### Planned events
${ctx.plannedEvents24h}

### Streak activity (last 24h)
${ctx.streak24h}

When the user asks "what should I wear?" use the wardrobe above.
When the user asks "what did I wear today?" use logged outfits above.
When the user asks about upcoming plans, use planned events above.
Do NOT reference wardrobe items that are not listed above.`;

  // Hard-cap. If the wardrobe slice blew the budget we trim from the end so
  // we keep the most useful bits (today's date + profile + streak + outfits
  // are short and high-signal; wardrobe is the bulk and gets cut).
  const finalBlock = block.length > HARD_CHAR_CAP
    ? block.slice(0, HARD_CHAR_CAP) + "\n…(truncated)"
    : block;

  return { block: finalBlock, charCount: finalBlock.length, hasData };
}
