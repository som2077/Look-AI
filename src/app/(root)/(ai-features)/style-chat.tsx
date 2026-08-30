// Style Chat — generative-UI screen backed by the `style-chat` Supabase
// edge function. Rebuilt on top of AI Elements-style components
// (`src/components/ai-elements/`) for the visual language: assistant
// messages render full-width and transparent; user messages sit in a
// secondary-bg bubble on the right; tool outputs are wrapped in a
// collapsible `Tool` shell with a status badge; streaming shows a
// blinking caret at the end of the assistant text.

import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  IconCheck,
  IconCopy,
  IconRefresh,
} from '@tabler/icons-react-native';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { isReactElement, OpenAI, useChat } from 'react-native-gen-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import {
  Conversation,
  Loader,
  Message,
  MessageAction,
  MessageActions,
  MessageResponse,
  PromptInput,
  Tool,
  colors,
  font,
  space,
  useStreamingCaret,
} from '@/components/ai-elements';

import { CalendarDateCard } from '@/components/chat/cards/CalendarDateCard';
import { InlineDatePickerCard } from '@/components/chat/cards/InlineDatePickerCard';
import { LoggedOutfitConfirmCard } from '@/components/chat/cards/LoggedOutfitConfirmCard';
import { OutfitSuggestionCard } from '@/components/chat/cards/OutfitSuggestionCard';
import type {
  OutfitSuggestionOutfit,
} from '@/components/chat/cards/OutfitSuggestionCard';
import { CompareCard } from '@/components/chat/cards/CompareCard';
import { RecentOutfitsCard } from '@/components/chat/cards/RecentOutfitsCard';
import { StreakCard } from '@/components/chat/cards/StreakCard';
import { WeatherCard } from '@/components/chat/cards/WeatherCard';

import { CalendarSavingIndicator } from '@/components/chat/skeletons/CalendarSavingIndicator';
import { OutfitLoadingSkeleton } from '@/components/chat/skeletons/OutfitLoadingSkeleton';

import { makeStyleChatTransport } from '@/features/chat/model/chatTransport';
import { useStreakSync } from '@/features/streaks/api/useStreakSync';
import { useSupabase } from '@/shared/supabase/use-supabase';
import { trackAiUsage } from '@/shared/telemetry/ai-usage';
import { toLocalDateString } from '@/shared/utils/date';
import { useWeatherStore } from '@/features/weather';

// Tracks live keyboard height so we can push the input bar above it reliably.
function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
}

// Minimal client-side system prompt. The real prompt (with 24h user
// state) is injected server-side; this just keeps the Hinglish personality
// across all turns. `prepareMessages` drops system messages from the
// request window so it does not bloat the token count.
const CLIENT_SYSTEM_PROMPT = `You are StyleAI, the user's AI fashion assistant inside the Look AI app.

LANGUAGE: Hinglish (Roman script) by default. Do NOT switch to English just because the user wrote "Hi" or "thanks" — those are routine greetings, not language switches. Only switch to English if the user clearly writes two consecutive messages in pure English. Be brief, warm, and concrete. Use the supplied tools whenever the response includes structured data — never inline JSON. Avoid filler openers.`;

