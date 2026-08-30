/**
 * Tool — collapsible wrapper around a tool invocation. Composes
 * ToolHeader + Collapsible(ToolContent). Use this to wrap existing
 * chat cards so they appear with a status badge header.
 *
 * The raw `input` payload is hidden by default — the child card
 * (OutfitSuggestionCard etc.) already renders the user-facing data.
 * Exposing the raw JSON inside the chat is just visual noise for
 * non-technical users. Pass `showInput` explicitly to surface the
 * raw payload (useful in error / debug states where the card body
 * doesn't make sense).
 */
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Collapsible } from "./Collapsible";
import { colors, radii, space } from "./theme";
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
  children: React.ReactNode;
}

export function Tool({
  name,
  status,
  input,
  defaultOpen = false,
  showInput = false,
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
          {children}
        </ToolContent>
      </Collapsible>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: space.md,
    overflow: "hidden",
  },
});
