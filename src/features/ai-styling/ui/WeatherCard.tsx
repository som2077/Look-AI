import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type WeatherData = {
  date: string; // e.g. "Wed Jul 22"
  tempC: number; // temperature in Celsius
  condition: string; // e.g. "Sunny", "Rainy", "Cloudy"
  rainPct: number; // e.g. 65
  windKmh: number; // e.g. 8
  stormPct: number; // e.g. 25
};

const CONDITION_EMOJI: Record<string, string> = {
  Sunny: "☀️",
  "Partly Cloudy": "⛅",
  Cloudy: "☁️",
  Rainy: "🌧️",
  Stormy: "⛈️",
  Snowy: "❄️",
  Windy: "💨",
  default: "🌤️",
};

interface WeatherCardProps {
  weather: WeatherData;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  const emoji = CONDITION_EMOJI[weather.condition] ?? CONDITION_EMOJI.default;

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        <View style={styles.iconWrap}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.conditionLabel}>Weather</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statCol}>
          <Text style={styles.statValue}>{weather.rainPct}%</Text>
          <Text style={styles.statLabel}>Rain</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statCol}>
          <Text style={styles.statValue}>{weather.windKmh} km/h</Text>
          <Text style={styles.statLabel}>Wind</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statCol}>
          <Text style={styles.statValue}>{weather.stormPct}%</Text>
          <Text style={styles.statLabel}>Storm</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {weather.date} · {weather.tempC}°C · {weather.condition}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF3EC",
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#FFCCAA",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    alignItems: "center",
    flex: 1,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  conditionLabel: {
    fontSize: 12,
    color: "#7C4A00",
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#FFCCAA",
    marginHorizontal: 4,
  },
  statCol: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3D1F00",
  },
  statLabel: {
    fontSize: 12,
    color: "#7C4A00",
    marginTop: 2,
  },
  footer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#FFCCAA",
    paddingTop: 8,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#7C4A00",
    fontWeight: "500",
  },
});
