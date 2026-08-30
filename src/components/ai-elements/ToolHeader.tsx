/**
 * ToolHeader — collapsible trigger row showing the tool name, an
 * icon, and a status badge. Pressing the row toggles the open state.
 */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  IconChevronDown,
  IconChevronRight,
  IconTool,
} from "@tabler/icons-react-native";
import { Badge } from "./Badge";
import { Spinner } from "./Spinner";
import { colors, font, FONT_FAMILY, radii, space } from "./theme";
import type { ToolStatus } from "./types";

const STATUS_LABEL: Record<ToolStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  error: "Error",
};

const STATUS_VARIANT: Record<
  ToolStatus,
  "pending" | "running" | "completed" | "error"
> = {
  pending: "pending",
  running: "running",
  completed: "completed",
  error: "error",
};

export interface ToolHeaderProps {
  name: string;
  status: ToolStatus;
  open: boolean;
  onPress: () => void;
}

export function ToolHeader({ name, status, open, onPress }: ToolHeaderProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${name} tool, ${STATUS_LABEL[status]}`}
    >
      <View style={styles.iconWrap}>
        <IconTool size={14} color={colors.text} strokeWidth={2} />
      </View>
      <Text
        style={[styles.name, { fontFamily: FONT_FAMILY["500"] }]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <View style={{ flex: 1 }} />
      {status === "running" ? <Spinner size={5} /> : null}
      <Badge
        variant={STATUS_VARIANT[status]}
        label={STATUS_LABEL[status]}
        style={{ marginLeft: space.sm }}
      />
      {open ? (
        <IconChevronDown
          size={16}
          color={colors.textMuted}
          style={{ marginLeft: space.sm }}
        />
      ) : (
        <IconChevronRight
          size={16}
          color={colors.textMuted}
          style={{ marginLeft: space.sm }}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.sm,
  },
  name: {
    fontSize: font.small + 1,
    color: colors.text,
    letterSpacing: 0.2,
  },
});
