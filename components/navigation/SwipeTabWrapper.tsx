import React, { ReactNode } from "react";
import { View } from "react-native";

interface SwipeTabWrapperProps {
  tabIndex: number;
  children: ReactNode;
}

export function SwipeTabWrapper({ children }: SwipeTabWrapperProps) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

