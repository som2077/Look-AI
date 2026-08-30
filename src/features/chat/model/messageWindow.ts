// Token-frugal message preparation for chat requests.
//
// Why this exists:
//   - The OpenAI request carries *every* prior message. Long sessions blow
//     up the input token count.
//   - The 24h user-state context (server-side) is already capped at 1,200
//     tokens. The message window is the second half of the input budget.
//
// What it does:
//   1. Drops the system message (the server re-injects the real one).
//   2. Keeps only the last N turns (default 8 user/assistant pairs).
//   3. Truncates very long user messages.
//   4. Compacts tool-call history: once a tool has rendered, the verbose
//      `tool_call_id` / `function.name` / `function.arguments` block is
//      replaced with a one-line summary the model can still understand.
//
// The export is `prepareMessages(messages, opts?)` — used by chatTransport.

import type { ChatCompletionMessageParam } from "openai/resources";

export interface PrepareOptions {
  /** Number of recent user/assistant pairs to keep. Default 8. */
  turns?: number;
  /** Hard cap on the content length of any single message, in chars. */
  maxMessageChars?: number;
  /** Drop the system message from the window (server re-injects it). */
  dropSystem?: boolean;
  /** Compact tool-call history once the tool has rendered. */
  compactToolCalls?: boolean;
}

const DEFAULTS: Required<PrepareOptions> = {
  turns: 8,
  maxMessageChars: 1500,
  dropSystem: true,
  compactToolCalls: true,
};

/**
 * Normalise a single message content to a string. The model only sees
 * strings; if the caller sent multi-part content, we keep the text parts.
 */
