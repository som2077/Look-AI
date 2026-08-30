/**
 * useScrollToBottom — tracks whether the user is "at the bottom" of
 * a scrollable list. Exposes `scrollToEnd` (call on the FlatList ref),
 * `onScroll` (wire to FlatList.onScroll), and `atBottom` (show a
 * floating "↓" button when false).
 *
 * "At bottom" is defined as < 80px from the end of the list.
 */
import { useCallback, useRef, useState } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

const AT_BOTTOM_THRESHOLD = 80;

export function useScrollToBottom() {
  const listRef = useRef<FlatList<any>>(null);
  const [atBottom, setAtBottom] = useState(true);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setAtBottom(distanceFromBottom < AT_BOTTOM_THRESHOLD);
  }, []);

  const scrollToEnd = useCallback(
    (animated = true) => {
      listRef.current?.scrollToEnd({ animated });
      setAtBottom(true);
    },
    [],
  );

  return { listRef, atBottom, onScroll, scrollToEnd };
}
