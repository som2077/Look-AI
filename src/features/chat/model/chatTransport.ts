// A drop-in replacement for react-native-gen-ui's `OpenAI` client that
// applies `prepareMessages` before every request, so input tokens stay
// under control across long sessions.
//
// Why this exists:
//   The library's `OpenAI.createChatCompletion` ships the entire message
//   array unchanged. For a chat that may have 50+ prior turns (each with
//   tool calls), the input token cost grows unbounded.
//
// What it does:
//   - Wraps the real `OpenAI` instance.
//   - Before delegating, runs `prepareMessages` on `params.messages` to
//     drop system messages, keep the last N turns, and compact tool-call
//     history.
//   - Same public surface as `OpenAI`, so `useChat({ openAi })` accepts it
//     via a single type assertion at the call site.
//
// Auth note:
//   The library uses `react-native-sse` (XMLHttpRequest-based) to POST.
//   It sets the `Authorization` header from the `apiKey` constructor arg
//   ONCE at EventSource construction. There is no per-request hook. So we
//   must pass the Clerk session JWT directly as the `apiKey`. A fetch
//   monkey-patch will NOT work — the request never goes through fetch.

import { OpenAI } from "react-native-gen-ui/lib/openai/openai";
import type {
  ChatCompletion,
  ChatCompletionCallbacks,
  ChatCompletionCreateParams,
} from "react-native-gen-ui/lib/openai/chat-completion";

import { prepareMessages, type PrepareOptions } from "./messageWindow";

export interface PreparedOpenAIOptions {
  /** Pass-through options for `prepareMessages`. */
  prepare?: PrepareOptions;
}

/**
 * `OpenAI` look-alike. The `OpenAI` type has private fields, so we cannot
 * extend it cleanly in TypeScript; instead we expose the same public method
 * and let the call site assert `as unknown as OpenAI` once.
 *
 * `authToken` is the Clerk session JWT (without the "Bearer " prefix). It
 * is baked into the OpenAI instance at construction time. If the token
 * rotates, the caller should construct a new `PreparedOpenAI`.
 *
 * `userLocation` (optional) is the device's most recent GPS coordinates,
 * read from `useWeatherStore` by the caller. When provided, it's attached
 * to every chat-completion body as `userLocation: { lat, lon, locality }`.
 * The style-chat edge function reads this and injects it into the system
 * prompt as `<user_location>...</user_location>`. OpenAI itself ignores
 * the extra field; the wiring is purely for our edge function.
 */
export class PreparedOpenAI {
  private inner: OpenAI;
  private prepare: PrepareOptions;
  private userLocation: UserLocationPayload | null;

  constructor(opts: {
    apiKey: string;
    model: string;
    basePath?: string;
    prepare?: PrepareOptions;
    userLocation?: UserLocationPayload | null;
  }) {
    // The library sets `Authorization: Bearer ${this.api.apiKey}` on every
    // EventSource. We pass the Clerk JWT as `apiKey` so the header is
    // `Authorization: Bearer <jwt>` automatically. No monkey-patching
    // required.
    this.inner = new OpenAI({
      apiKey: opts.apiKey,
      model: opts.model,
      basePath: opts.basePath,
    });
    this.prepare = opts.prepare ?? {};
    this.userLocation = opts.userLocation ?? null;
  }

  /**
   * Update the location attached to subsequent requests. Call this whenever
   * the user grants location permission or moves to a new place (we re-read
   * from `useWeatherStore` so this rarely needs to be called directly).
   * Passing `null` clears the override.
   */
  setUserLocation(loc: UserLocationPayload | null): void {
    this.userLocation = loc;
  }

  /**
   * Mirror of `OpenAI.createChatCompletion`. Runs `prepareMessages` on the
   * params first, then delegates to the real client. Attaches the
   * `userLocation` payload to the params before delegating, so it lands
   * in the body sent to the edge function.
   */
  async createChatCompletion(
    params: Omit<ChatCompletionCreateParams, "model" | "temperature" | "stream">,
    callbacks: ChatCompletionCallbacks,
  ): Promise<ChatCompletion> {
    const messages = Array.isArray((params as any).messages)
      ? (params as any).messages
      : [];
    const prepared = prepareMessages(messages, this.prepare);
    const nextParams = {
      ...params,
      messages: prepared,
      // The edge function reads this and injects it into the system
      // prompt. Extra fields are forwarded by `serializeParams` in
      // `react-native-gen-ui/lib/openai/chat-completion.js`.
      ...(this.userLocation ? { userLocation: this.userLocation } : {}),
    } as typeof params;
    return this.inner.createChatCompletion(nextParams, callbacks);
  }
}

/**
 * Shape of the location payload sent on every chat request. Kept narrow
 * on purpose: the edge function only needs lat/lon + a display label.
 */
export interface UserLocationPayload {
  lat: number;
  lon: number;
  locality: string | null;
}

/**
 * Build a `PreparedOpenAI` pointing at the style-chat edge function.
 *
 * The edge function forces `gpt-4o-mini` server-side, so the `model` we
 * pass here is informational only.
 *
 * `authToken` should be the user's Clerk "supabase" template JWT (no
 * "Bearer " prefix). Passing a falsy value (e.g. while the session is
 * still loading) is allowed — the instance is still constructed, and the
 * caller is expected not to call `handleSubmit` until the real token
 * arrives and a new instance is built.
 *
 * `userLocation` is the device's most recent GPS coordinates (from
 * `useChatLocation`). When provided, every chat-completion body sent by
 * this transport will include `userLocation: { lat, lon, locality }`,
 * which the edge function injects into the system prompt.
 */
export function makeStyleChatTransport(opts: {
  basePath: string;
  /** The user's Clerk "supabase" template JWT (no "Bearer " prefix). */
  authToken: string;
  prepare?: PrepareOptions;
  userLocation?: UserLocationPayload | null;
}): PreparedOpenAI {
  return new PreparedOpenAI({
    apiKey: opts.authToken,
    model: "gpt-4o-mini",
    basePath: opts.basePath,
    prepare: opts.prepare,
    userLocation: opts.userLocation ?? null,
  });
}
