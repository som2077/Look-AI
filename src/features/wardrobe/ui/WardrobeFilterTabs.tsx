import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type FilterTab = "Days" | "Weeks" | "Months" | "All";

const TABS: FilterTab[] = ["Days", "Weeks", "Months", "All"];

interface WardrobeFilterTabsProps {
  onChange?: (tab: FilterTab) => void;
}

export function WardrobeFilterTabs({ onChange }: WardrobeFilterTabsProps) {
  const [active, setActive] = useState<FilterTab>("Days");

  const handlePress = (tab: FilterTab) => {
    setActive(tab);
    onChange?.(tab);
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => handlePress(tab)}
          style={[
            styles.tab,
            active === tab && styles.tabActive,
            { zIndex: active === tab ? 10 : 0 },
          ]}
        >
          <Text style={[styles.label, active === tab && styles.labelActive]}>
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F8F7FC70",
    padding: 2,
    borderRadius: 18,
    shadowColor: "#FFFFFF10",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    borderColor: "#E9EBF8",
    borderWidth: 0.5,
  },
  tab: {
    flex: 1,
    paddingVertical: 9.5,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#1C1C1E",
  },
  labelActive: {
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1C1C1E",
  },
});

// shadowColor: "#FFFFFF10",
//         shadowOpacity: 0.02,
//         shadowRadius: 10,
//         shadowOffset: { width: 0, height: 4 },
//         elevation: 10,
