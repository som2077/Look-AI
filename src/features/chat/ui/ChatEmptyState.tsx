/**
 * ChatEmptyState — welcome surface shown when the thread has no
 * messages yet.
 *
 * Operate-mode empty state: orient, invite, offer the smallest set of
 * useful prompts to act on. Never a blank page; never a long onboarding
 * tour.
 *
 *  - Editorial greeting that names the product value
 *  - "Try asking" caption (no eyebrow above the heading)
 *  - Horizontal chip row of contextually useful prompts
 *  - Light hairline between the hero and the chips so the eye has a
 *    clear next stop
 */
import {
  IconCalendarEvent,
  IconHanger,
  IconSparkles,
  IconSun,
} from "@tabler/icons-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, FONT_FAMILY, radii, space } from "@/components/ai-elements/theme";

export interface QuickPrompt {
  id: string;
  label: string;
  message: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const PROMPTS: QuickPrompt[] = [
  {
    id: "weather",
    label: "Weather outfit",
    message: "Aaj ka weather kaisa hai aur kya pehnu?",
    Icon: IconSun,
  },
  {
    id: "occasion",
    label: "Pick my look",
    message: "Mujhe ek achha outfit suggest karo for today.",
    Icon: IconSparkles,
  },
  {
    id: "event",
    label: "Plan an event",
    message: "Ek upcoming event ke liye outfit plan karo.",
    Icon: IconCalendarEvent,
  },
  {
    id: "wardrobe",
    label: "Style my wardrobe",
    message: "Mere wardrobe se ek outfit banakar do.",
    Icon: IconHanger,
  },
];

export interface ChatEmptyStateProps {
  onSelectPrompt: (message: string) => void;
}

export function ChatEmptyState({  onSelectPrompt  }: ChatEmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <IconSparkles size={14} color={colors.textInverse} strokeWidth={2.5} />
          </View>
          <Text style={styles.brandText}>LOOK AI STYLIST</Text>
        </View>
        <Text style={styles.heading}>
          What are you{`\n`}wearing today?
        </Text>
        <Text style={styles.body}>
          Tell me the weather, an event, or what&apos;s already in your closet — I&apos;ll
          put it together.
        </Text>
      </View>

      <View style={styles.promptSection}>
        <Text style={styles.promptCaption}>Try asking</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {PROMPTS.map(({ id, label, message, Icon }) => (
            <Pressable
              key={id}
              onPress={() => onSelectPrompt(message)}
              accessibilityRole="button"
              accessibilityLabel={`Send prompt: ${label}`}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            >
              <View style={styles.chipIcon}>
                <Icon size={15} color={colors.text} strokeWidth={2.2} />
              </View>
              <Text style={styles.chipLabel}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: space.xl,
    paddingHorizontal: space.lg,
    justifyContent: "space-between",
  },
  hero: { paddingTop: space.md },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.xs + 2,
    marginBottom: space.lg,
  },
  brandMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    color: colors.textMuted,
    fontFamily: FONT_FAMILY["700"],
    fontSize: 11,
    letterSpacing: 1.4,
  },
  heading: {
    color: colors.text,
    fontFamily: FONT_FAMILY["700"],
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    marginBottom: space.sm + 2,
  },
  body: {
    color: colors.textMuted,
    fontFamily: FONT_FAMILY["400"],
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  promptSection: {
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },
  promptCaption: {
    color: colors.textSubtle,
    fontFamily: FONT_FAMILY["600"],
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: space.sm + 2,
  },
  chipRow: { columnGap: space.sm, paddingRight: space.lg },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.xs + 2,
    paddingLeft: space.xs + 2,
    paddingRight: space.md,
    paddingVertical: space.xs + 2,
    backgroundColor: colors.bg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipPressed: { opacity: 0.6 },
  chipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    color: colors.text,
    fontFamily: FONT_FAMILY["600"],
    fontSize: 13,
    letterSpacing: -0.1,
  },
});