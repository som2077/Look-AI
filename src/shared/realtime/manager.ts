import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton realtime manager.
 *
 * Ensures exactly ONE postgres_changes channel per (table, userId) across the
 * whole app, no matter how many screens mount a subscription. Previously each
 * screen (e.g. explore + notifications) created its own channel on the same
 * table — N screens = N channels = N× realtime WAL polling for the same data.
 *
 * Handlers are multiplexed over the single channel; the channel is removed when
 * the last handler unsubscribes.
 */

interface Payload<T = any> {
  eventType: string;
  new: T;
  old: T;
}

type Handler<T = any> = (payload: Payload<T>) => void;

interface ChannelEntry {
  channel: RealtimeChannel;
  handlers: Set<Handler>;
}

const channels = new Map<string, ChannelEntry>();

function keyOf(table: string, userId: string) {
  return `${userId}::${table}`;
}

export function subscribeToTable(
  supabase: SupabaseClient,
  opts: {
    table: string;
    userId: string;
    /** PostgREST filter string, e.g. `user_id=eq.${userId}`. */
    filter?: string;
    handler: Handler;
  },
): () => void {
  const key = keyOf(opts.table, opts.userId);
  let entry = channels.get(key);

  if (!entry) {
    const channel = supabase
      .channel(`realtime:${key}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: opts.table,
          filter: opts.filter,
        },
        (payload) => {
          const current = channels.get(key);
          if (!current) return;
          for (const handler of current.handlers) {
            try {
              handler(payload);
            } catch (err) {
              console.error("[realtime-manager] handler error", err);
            }
          }
        },
      )
      .subscribe();

    entry = { channel, handlers: new Set() };
    channels.set(key, entry);
  }

  entry.handlers.add(opts.handler);

  return () => {
    const current = channels.get(key);
    if (!current) return;
    current.handlers.delete(opts.handler);
    if (current.handlers.size === 0) {
      try {
        supabase.removeChannel(current.channel);
      } catch {}
      channels.delete(key);
    }
  };
}

/** Drop every channel (e.g. on sign-out). */
export function clearRealtimeSubscriptions(supabase?: SupabaseClient) {
  for (const { channel } of channels.values()) {
    try {
      if (supabase) {
        supabase.removeChannel(channel);
      } else {
        channel.unsubscribe();
      }
    } catch {}
  }
  channels.clear();
}
