import { ActivityIndicator, Text, View } from "react-native";

// ─── LoadingScreen — full-screen loading placeholder ──────────────────────────
// Standardizes the handful of bare <ActivityIndicator> full-screen loaders
// (notifications, outfit.tsx, onboarding setup-account) into one primitive.

interface LoadingScreenProps {
  label?: string;
  color?: string;
  backgroundColor?: string;
}

export function LoadingScreen({
  label,
  color = "#4C36F5",
  backgroundColor = "#F8F7FC",
}: LoadingScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor,
        paddingHorizontal: 24,
      }}
    >
      <ActivityIndicator size="large" color={color} />
      {label ? (
        <Text
          style={{
            marginTop: 14,
            fontSize: 14,
            fontWeight: "600",
            color: "#5A5A6A",
            textAlign: "center",
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}
