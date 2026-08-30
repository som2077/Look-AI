/**
 * ToolInput — renders the JSON tool input payload in a monospace
 * code block. Hidden by default unless `defaultExpanded` is true.
 */
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react-native";
import { colors, font, FONT_FAMILY, radii, space } from "./theme";

export interface ToolInputProps {
  data: unknown;
  defaultExpanded?: boolean;
}

export function ToolInput({ data, defaultExpanded = false }: ToolInputProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const text = formatJson(data);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.trigger}
        accessibilityRole="button"
      >
        {open ? (
          <IconChevronDown size={12} color={colors.textMuted} />
        ) : (
          <IconChevronRight size={12} color={colors.textMuted} />
        )}
        <Text
          style={[
            styles.triggerText,
            { fontFamily: FONT_FAMILY["600"] },
          ]}
        >
          Input
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.codeBlock}>
          <Text
            style={[
              styles.codeText,
              { fontFamily: FONT_FAMILY["500"] },
            ]}
          >
            {text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.md,
    paddingTop: space.xs,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    paddingVertical: 2,
  },
  triggerText: {
    fontSize: font.caption,
    color: colors.textMuted,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  codeBlock: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    padding: space.sm,
    marginTop: space.xs,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  codeText: {
    fontSize: font.code,
    color: colors.text,
    lineHeight: 18,
  },
});