export default function StyleChatScreen() {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { syncStreak } = useStreakSync();

  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isLoaded || !isSignedIn) {
        if (!cancelled) setAuthToken(null);
        return;
      }
      try {
        const t = await getToken({ template: 'supabase' });
        if (!cancelled) setAuthToken(t ?? null);
      } catch {
        if (!cancelled) setAuthToken(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    try {
      void useWeatherStore.getState().fetchWeather();
    } catch {
      // ignore — weather is best-effort
    }
  }, [isLoaded, isSignedIn]);

  const openAi = useMemo(() => {
    const basePath = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/style-chat`;
    return makeStyleChatTransport({
      basePath,
      authToken: authToken ?? 'pending',
      prepare: { turns: 8, maxMessageChars: 1500, compactToolCalls: true },
    }) as unknown as OpenAI;
  }, [authToken]);

  // Save handler — inserts into logged_outfits and bumps the streak.
  const handleSaveOutfit = useCallback(
    async (outfit: OutfitSuggestionOutfit, occasion: string | undefined) => {
      if (!supabase || !user?.id) return;
      const userId = user.id;
      const today = toLocalDateString();
      const itemIds = (outfit.items ?? [])
        .map((i) => i.id)
        .filter((x): x is string => typeof x === 'string' && x.length > 0);
      const row = {
        user_id: userId,
        title: outfit.label,
        occasion: occasion ?? null,
        date: today,
        image_url: outfit.items?.[0]?.image_url ?? null,
        score: outfit.score ?? null,
        item_ids: itemIds.length > 0 ? itemIds : null,
      };
      const { error } = await supabase
        .from('logged_outfits')
        .insert(row);
      if (error) throw error;
      syncStreak('outfit_logged');
    },
    [supabase, user?.id, syncStreak]
  );

  const { input, onInputChange, messages, isStreaming, error, handleSubmit } =
    useChat({
      openAi,
      initialMessages: [{ role: 'system', content: CLIENT_SYSTEM_PROMPT }],
      onSuccess: () => {
        void trackAiUsage("style_chat", { model: "gpt-4o-mini" });
      },
      tools: {
        show_weather: {
          description:
            'Display the weather for a city as a UI card. Pass only the city (and an optional date for a forecast day). The client fills in the real temperature/condition from Open-Meteo; you only write the one-line ai_tip in Hinglish.',
          parameters: z.object({
            city: z.string().describe('City name, e.g. "Mumbai"'),
            date: z
              .string()
              .describe('Optional YYYY-MM-DD; omit for today')
              .optional(),
            ai_tip: z
              .string()
              .describe('One-line Hinglish styling tip based on the weather'),
          }),
          render: async function* (args: any) {
            yield (
              <Tool name="show_weather" status="running" defaultOpen>
                <WeatherCard
                  data={{
                    city: args.city,
                    temperature: 0,
                    condition: 'clear',
                    ai_tip: args.ai_tip,
                    loading: true,
                  }}
                />
              </Tool>
            );
            try {
              const base = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/style-chat`;
              const params = new URLSearchParams({
                action: 'weather',
                city: args.city,
              });
              if (args.date) params.set('date', args.date);
              const token =
                authToken && authToken !== 'pending' ? authToken : '';
              const res = await fetch(`${base}?${params.toString()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (!res.ok) throw new Error(`weather ${res.status}`);
              const snap = await res.json();
              if (supabase && user?.id && snap?.city && !args.date) {
                supabase
                  .from('user_profiles')
                  .update({ weather_city: snap.city })
                  .eq('user_id', user.id)
                  .then(({ error }) => {
                    if (error) {
                      console.warn(
                        '[show_weather] persist weather_city:',
                        error,
                      );
                    }
                  });
              }
              return {
                data: { ...args, ...snap, loading: false },
                component: (
                  <Tool name="show_weather" status="completed" defaultOpen input={args}>
                    <WeatherCard
                      data={{
                        city: snap.city ?? args.city,
                        temperature: snap.temperatureC ?? snap.temperature ?? 0,
                        condition: snap.condition ?? 'clear',
                        hourly: Array.isArray(snap.hourly) ? snap.hourly : [],
                        ai_tip: args.ai_tip,
                        loading: false,
                      }}
                    />
                  </Tool>
                ),
              };
            } catch (err) {
              console.warn('[show_weather] fetch failed:', err);
              return {
                data: { ...args, loading: false, error: true },
                component: (
                  <Tool name="show_weather" status="error" defaultOpen input={args}>
                    <WeatherCard
                      data={{
                        city: args.city,
                        temperature: 0,
                        condition: 'clear',
                        ai_tip:
                          args.ai_tip ||
                          'Weather abhi available nahi hai, but app suggest karta hu.',
                        loading: false,
                      }}
                    />
                  </Tool>
                ),
              };
            }
          },
        },
        suggest_outfit: {
          description:
            "Suggest up to 2 outfit combinations from the user's wardrobe.",
          parameters: z.object({
            occasion: z.string(),
            outfits: z
              .array(
                z.object({
                  label: z.string(),
                  items: z
                    .array(
                      z.object({
                        id: z.string(),
                      }),
                    )
                    .min(3),
                  style_note: z.string(),
                  why: z.string().optional(),
                  score: z.number().optional(),
                }),
              )
              .min(1)
              .max(2),
          }),
          render: async function* (args: any) {
            yield (
              <Tool name="suggest_outfit" status="running" defaultOpen>
                <OutfitLoadingSkeleton />
              </Tool>
            );
            try {
              const base = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/style-chat`;
              const token =
                authToken && authToken !== 'pending' ? authToken : '';
              const res = await fetch(`${base}?action=resolve-outfit`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  occasion: args.occasion,
                  outfits: args.outfits,
                }),
              });
              // Try to parse the body regardless of status — the server may
              // return a graceful empty-state payload on 4xx instead of
              // letting the client fall into a hard-error retry loop.
              let resolved: any = null;
              try {
                resolved = await res.json();
              } catch (parseErr) {
                console.warn(
                  '[suggest_outfit] resolve-outfit returned non-JSON:',
                  res.status,
                  parseErr,
                );
              }
              if (!res.ok && !resolved) {
                throw new Error(`resolve ${res.status}`);
              }
              const occasion = args.occasion;
              const data = resolved ?? {
                occasion: args.occasion,
                outfits: [],
                note: 'I had trouble loading your wardrobe. Please try again.',
              };
              return {
                data,
                component: (
                  <Tool
                    name="suggest_outfit"
                    status={res.ok ? 'completed' : 'error'}
                    defaultOpen
                    input={args}
                  >
                    <OutfitSuggestionCard
                      data={data}
                      onSave={(outfit) => handleSaveOutfit(outfit, occasion)}
                    />
                  </Tool>
                ),
              };
            } catch (err) {
              console.warn('[suggest_outfit] resolve failed:', err);
              return {
                data: {
                  occasion: args.occasion,
                  outfits: [],
                  note: 'I had trouble loading your wardrobe. Please try again.',
                },
                component: (
                  <Tool name="suggest_outfit" status="error" defaultOpen input={args}>
                    <OutfitSuggestionCard
                      data={{
                        occasion: args.occasion,
                        outfits: [],
                        note: 'I had trouble loading your wardrobe. Please try again.',
                      }}
                      onSave={undefined}
                    />
                  </Tool>
                ),
              };
            }
          },
        },
        show_date_picker: {
          description:
            'Show inline calendar date picker so user can select a date.',
          parameters: z.object({
            prompt_label: z.string(),
            occasion: z.string().optional(),
          }),
          render: (args) => ({
            data: args,
            component: (
              <Tool name="show_date_picker" status="running" defaultOpen input={args}>
                <InlineDatePickerCard
                  data={args}
                  onConfirm={(date, time) => {
                    handleSubmit(
                      `Maine ${date} at ${time} choose kiya. Occasion: ${
                        args.occasion || 'event'
                      }`
                    );
                  }}
                />
              </Tool>
            ),
          }),
        },
        show_calendar_date: {
          description: 'Show confirmed event date and save to calendar.',
          parameters: z.object({
            date: z.string(),
            time: z.string().optional(),
            title: z.string(),
            month_label: z.string(),
            day_number: z.number(),
            day_label: z.string(),
          }),
          render: async function* (args) {
            yield (
              <Tool name="show_calendar_date" status="running" defaultOpen input={args}>
                <CalendarSavingIndicator />
              </Tool>
            );
            await new Promise((r) => setTimeout(r, 1000));
            return {
              data: args,
              component: (
                <Tool name="show_calendar_date" status="completed" defaultOpen input={args}>
                  <CalendarDateCard data={args} />
                </Tool>
              ),
            };
          },
        },
        show_streak: {
          description:
            'Show the user their current streak, longest streak, and this-week active days.',
          parameters: z.object({
            current: z.number().describe('Current streak in days'),
            longest: z.number().describe('Longest streak ever achieved'),
            this_week: z.number().optional(),
            motivation: z.string().optional(),
          }),
          render: (args) => ({
            data: args,
            component: (
              <Tool name="show_streak" status="completed" defaultOpen input={args}>
                <StreakCard data={args} />
              </Tool>
            ),
          }),
        },
        show_recent_outfits: {
          description:
            "Display a horizontal scroller of the user's recently logged outfits (last 24h).",
          parameters: z.object({
            title: z.string().optional(),
            outfits: z.array(
              z.object({
                id: z.string(),
                title: z.string().optional(),
                occasion: z.string().optional(),
                image_url: z.string().optional(),
                score: z.number().optional(),
                logged_at: z.string().optional(),
              })
            ),
            note: z.string().optional(),
          }),
          render: (args) => ({
            data: args,
            component: (
              <Tool name="show_recent_outfits" status="completed" defaultOpen input={args}>
                <RecentOutfitsCard data={args} />
              </Tool>
            ),
          }),
        },
        compare_outfits: {
          description:
            'Compare two outfit options side-by-side and give a verdict. Use when the user is choosing between looks.',
          parameters: z.object({
            left: z.object({
              title: z.string(),
              occasion: z.string().optional(),
              image_url: z.string().optional(),
              score: z.number().optional(),
              why: z.string().optional(),
            }),
            right: z.object({
              title: z.string(),
              occasion: z.string().optional(),
              image_url: z.string().optional(),
              score: z.number().optional(),
              why: z.string().optional(),
            }),
            verdict: z.string().optional(),
            winner: z.enum(['left', 'right']).optional(),
          }),
          render: (args) => ({
            data: args,
            component: (
              <Tool name="compare_outfits" status="completed" defaultOpen input={args}>
                <CompareCard data={args} />
              </Tool>
            ),
          }),
        },
        quick_log_outfit: {
          description:
            'Persist an outfit the user just described (or the AI just suggested) into logged_outfits and confirm.',
          parameters: z.object({
            title: z.string(),
            occasion: z.string().optional(),
            items: z
              .array(
                z.object({
                  name: z.string(),
                  category: z.string().optional(),
                  image_url: z.string().optional(),
                })
              )
              .optional(),
            note: z.string().optional(),
          }),
          render: async function* (args: any) {
            yield (
              <Tool name="quick_log_outfit" status="running" defaultOpen input={args}>
                <OutfitLoadingSkeleton />
              </Tool>
            );
            let insertedId: string | undefined;
            try {
              if (supabase && user?.id) {
                const { data: inserted, error } = await supabase
                  .from('logged_outfits')
                  .insert({
                    user_id: user.id,
                    title: args.title,
                    occasion: args.occasion ?? null,
                    date: toLocalDateString(),
                    image_url: null,
                    score: null,
                  })
                  .select('id')
                  .single();
                if (!error && inserted?.id) {
                  insertedId = inserted.id;
                  syncStreak('outfit_logged');
                } else if (error) {
                  console.warn('[quick_log_outfit] insert error:', error);
                }
              }
            } catch (err) {
              console.warn('[quick_log_outfit] threw:', err);
            }
            return {
              data: { ...args, id: insertedId, saved_at: new Date().toISOString() },
              component: (
                <Tool name="quick_log_outfit" status="completed" defaultOpen input={args}>
                  <LoggedOutfitConfirmCard
                    data={{ ...args, id: insertedId, saved_at: new Date().toISOString() }}
                  />
                </Tool>
              ),
            };
          },
        },
        save_outfit_to_calendar: {
          description:
            'Persist the chosen outfit + date + time as a planned event.',
          parameters: z.object({
            date: z.string().describe('Event date in YYYY-MM-DD'),
            time: z.string().optional().describe('Event time in HH:MM (24h)'),
            title: z.string().describe('Short event title, e.g. "Date night"'),
            occasion: z.string().optional(),
            outfit_label: z.string().describe('Name of the outfit being saved'),
            outfit_id: z.string().optional(),
            note: z.string().optional(),
          }),
          render: async function* (args: any) {
            yield (
              <Tool name="save_outfit_to_calendar" status="running" defaultOpen input={args}>
                <CalendarSavingIndicator />
              </Tool>
            );
            let insertedId: string | undefined;
            try {
              if (supabase && user?.id) {
                const { data: inserted, error } = await supabase
                  .from('planned_events')
                  .insert({
                    user_id: user.id,
                    event_date: args.date,
                    event_time: args.time ?? null,
                    occasion_label: args.occasion ?? args.title,
                    location: null,
                    weather_snapshot: null,
                    suggested_outfit_id: args.outfit_id ?? null,
                    status: 'confirmed',
                    outfit_label: args.outfit_label,
                    note: args.note ?? null,
                  })
                  .select('id')
                  .single();
                if (!error && inserted?.id) {
                  insertedId = inserted.id;
                } else if (error) {
                  console.warn('[save_outfit_to_calendar] insert error:', error);
                }
              }
            } catch (err) {
              console.warn('[save_outfit_to_calendar] threw:', err);
            }
            const [y, m, d] = args.date.split('-').map((n: string) => parseInt(n, 10));
            const local = new Date(y, (m || 1) - 1, d || 1);
            const month_label = local.toLocaleString('en-US', { month: 'long' });
            const day_number = d;
            const day_label = local.toLocaleString('en-US', { weekday: 'short' });
            return {
              data: {
                ...args,
                id: insertedId,
                month_label,
                day_number,
                day_label,
              },
              component: (
                <Tool name="save_outfit_to_calendar" status="completed" defaultOpen input={args}>
                  <CalendarDateCard
                    data={{
                      date: args.date,
                      time: args.time,
                      title: args.title,
                      month_label,
                      day_number,
                      day_label,
                    }}
                  />
                </Tool>
              ),
            };
          },
        },
      },
    });

  // Determine which message is the last assistant one (for streaming cursor).
  const { isLastAssistantStreaming } = useStreamingCaret(messages, isStreaming);

  // Helper: extract plain text from an assistant message for the Copy action.
  const getAssistantText = useCallback((content: unknown): string => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((c: any) => (typeof c === 'string' ? c : c?.text ?? ''))
        .filter(Boolean)
        .join('\n');
    }
    return '';
  }, []);

  // Render a single message. Three branches: tool output (ReactElement),
  // assistant text, user text. Each is wrapped in <Message from=...>.
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    // Tool output (already wrapped in a <Tool> shell by the renderer).
    if (isReactElement(item)) {
      return <View key={index}>{item}</View>;
    }

    const text = (item.content ?? '').toString();
    if (item.role === 'user') {
      return (
        <Message key={index} from="user">
          <Text style={userTextStyle}>{text}</Text>
        </Message>
      );
    }
    if (item.role === 'assistant' && (text || isLastAssistantStreaming)) {
      return (
        <Message key={index} from="assistant">
          <MessageResponse content={text} isStreaming={isLastAssistantStreaming} />
          {!isStreaming || index !== messages.length - 1 ? (
            <MessageActions>
              <MessageAction
                label="Copy"
                onPress={async () => {
                  try {
                    await Clipboard.setStringAsync(text);
                  } catch {
                    // best-effort
                  }
                }}
              >
                <IconCopy size={14} color={colors.text} strokeWidth={2} />
              </MessageAction>
              <RetryAction lastUserText={lastUserText} onRetry={retryLastMessage} />
            </MessageActions>
          ) : null}
        </Message>
      );
    }
    return null;
  };

  const visibleMessages = messages.filter(
    (m) => isReactElement(m) || m.role !== 'system',
  );

  const lastUserText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m: any = messages[i];
      if (m?.role === 'user' && typeof m.content === 'string' && m.content.trim()) {
        return m.content;
      }
    }
    return null;
  }, [messages]);
  const canRetryLastMessage = !!lastUserText;
  const retryLastMessage = useCallback(() => {
    if (!lastUserText) return;
    handleSubmit(`${lastUserText} (use ONE tool only, pick the most useful one)`);
  }, [lastUserText, handleSubmit]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
        <Conversation
          data={visibleMessages}
          renderItem={renderItem}
          keyExtractor={(_item, index) => index.toString()}
          ListFooterComponent={
            isStreaming ? (
              <Loader caption="StyleAI is thinking…" />
            ) : error ? (
              <InlineChatError
                message={error.message}
                canRetry={canRetryLastMessage}
                onRetry={retryLastMessage}
              />
            ) : null
          }
        />

        <View
          style={[
            styles.inputOuterContainer,
            { paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          <PromptInput
            value={input}
            onChange={onInputChange}
            onSubmit={() => handleSubmit(input)}
            isStreaming={isStreaming}
            placeholder="Ask StyleAI..."
          />
        </View>
      </View>
    </View>
  );
}

// Sub-component for the Retry action — small icon button. Sits outside
// the main render so it can be memoized per-render only when needed.
function RetryAction({
  lastUserText,
  onRetry,
}: {
  lastUserText: string | null;
  onRetry: () => void;
}) {
  if (!lastUserText) return null;
  return (
    <MessageAction label="Retry" onPress={onRetry}>
      <IconRefresh size={14} color={colors.text} strokeWidth={2} />
    </MessageAction>
  );
}

const userTextStyle = {
  color: colors.textInverse,
  fontSize: font.body,
  lineHeight: 22,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inputOuterContainer: {
    backgroundColor: colors.bg,
    // Horizontal padding is set on the PromptInput.outer itself, but
    // we mirror it here so the floating card stays inset from the
    // screen edges even if the inner component is swapped later.
    paddingHorizontal: 0,
    // Soft top border matches the chat list divider so the bar reads
    // as a separate surface (not a continuation of the message list).
  },
});

/**
 * Soft inline error indicator for transient chat errors (e.g. the model
 * hallucinated a tool name). The chat stays usable — the user can just
 * type another message and the error goes away when a new request starts.
 */
function InlineChatError({
  message,
  canRetry,
  onRetry,
}: {
  message: string;
  canRetry?: boolean;
  onRetry?: () => void;
}) {
  const isUnknownTool = /unknown tool|tool_call/i.test(message);
  const display = isUnknownTool
    ? "The AI tried to use two tools at once and the runtime rejected it. Tap retry to send your message again with a one-tool nudge."
    : "Something hiccuped. Try sending your message again.";
  return (
    <View style={errorStyles.wrap}>
      <View style={errorStyles.row}>
        <Text style={errorStyles.text}>⚠️ {display}</Text>
        {isUnknownTool && canRetry && onRetry ? (
          <TouchableOpacity
            onPress={onRetry}
            style={errorStyles.retryBtn}
            activeOpacity={0.85}
          >
            <Text style={errorStyles.retryText}>
              <Text style={{ fontSize: 12 }}>  </Text>
              <Text>Retry</Text>
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  retryBtn: {
    backgroundColor: '#92400E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
