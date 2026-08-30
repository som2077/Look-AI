/**
 * Section primitives — shared visual tokens used by the Profile screen
 * and any sub-section (e.g. AI Usage). Extracted from profile.tsx so
 * they can be reused without duplication.
 *
 * Visual language:
 *   - White cards on the AppGradientBackground.
 *   - 20px border radius, faint border (#E5E7EB), soft shadow.
 *   - Icons in muted gray (#00000090).
 *   - Body text 14px, primary text near-black (#1D1D1D / #1D1A27).
 *   - Section titles 18px extra-bold, 24px top margin.
 */
import { IconChevronRight } from "@tabler/icons-react-native";
import React from "react";
import { Pressable, StyleSheet, Text as RNText, TextProps, View } from "react-native";

// ─── Text wrapper that maps fontWeight to the Bricolage Grotesque family ────
// Mirrors the local wrapper at the top of profile.tsx so the font
// rendering stays consistent across the screen.

const FONT_MAP: Record<string, string> = {
  "400": "BricolageGrotesque_400Regular",
  "500": "BricolageGrotesque_500Medium",
  "600": "BricolageGrotesque_600SemiBold",
  "700": "BricolageGrotesque_700Bold",
  "800": "BricolageGrotesque_800ExtraBold",
  bold: "BricolageGrotesque_700Bold",
};

export const Text = (props: TextProps & { children?: React.ReactNode }) => {
  const { style, ...rest } = props;
  const flatStyle = StyleSheet.flatten(style ?? {});
  const weightKey = String(flatStyle.fontWeight ?? "400");
  const fontFamily = FONT_MAP[weightKey] ?? FONT_MAP["400"];
  const { fontWeight, ...cleanStyle } = flatStyle as Record<string, unknown>;
  return <RNText style={[cleanStyle, { fontFamily }]} {...rest} />;
};

// ─── SectionTitle ────────────────────────────────────────────────────────────

export const SectionTitle = ({ title }: { title: string }) => (
  <Text
    style={{
      fontSize: 18,
      fontFamily: "BricolageGrotesque_800ExtraBold",
      color: "#1D1D1D",
      marginBottom: 9,
      marginTop: 24,
      marginLeft: 10,
    }}
  >
    {title}
  </Text>
);

// ─── CardContainer ───────────────────────────────────────────────────────────

export const CardContainer = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => (
  <View
    style={[
      {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
        borderColor: "#E5E7EB",
        borderWidth: 0.4,
        shadowColor: "#00000040",
        shadowOpacity: 0.04,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 10,
      },
      style,
    ]}
  >
    {children}
  </View>
);

// ─── ListItem ────────────────────────────────────────────────────────────────

export const ListItem = ({
  icon,
  title,
  subtitle,
  onPress,
  hasBorder = true,
  rightElement,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  onPress?: () => void;
  hasBorder?: boolean;
  rightElement?: React.ReactNode;
}) => (
  <>
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      {icon ? <View style={{ marginRight: 12 }}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 14, color: "#1D1D1D", fontWeight: "400" }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: 12,
              color: "#6B7280",
              marginTop: 2,
              fontWeight: "400",
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement ?? <IconChevronRight size={18} color="#1D1D1D" />}
    </Pressable>
    {hasBorder && (
      <View
        style={{
          height: 1,
          backgroundColor: "#E5E7EB60",
          marginHorizontal: 16,
        }}
      />
    )}
  </>
);
