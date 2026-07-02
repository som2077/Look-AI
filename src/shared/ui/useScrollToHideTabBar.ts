import { useEffect } from "react";
import { useUIStore } from "../model/ui-store";

export function useScrollToHideTabBar() {
  const setTabBarVisible = useUIStore((state) => state.setTabBarVisible);

  useEffect(() => {
    // Ensure tab bar is visible when screen mounts
    setTabBarVisible(true);
  }, [setTabBarVisible]);

  const onScroll = () => {
    // Do nothing on scroll to keep the tab bar always visible
  };

  return { onScroll };
}
