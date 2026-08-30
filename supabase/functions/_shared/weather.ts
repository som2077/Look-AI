// Real weather lookup, no API key required.
//
// Uses Open-Meteo's free geocoding + forecast endpoints. Open-Meteo is the
// natural choice for this app because:
//   - No API key, no auth headers — fits a serverless edge function.
//   - Reasonable free tier (10k req/day) — enough for chat traffic.
//   - Returns WMO weather codes we can map to a small fixed set that matches
//     the in-app "condition" enum the AI already speaks.
//
// Failures are non-fatal: the caller should treat a missing forecast as
// "weather unknown" rather than 500'ing the chat. The function therefore
// returns `null` on any error and lets the caller decide what to do.

export type Condition =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "humid"
  | "cold"
  | "windy"
  | "hazy"
  | "clear";

export interface WeatherSnapshot {
  city: string;
  temperatureC: number;
  condition: Condition;
  humidity: number;
  windKmh: number;
  rainPct: number;
  forecastDate: string; // YYYY-MM-DD
  source: "open-meteo";
  /** Next 6 hours of forecast, starting at the current local hour. */
  hourly: HourlyEntry[];
}

export interface HourlyEntry {
  /** Local hour formatted like "4 PM" (en-US, 12-hour). */
  hour: string;
  temperatureC: number;
  condition: Condition;
  precipitationPct: number;
}

// WMO weather codes → our Condition enum.
// Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
const WMO: Record<number, Condition> = {
  0: "clear",
  1: "sunny",
  2: "cloudy",
  3: "cloudy",
  45: "hazy",
  48: "hazy",
  51: "rainy",
  53: "rainy",
  55: "rainy",
  61: "rainy",
  63: "rainy",
  65: "rainy",
  71: "cold",
  73: "cold",
  75: "cold",
  77: "cold",
  80: "rainy",
  81: "rainy",
  82: "rainy",
  85: "cold",
  86: "cold",
  95: "rainy",
  96: "rainy",
  99: "rainy",
};

function mapCondition(code: number, tempC: number, humidity: number, wind: number): Condition {
  const base = WMO[code] ?? "clear";
  // Re-classify based on temperature/wind even if the WMO code is generic.
  if (tempC <= 5) return "cold";
  if (humidity >= 85 && base === "clear") return "humid";
  if (wind >= 30 && (base === "clear" || base === "sunny")) return "windy";
  return base;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
}

async function geocode(city: string): Promise<GeocodeResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json: any = await res.json().catch(() => null);
  const hit = json?.results?.[0];
  if (!hit) return null;
  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    name: hit.name as string,
    country: hit.country as string | undefined,
  };
}

/**
 * Hit Open-Meteo's forecast endpoint and shape the response into our
 * `WeatherSnapshot`. Returns `null` on any failure.
 *
 * Shared by both `fetchWeather(city)` (which geocodes first) and the new
 * `fetchWeatherAt(lat, lon)` (which already has coordinates from the
 * device). Splitting this out keeps the public surface focused and
 * prevents two divergent copies of the WMO mapping from drifting.
 */
