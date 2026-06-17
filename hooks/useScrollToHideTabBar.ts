import { useRef } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useUIStore } from "../backend/store/ui-store";

export function useScrollToHideTabBar() {
  const lastScrollY = useRef(0);
  const setTabBarVisible = useUIStore((state) => state.setTabBarVisible);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const isBouncing = currentScrollY < 0; // iOS bouncing at the top
    const threshold = 10; // Ignore small scroll movements

    if (isBouncing) {
      setTabBarVisible(true);
      return;
    }

    const diff = currentScrollY - lastScrollY.current;

    if (diff > threshold) {
      // Scrolling down -> hide tab bar
      setTabBarVisible(false);
      lastScrollY.current = currentScrollY;
    } else if (diff < -threshold) {
      // Scrolling up -> show tab bar
      setTabBarVisible(true);
      lastScrollY.current = currentScrollY;
    }
  };

  return { onScroll };
}
