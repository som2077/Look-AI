/**
 * Conversation — FlatList wrapper for the chat surface. Owns auto-scroll
 * behavior and renders a floating "scroll to bottom" button when the
 * user has scrolled up. The FAB is anchored just above the prompt
 * input bar (passed via `fabBottom`) so it never floats mid-conversation.
 */
import React, { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { IconArrowDown } from "@tabler/icons-react-native";
import { colors, space } from "./theme";
import { useScrollToBottom } from "./useScrollToBottom";

export interface ConversationProps<T> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  /** Bottom-of-list component (e.g. a Loader while streaming). */
  ListFooterComponent?: React.ReactElement | null;
  /** Optional content rendered after the empty list (e.g. welcome). */
  ListEmptyComponent?: React.ReactElement | null;
  /** Pad below the list. */
  contentContainerStyle?: any;
  /**
   * The vertical offset from the bottom of this component to the
   * bottom of the screen — i.e. the height of the input bar + any
   * safe-area insets. The FAB is placed this far above the list's
   * natural bottom edge, so it sits just above the input bar.
   */
  fabBottom?: number;
}

export function Conversation<T>({
  data,
  renderItem,
  keyExtractor,
  ListFooterComponent,
  ListEmptyComponent,
  contentContainerStyle,
  fabBottom,
}: ConversationProps<T>) {
  const { listRef, atBottom, onScroll, scrollToEnd } = useScrollToBottom();

  // Auto-scroll to bottom when new messages arrive IF the user is
  // already at the bottom (don't yank the user back when they've
  // scrolled up to read).
  useEffect(() => {
    if (atBottom && data.length > 0) {
      // Defer to next tick so the row is rendered before scrolling.
      const t = setTimeout(() => scrollToEnd(true), 16);
      return () => clearTimeout(t);
    }
  }, [data.length, atBottom, scrollToEnd]);

  // Default offset: 8pt above the input bar's baseline + a little breathing
  // room. When the keyboard is open `fabBottom` accounts for that too.
  const fabOffset = fabBottom ?? (space.lg + 50 + space.sm);

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={data}
        renderItem={renderItem as any}
        keyExtractor={keyExtractor as any}
        onScroll={onScroll}
        scrollEventThrottle={32}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={[
          styles.content,
          contentContainerStyle,
        ]}
      />
      {!atBottom && data.length > 0 ? (
        <Pressable
          onPress={() => scrollToEnd(true)}
          style={({ pressed }) => [
            styles.fab,
            { bottom: fabOffset, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Scroll to latest"
        >
          <IconArrowDown size={18} color={colors.text} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: {
    paddingVertical: space.lg,
  },
  fab: {
    position: "absolute",
    // Center the FAB horizontally. `alignSelf: center` on an absolutely-
    // positioned child does work on iOS and Android in a flex parent.
    alignSelf: "center",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
