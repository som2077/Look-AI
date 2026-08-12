import type { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";

// ─── EmptyState — shared empty-list placeholder ───────────────────────────────
// Matches the design of the wardrobe EmptyState (icon circle + title + CTA)
// so every screen's "nothing here" view looks consistent.

type IconComponent = ComponentType<{
  size?: number | string;
  color?: string;
  strokeWidth?: number;
}>;

interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  subtitle?: string;
  ctaTitle?: string;
  onCta?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaTitle,
  onCta,
}: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 120,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          borderWidth: 0.5,
          borderColor: "#E9EBF8",
        }}
      >
        <Icon size={36} color="#000000" strokeWidth={1.2} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#1D1A27",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 13,
            color: "#00000090",
            textAlign: "center",
            lineHeight: 20,
            marginBottom: onCta ? 15 : 0,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {ctaTitle && onCta ? (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => ({
            backgroundColor: "#1D1A27",
            borderRadius: 26,
            paddingHorizontal: 28,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
            {ctaTitle}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