async function fetchWeatherRaw(
  latitude: number,
  longitude: number,
  label: string,
  forecastDate?: string,
): Promise<WeatherSnapshot | null> {
  try {
    const date = forecastDate ?? new Date().toISOString().slice(0, 10);
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&daily=temperature_2m_max,precipitation_probability_max,weathercode` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
      `&hourly=temperature_2m,weathercode,precipitation_probability` +
      `&timezone=auto&forecast_days=2`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: any = await res.json().catch(() => null);
    if (!json?.current || !json?.daily || !json?.hourly) return null;

    const tempC = Math.round(Number(json.current.temperature_2m ?? 0));
    const humidity = Math.round(Number(json.current.relative_humidity_2m ?? 0));
    const wind = Math.round(Number(json.current.wind_speed_10m ?? 0));
    const code = Number(json.daily.weathercode?.[0] ?? 0);
    const rainPct = Math.round(Number(json.daily.precipitation_probability_max?.[0] ?? 0));
    const condition = mapCondition(code, tempC, humidity, wind);

    // Build the next-6-hours forecast. Open-Meteo returns one entry per
    // local hour. We start at the current hour and take 6. The format
    // matches what the chat card expects.
    const hourly: HourlyEntry[] = [];
    const hTimes: string[] = Array.isArray(json.hourly.time)
      ? json.hourly.time
      : [];
    const hTemps: number[] = Array.isArray(json.hourly.temperature_2m)
      ? json.hourly.temperature_2m
      : [];
    const hCodes: number[] = Array.isArray(json.hourly.weathercode)
      ? json.hourly.weathercode
      : [];
    const hPrecip: number[] = Array.isArray(
      json.hourly.precipitation_probability,
    )
      ? json.hourly.precipitation_probability
      : [];
    if (hTimes.length > 0) {
      // Open-Meteo's "current" hour is `new Date().toISOString()` truncated
      // to the hour in local TZ. We find the closest index >= now.
      const nowMs = Date.now();
      let startIdx = 0;
      for (let i = 0; i < hTimes.length; i++) {
        const t = new Date(hTimes[i]);
        if (t.getTime() >= nowMs - 30 * 60 * 1000) {
          startIdx = i;
          break;
        }
        startIdx = i;
      }
      for (let i = startIdx; i < Math.min(startIdx + 6, hTimes.length); i++) {
        const t = new Date(hTimes[i]);
        const hourT = Math.round(Number(hTemps[i] ?? tempC));
        const wmoT = Number(hCodes[i] ?? 0);
        const precipT = Math.round(Number(hPrecip[i] ?? 0));
        hourly.push({
          hour: t.toLocaleString("en-US", {
            hour: "numeric",
            hour12: true,
          }),
          temperatureC: hourT,
          condition: mapCondition(wmoT, hourT, humidity, wind),
          precipitationPct: precipT,
        });
      }
    }

    return {
      city: label,
      temperatureC: tempC,
      condition,
      humidity,
      windKmh: wind,
      rainPct,
      forecastDate: date,
      source: "open-meteo",
      hourly,
    };
  } catch (err) {
    console.warn("[weather] fetch failed:", err);
    return null;
  }
}

/**
 * Fetch today's forecast for a city. Returns null on any failure.
 *
 * @param city Free-text city name, e.g. "Mumbai" or "Brooklyn, NY".
 * @param forecastDate YYYY-MM-DD; defaults to today (UTC).
 */
export async function fetchWeather(
  city: string,
  forecastDate?: string,
): Promise<WeatherSnapshot | null> {
  const geo = await geocode(city);
  if (!geo) return null;
  const label = `${geo.name}${geo.country ? ", " + geo.country : ""}`;
  return fetchWeatherRaw(geo.latitude, geo.longitude, label, forecastDate);
}

/**
 * Fetch today's forecast for a specific lat/lon. Skips geocoding — the
 * caller already has coordinates (usually from the device's GPS).
 *
 * @param locality Pre-resolved label like "Andheri, IN" used as the
 *   `city` field of the snapshot. Pass `null` if the device's reverse
 *   geocode returned nothing (a generic "Your area" label is added by
 *   the caller before rendering).
 * @param forecastDate YYYY-MM-DD; defaults to today (UTC).
 */
export async function fetchWeatherAt(
  latitude: number,
  longitude: number,
  locality: string | null,
  forecastDate?: string,
): Promise<WeatherSnapshot | null> {
  // Reject the (0, 0) sentinel — it's either an uninitialized device or
  // the middle of the Atlantic. Either way, no useful forecast.
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    (Math.abs(latitude) < 0.01 && Math.abs(longitude) < 0.01)
  ) {
    return null;
  }
  const label = locality && locality.trim().length > 0
    ? locality.trim()
    : "Your area";
  return fetchWeatherRaw(latitude, longitude, label, forecastDate);
}
