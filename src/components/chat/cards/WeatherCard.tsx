// WeatherCard — white card showing current conditions + next 6 hours.
//
// Visual (matches the chat weather widget mock):
//   ┌──────────────────────────────────────────┐
//   │ [icon]  23°                       Rain  │
//   │                          Singapore      │
//   │                                          │
//   │  4 PM  5 PM  6 PM  7 PM  8 PM  9 PM    │
//   │  [i]   [i]   [i]   [i]   [i]   [i]     │
//   │  23°   22°   21°   21°   21°   21°     │
//   └──────────────────────────────────────────┘
//
// Data shape (consumed by the AI's show_weather tool on the client):
//   {
//     city, temperature, condition,         // current
//     hourly: [{ hour, temperature, condition, precipitationPct }] // 6 entries
//     ai_tip?,                                // optional one-liner from the AI
//   }
//
// If `hourly` is missing (e.g. far-future date the API can't resolve), the card
// renders just the top row. The card never breaks.

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { IconCloudRain, IconCloud, IconSun, IconWind } from "@tabler/icons-react-native";

export interface WeatherHourlyEntry {
  hour: string;
  temperature: number;
  condition: "sunny" | "cloudy" | "rainy" | "humid" | "cold" | "windy" | "hazy" | "clear";
  precipitationPct?: number;
}

export interface WeatherCardData {
  city: string;
  temperature: number;
  condition: WeatherHourlyEntry["condition"];
  hourly?: WeatherHourlyEntry[];
  ai_tip?: string;
  loading?: boolean;
}

function ConditionIcon({
  condition,
  size = 56,
  color = "#1F2937",
}: {
  condition: WeatherHourlyEntry["condition"];
  size?: number;
  color?: string;
}) {
  switch (condition) {
    case "sunny":
    case "clear":
      return <IconSun size={size} color={color} strokeWidth={1.5} />;
    case "rainy":
      return <IconCloudRain size={size} color={color} strokeWidth={1.5} />;
    case "windy":
      return <IconWind size={size} color={color} strokeWidth={1.5} />;
    case "cloudy":
    case "humid":
    case "hazy":
    case "cold":
    default:
      return <IconCloud size={size} color={color} strokeWidth={1.5} />;
  }
}

function ConditionLabel(c: WeatherHourlyEntry["condition"]): string {
  switch (c) {
    case "sunny":
      return "Sunny";
    case "clear":
      return "Clear";
    case "cloudy":
      return "Cloudy";
    case "rainy":
      return "Rain";
    case "humid":
      return "Humid";
    case "hazy":
      return "Hazy";
    case "windy":
      return "Windy";
    case "cold":
      return "Cold";
    default:
      return "—";
  }
}

export function WeatherCard({ data }: { data: WeatherCardData }) {
  const { city, temperature, condition, hourly, ai_tip, loading } = data;
  const hours = Array.isArray(hourly) ? hourly.slice(0, 6) : [];

  return (
    <View style={styles.container}>
      <View style={[styles.card, loading ? styles.cardLoading : null]}>
        <View style={styles.topRow}>
          <ConditionIcon condition={condition} size={56} color="#1F2937" />
          <Text style={styles.tempText}>{temperature}°</Text>
          <View style={styles.rightMeta}>
            <Text style={styles.conditionText}>{ConditionLabel(condition)}</Text>
            <Text style={styles.cityText}>{city}</Text>
          </View>
        </View>

        {hours.length > 0 ? (
          <View style={styles.hourlyRow}>
            {hours.map((h, i) => (
              <View key={`${h.hour}-${i}`} style={styles.hourCell}>
                <Text style={styles.hourLabel}>{h.hour}</Text>
                <View style={styles.hourIcon}>
                  <ConditionIcon
                    condition={h.condition}
                    size={24}
                    color="#1F2937"
                  />
                </View>
                <Text style={styles.hourTemp}>{h.temperature}°</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {ai_tip ? (
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>💡 {ai_tip}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F1F4",
  },
  cardLoading: { opacity: 0.6 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tempText: {
    fontSize: 56,
    fontWeight: "300",
    color: "#1F2937",
    marginLeft: 8,
  },
  rightMeta: { alignItems: "flex-end" },
  conditionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  cityText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  hourlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F4",
  },
  hourCell: { alignItems: "center", flex: 1 },
  hourLabel: { fontSize: 11, color: "#6B7280", marginBottom: 6 },
  hourIcon: { marginBottom: 4 },
  hourTemp: { fontSize: 13, fontWeight: "600", color: "#1F2937" },
  tipBox: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(31,41,55,0.04)",
    borderRadius: 12,
  },
  tipText: { fontSize: 13, color: "#1F2937" },
});
