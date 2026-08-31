/**
 * Tool — collapsible wrapper around a tool invocation.
 *
 * Inside the StyleAI chat, the technical header (tool name + status
 * badge + chevron) is intentionally hidden: the user is talking to a
 * stylist, not a debugger. The child card's own title (e.g. "Here's
 * what you can wear for College") IS the user-facing header. Pass
 * `showHeader` to surface the technical wrapper (useful for empty /
 * error states where the card body doesn't make sense on its own).
 *
 * When the tool is still running, we render the child directly with
 * a thin "preparing" caption above it — no chevron, no badge — so
 * the user knows something is happening without seeing plumbing.
 *
 * `input` payload is hidden by default (visual noise for non-tech
 * users). Pass `showInput` to surface it for debug/error states.
 */
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Collapsible } from "./Collapsible";
import { colors, font, FONT_FAMILY, radii, space } from "./theme";
import { ToolContent } from "./ToolContent";
import { ToolHeader } from "./ToolHeader";
import type { ToolStatus } from "./types";

export interface ToolProps {
  name: string;
  status: ToolStatus;
  /** Optional tool input — hidden by default. Set `showInput` to render it. */
  input?: unknown;
  /** Open the body by default. Useful for skeleton → finished transitions. */
  defaultOpen?: boolean;
  /** Surface the raw tool-input JSON inside the collapsible. Off by default. */
  showInput?: boolean;
  /** Surface the technical header (tool name + status badge). Off by default. */
  showHeader?: boolean;
  children: React.ReactNode;
}

export function Tool({
  name,
  status,
  input,
  defaultOpen = true,
  showInput = false,
  showHeader = false,
  children,
}: ToolProps) {
  if (__DEV__ && !name) {
    console.warn("[Tool] missing `name` prop — header will be blank.");
  }

  const [open, setOpen] = useState(defaultOpen);

  // Auto-open on completion so the user sees the result.
  useEffect(() => {
    if (status === "completed" && !defaultOpen) {
      setOpen(true);
    }
  }, [status, defaultOpen]);

  // Body: a thin "preparing" caption while running, nothing extra once done.
  // The child card itself owns the user-facing surface.
  const body = (
    <View style={styles.body}>
      {status === "running" ? (
        <View style={styles.runningRow}>
          <ActivityIndicator size="small" color={colors.brand} />
          <Text style={styles.runningText}>Preparing…</Text>
        </View>
      ) : null}
      {children}
    </View>
  );

  // Header-less mode (default): no chrome around the card. The card
  // becomes the surface the user actually reads.
  if (!showHeader) {
    return (
      <View style={styles.cardFlush}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <ToolContent
            input={showInput ? input : undefined}
            inputDefaultExpanded={false}
          >
            {body}
          </ToolContent>
        </Collapsible>
      </View>
    );
  }

  // Header mode: keep the technical wrapper for debug / error states.
  return (
    <View style={styles.card}>
      <ToolHeader
        name={name}
        status={status}
        open={open}
        onPress={() => setOpen((o) => !o)}
      />
      <Collapsible open={open} onOpenChange={setOpen}>
        <ToolContent
          input={showInput ? input : undefined}
          inputDefaultExpanded={false}
        >
          {body}
        </ToolContent>
      </Collapsible>
    </View>
  );
}

const styles = StyleSheet.create({
  // Default card: no border, no chrome. The child owns the surface.
  cardFlush: {
    marginBottom: space.md,
  },
  // Debug card: hairline border + radius, used when showHeader is true.
  card: {
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: space.md,
    overflow: "hidden",
  },
  body: {
    paddingTop: 0,
  },
  runningRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  runningText: {
    fontSize: font.small,
    color: colors.textMuted,
    fontFamily: FONT_FAMILY["500"],
    fontStyle: "italic",
  },
});
