/**
 * useChatLocation — read the device's most recent GPS coordinates from
 * the existing `useWeatherStore` and shape them for the chat.
 *
 * Why this hook exists:
 *  - The home screen's weather widget already captures the device's
 *    location via `expo-location` and stores it in `useWeatherStore`.
 *  - The chat needs that same location on every send so the
 *    `show_weather` tool can render a real card for the user's actual
 *    area instead of asking for a city.
 *  - We deliberately do NOT call `expo-location` here — the store
 *    already does that on chat open (see `style-chat.tsx`). This hook
 *    is a pure read; it never blocks the UI on a permission prompt.
 *
 * Behavior:
 *  - `null` when the store has no data yet (e.g. permission pending,
 *    denied, or running on web). Callers should treat `null` as "no
 *    location available" and skip the location injection.
 *  - Lat/lon are rounded to 3 decimals (~110 m) before leaving the
 *    client — precise enough for a weather cell, coarse enough to
 *    avoid leaking GPS precision to the model.
 */
import { useMemo } from "react";
import { useWeatherStore } from "@/features/weather/model/weather-store";

export interface ChatLocation {
  /** Latitude in degrees, rounded to 3 decimals. */
  lat: number;
  /** Longitude in degrees, rounded to 3 decimals. */
  lon: number;
  /**
   * Reverse-geocoded locality label, e.g. "Andheri, IN". May be a
   * city-only string ("Mumbai") or a generic "Your area" if the
   * device's reverse geocode returned nothing.
   */
  locality: string | null;
}

export function useChatLocation(): ChatLocation | null {
  const data = useWeatherStore((s) => s.data);

  return useMemo<ChatLocation | null>(() => {
    if (!data) return null;
    const lat = data.latitude;
    const lon = data.longitude;
    if (
      typeof lat !== "number" ||
      typeof lon !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      return null;
    }
    // Reject the (0, 0) sentinel — it's the middle of the Atlantic
    // and not a useful user location.
    if (Math.abs(lat) < 0.01 && Math.abs(lon) < 0.01) {
      return null;
    }
    // Build a compact locality string. Prefer "City, State" when both
    // are present; fall back to whichever side has a value. Empty
    // strings become null so the server can fall back to "Your area".
    const city = data.city?.trim() ?? "";
    const state = data.state?.trim() ?? "";
    let locality: string | null = null;
    if (city && state) {
      locality = `${city}, ${state}`;
    } else if (city) {
      locality = city;
    } else if (state) {
      locality = state;
    }
    return {
      lat: Math.round(lat * 1000) / 1000,
      lon: Math.round(lon * 1000) / 1000,
      locality: locality && locality.length > 0 ? locality : null,
    };
  }, [data]);
}
