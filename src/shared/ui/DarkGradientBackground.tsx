import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import { View } from "react-native";

// A beautiful dark-mode gradient using deep purple and black
const GRADIENT_COLORS = ["#869AFF30", "#FFFFFF"] as const;
const GRADIENT_LOCATIONS = [0, 0.2, 0.1] as const;
const GRADIENT_START = { x: 0.6, y: 0.07 };
const GRADIENT_END = { x: 0, y: 1 };


export const DarkGradientBackground = React.memo(
  function DarkGradientBackground({ children }: { children: ReactNode }) {
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
  },
);