function contentToString(c: unknown): string {
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c
      .map((p: any) => {
        if (typeof p === "string") return p;
        if (p?.type === "text" && typeof p.text === "string") return p.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function clamp(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}

/**
 * Compact a single assistant message that contains a tool_calls block.
 *
 * IMPORTANT: We must NOT drop the `tool_calls` field on its own. OpenAI
 * rejects any subsequent `role: "tool"` message whose `tool_call_id`
 * doesn't match a `tool_calls` entry on a preceding assistant message.
 * The actual compaction (inlining the tool results) happens in
 * `foldToolExchange` — this function only clamps the assistant's own
 * text content.
 */
function compactAssistantToolCall(msg: any): any {
  if (!DEFAULTS.compactToolCalls) return msg;
  const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : null;
  if (!toolCalls || toolCalls.length === 0) return msg;

  // Keep the tool_calls field intact (OpenAI needs it) but trim the
  // assistant's text content if it was long.
  return {
    ...msg,
    content: clamp(contentToString(msg.content), DEFAULTS.maxMessageChars),
  };
}

/**
 * Compact a single tool result message. The library sends these as
 * `{ role: "tool", tool_call_id, content }`. We keep both fields so
 * the OpenAI validation passes.
 */
function compactToolResult(msg: any): any {
  return {
    ...msg,
    content: clamp(contentToString(msg.content), DEFAULTS.maxMessageChars),
  };
}

/**
 * Fold a `assistant(tool_calls) + tool(result)*` exchange into a single
 * assistant message. This is the only safe way to shorten a tool exchange
 * without leaving orphaned `role: "tool"` messages — which OpenAI rejects.
 *
 * The folded message keeps the tool names + a short preview of the
 * arguments and the result content, all as plain assistant text. The
 * model can still reference the result in subsequent turns.
 */
function foldToolExchange(assistant: any, toolResults: any[]): any {
  if (!assistant || assistant.role !== "assistant") return assistant;
  const toolCalls: any[] = Array.isArray(assistant.tool_calls)
    ? assistant.tool_calls
    : [];

  const parts: string[] = [];
  const assistantText = contentToString(assistant.content);
  if (assistantText) parts.push(assistantText);

  for (const tc of toolCalls) {
    const name = tc?.function?.name ?? tc?.name ?? "tool";
    const rawArgs = tc?.function?.arguments ?? tc?.arguments ?? "";
    let argPreview = rawArgs;
    try {
      const parsed = JSON.parse(rawArgs);
      argPreview = Object.keys(parsed).slice(0, 6).join(",");
    } catch {
      // leave preview as-is
    }
    const result = toolResults.find(
      (tr: any) => tr?.tool_call_id === tc.id,
    );
    const resultText = result ? contentToString(result.content) : "";
    const line = resultText
      ? `[called ${name}(${argPreview.slice(0, 40)}) → ${resultText.slice(0, 200)}]`
      : `[called ${name}(${argPreview.slice(0, 60)})]`;
    parts.push(line);
  }

  // Return a plain assistant message with no tool_calls. The model's
  // history now reads naturally and no further validation is needed.
  return {
    role: "assistant",
    content: clamp(parts.join("\n"), DEFAULTS.maxMessageChars),
  };
}

/**
 * Reduce a full message array to a token-friendly window.
 *
 * Rules (in order):
 *   - Drop the system message if `dropSystem` is true.
 *   - Keep the last `turns * 2 + 1` messages (each "turn" = 1 user + 1 assistant).
 *   - Clamp every message's content to `maxMessageChars`.
 *   - Compact assistant tool_call blocks and tool result messages.
 */
export function prepareMessages(
  messages: ChatCompletionMessageParam[] | any[],
  opts: PrepareOptions = {},
): ChatCompletionMessageParam[] {
  const o = { ...DEFAULTS, ...opts };

  // 1) drop system
  let arr = o.dropSystem
    ? messages.filter((m: any) => m?.role !== "system")
    : messages.slice();

  // 2) sliding window: keep the last (turns * 2) messages.
  const keep = o.turns * 2;
  if (arr.length > keep) {
    arr = arr.slice(arr.length - keep);
  }

  // 3) Fold any `assistant(tool_calls) + tool(result)*` exchanges into a
  //    single assistant message. This is the only safe way to shorten
  //    tool traffic — OpenAI rejects `role: "tool"` messages that don't
  //    have a preceding assistant `tool_calls` to reference, and a
  //    dropped tool_call_id leaves the message orphaned.
  //
  //    We only fold when `compactToolCalls` is on, and only fold the
  //    trailing tool messages of a contiguous exchange so the structure
  //    stays valid for any *un-folded* exchanges that follow.
  if (o.compactToolCalls) {
    const folded: any[] = [];
    let i = 0;
    while (i < arr.length) {
      const cur = arr[i];
      if (
        cur &&
        cur.role === "assistant" &&
        Array.isArray(cur.tool_calls) &&
        cur.tool_calls.length > 0
      ) {
        // Collect any immediately-following tool messages.
        const toolResults: any[] = [];
        let j = i + 1;
        while (j < arr.length && arr[j]?.role === "tool") {
          toolResults.push(arr[j]);
          j++;
        }
        folded.push(foldToolExchange(cur, toolResults));
        i = j;
      } else {
        folded.push(cur);
        i++;
      }
    }
    arr = folded;
  }

  // 4) final clamp + tool-result pass.
  arr = arr.map((m: any) => {
    if (!m || typeof m !== "object") return m;
    if (m.role === "assistant" && Array.isArray(m.tool_calls)) {
      return compactAssistantToolCall(m);
    }
    if (m.role === "tool" || m.role === "function") {
      return compactToolResult(m);
    }
    // user / assistant / system — clamp the content.
    if (typeof m.content === "string") {
      return { ...m, content: clamp(m.content, o.maxMessageChars) };
    }
    if (Array.isArray(m.content)) {
      return {
        ...m,
        content: m.content.map((p: any) => {
          if (p && typeof p === "object" && p.type === "text") {
            return { ...p, text: clamp(String(p.text ?? ""), o.maxMessageChars) };
          }
          return p;
        }),
      };
    }
    return m;
  });

  return arr as ChatCompletionMessageParam[];
}

/**
 * Estimate the input token count for a request.
 *
 * This is a *rough* estimate (rule of thumb: 1 token ≈ 4 chars of English,
 * or ≈ 1.3 chars of code/JSON). It is good enough to decide whether to
 * shrink the window further. We don't use the actual tokenizer to keep
 * the bundle small.
 */
export function estimateInputTokens(
  systemPrompt: string,
  messages: ChatCompletionMessageParam[] | any[],
  toolsJson: unknown = null,
): number {
  let chars = systemPrompt.length;
  for (const m of messages as any[]) {
    chars += contentToString(m?.content).length;
    if (Array.isArray(m?.tool_calls)) {
      chars += JSON.stringify(m.tool_calls).length;
    }
  }
  if (toolsJson) {
    chars += JSON.stringify(toolsJson).length;
  }
  // 1 token ≈ 4 chars (English). Use 3.5 to be slightly conservative
  // for code/JSON content.
  return Math.ceil(chars / 3.5);
}
