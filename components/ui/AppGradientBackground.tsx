import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import { View } from "react-native";

const GRADIENT_COLORS = ["#F3D1C340", "#ABB9C740", "#FFFFFF"] as const;
const GRADIENT_LOCATIONS = [0.01, 0.1, 0.5] as const;
const GRADIENT_START = { x: 2.4, y: 0.35 };
const GRADIENT_END = { x: 0.8, y: 1.8 };

export const AppGradientBackground = React.memo(function AppGradientBackground({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <View className="flex-1">
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        start={GRADIENT_START}
        end={GRADIENT_END}
        className="absolute inset-0"
      />
      {children}
    </View>
  );
});
