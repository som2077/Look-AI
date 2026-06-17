import { create } from "zustand";
import * as Location from "expo-location";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeatherData {
  city: string;
  state: string;
  isLive: boolean;
  temperatureCelsius: number;
  feelsLike: number;
  condition: string;
  humidityPercent: number;
  windKmh: number;
  uvIndex: number;
  uvLevel: "Low" | "Moderate" | "High" | "Very High";
  comfortScore: number;
  bestFabric: string;
  bestColors: string;
  weatherIcon: string; // maps to tabler icon codes
  isDay: boolean;
}

interface WeatherStore {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchWeather: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CACHE_MS = 10 * 60 * 1000; // 10 minutes

/** WMO weather code → readable condition + icon code */
function wmoToCondition(
  code: number,
  isDay: boolean,
): { condition: string; icon: string } {
  if (code === 0)
    return {
      condition: isDay ? "Clear Sky" : "Clear Night",
      icon: isDay ? "01d" : "01n",
    };
  if (code <= 2)
    return { condition: "Partly Cloudy", icon: isDay ? "02d" : "02n" };
  if (code === 3) return { condition: "Overcast", icon: "04d" };
  if (code <= 49) return { condition: "Foggy", icon: "50d" };
  if (code <= 55) return { condition: "Drizzle", icon: "09d" };
  if (code <= 65) return { condition: "Rain", icon: "10d" };
  if (code <= 75) return { condition: "Snow", icon: "13d" };
  if (code <= 82) return { condition: "Rain Showers", icon: "09d" };
  if (code <= 86) return { condition: "Snow Showers", icon: "13d" };
  if (code <= 99) return { condition: "Thunderstorm", icon: "11d" };
  return { condition: "Clear", icon: "01d" };
}

function uvIndexToLevel(uvi: number): WeatherData["uvLevel"] {
  if (uvi <= 2) return "Low";
  if (uvi <= 5) return "Moderate";
  if (uvi <= 7) return "High";
  return "Very High";
}

/** 0–100 comfort score based on temp, humidity & wind */
function calcComfortScore(
  temp: number,
  humidity: number,
  wind: number,
): number {
  const tempScore = Math.max(0, 100 - Math.abs(temp - 22) * 3);
  const humScore = Math.max(0, 100 - Math.abs(humidity - 50) * 1.2);
  const windScore = Math.max(0, 100 - Math.max(0, wind - 10) * 2);
  return Math.round(tempScore * 0.5 + humScore * 0.3 + windScore * 0.2);
}

function bestFabricForTemp(temp: number): string {
  if (temp >= 35) return "Linen · Mesh";
  if (temp >= 28) return "Cotton · Linen";
  if (temp >= 20) return "Cotton · Chino";
  if (temp >= 12) return "Denim · Wool";
  return "Wool · Fleece";
}

function bestColorsForTemp(temp: number): string {
  if (temp >= 30) return "White · Pastels";
  if (temp >= 20) return "Light & Earthy";
  if (temp >= 12) return "Neutral & Navy";
  return "Dark & Rich";
}

// ─── State Abbreviations ──────────────────────────────────────────────────────

const STATE_ABBR: Record<string, string> = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CG",
  Goa: "GA",
  Gujarat: "GJ",
  Haryana: "HR",
  "Himachal Pradesh": "HP",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  "Madhya Pradesh": "MP",
  Maharashtra: "MH",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Odisha: "OD",
  Punjab: "PB",
  Rajasthan: "RJ",
  Sikkim: "SK",
  "Tamil Nadu": "TN",
  Telangana: "TG",
  Tripura: "TR",
  "Uttar Pradesh": "UP",
  Uttarakhand: "UK",
  "West Bengal": "WB",
  Delhi: "DL",
  "Jammu and Kashmir": "JK",
  Ladakh: "LA",
  Puducherry: "PY",
  Chandigarh: "CH",
  Lakshadweep: "LD",
  California: "CA",
  Texas: "TX",
  "New York": "NY",
  Florida: "FL",
  Illinois: "IL",
  Pennsylvania: "PA",
  Ohio: "OH",
  Georgia: "GA",
  "North Carolina": "NC",
  Michigan: "MI",
  Washington: "WA",
  England: "ENG",
  Scotland: "SCT",
  Wales: "WLS",
  Ontario: "ON",
  Quebec: "QC",
  "British Columbia": "BC",
  Alberta: "AB",
  India: "IN",
  "United States": "US",
  "United Kingdom": "UK",
  Canada: "CA",
  Australia: "AU",
  Pakistan: "PK",
  Bangladesh: "BD",
  Nepal: "NP",
  Germany: "DE",
  France: "FR",
  Japan: "JP",
  UAE: "AE",
};

function abbreviateState(name: string): string {
  if (!name) return "";
  if (STATE_ABBR[name]) return STATE_ABBR[name];
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  lastFetchedAt: null,

  fetchWeather: async () => {
    const { loading, lastFetchedAt } = get();
    if (loading) return;

    // Return cached data if fresh
    if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_MS && get().data)
      return;

    set({ loading: true, error: null });

    try {
      // 1. Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        set({ loading: false, error: "location_denied" });
        return;
      }

      // 2. Get current coordinates
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      // 3. Reverse geocode for city/state
      const [place] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const city =
        place?.city ?? place?.district ?? place?.subregion ?? "Unknown";
      const state = place?.region ?? place?.country ?? "";

      // 4. Fetch from Open-Meteo (FREE — no API key needed!)
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
        `weather_code,wind_speed_10m,uv_index,is_day` +
        `&wind_speed_unit=kmh` +
        `&timezone=auto`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) throw new Error("Weather fetch failed");

      const current = json.current;
      const temp = Math.round(current.temperature_2m);
      const feelsLike = Math.round(current.apparent_temperature);
      const humidity = Math.round(current.relative_humidity_2m);
      const windKmh = Math.round(current.wind_speed_10m);
      const uvIndex = Math.round(current.uv_index ?? 0);
      const wmoCode = current.weather_code ?? 0;
      const isDay = current.is_day === 1;

      const { condition, icon } = wmoToCondition(wmoCode, isDay);
      const uvLevel = uvIndexToLevel(uvIndex);
      const comfortScore = calcComfortScore(temp, humidity, windKmh);

      set({
        data: {
          city,
          state: abbreviateState(state),
          isLive: true,
          temperatureCelsius: temp,
          feelsLike,
          condition,
          humidityPercent: humidity,
          windKmh,
          uvIndex,
          uvLevel,
          comfortScore,
          bestFabric: bestFabricForTemp(temp),
          bestColors: bestColorsForTemp(temp),
          weatherIcon: icon,
          isDay,
        },
        loading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      set({ loading: false, error: msg });
    }
  },
}));
