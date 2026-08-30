/**
 * Sources — collapsible citation list. Trigger shows the count;
 * content lists the individual sources. Renders nothing if `items`
 * is empty.
 */
import React, { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconWorld,
} from "@tabler/icons-react-native";
import { colors, font, FONT_FAMILY, radii, space } from "./theme";
import { Collapsible } from "./Collapsible";

export interface SourceItem {
  title?: string;
  url: string;
  description?: string;
}

export interface SourcesProps {
  items: SourceItem[];
}

export function Sources({ items }: SourcesProps) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.header}
        accessibilityRole="button"
      >
        <IconWorld size={14} color={colors.textMuted} strokeWidth={2} />
        <Text style={[styles.label, { fontFamily: FONT_FAMILY["600"] }]}>
          {items.length} {items.length === 1 ? "source" : "sources"}
        </Text>
        {open ? (
          <IconChevronDown size={14} color={colors.textMuted} />
        ) : (
          <IconChevronRight size={14} color={colors.textMuted} />
        )}
      </Pressable>
      <Collapsible open={open}>
        <View style={styles.body}>
          {items.map((s, i) => (
            <Source key={`${s.url}-${i}`} {...s} />
          ))}
        </View>
      </Collapsible>
    </View>
  );
}

export interface SourceProps extends SourceItem {
  href?: string;
  title?: string;
}

export function Source({ url, title, description }: SourceProps) {
  const onPress = () => {
    if (url) Linking.openURL(url).catch(() => {});
  };
  return (
    <Pressable onPress={onPress} style={styles.sourceRow}>
      <View style={styles.sourceIcon}>
        <IconExternalLink size={12} color={colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.sourceTitle, { fontFamily: FONT_FAMILY["500"] }]}
          numberOfLines={1}
        >
          {title ?? url}
        </Text>
        {description ? (
          <Text style={styles.sourceDesc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: space.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  label: {
    flex: 1,
    fontSize: font.small,
    color: colors.textMuted,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  body: {
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: space.sm,
    paddingVertical: space.xs + 2,
  },
  sourceIcon: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  sourceTitle: {
    fontSize: font.small + 1,
    color: colors.text,
  },
  sourceDesc: {
    fontSize: font.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
