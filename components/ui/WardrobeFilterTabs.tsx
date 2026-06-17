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
          style={[styles.tab, active === tab && styles.tabActive]}
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
    backgroundColor: "#F8F7FC",
    padding: 2,
    marginTop: 8,
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    // borderColor: "#E9EBF8",
    // borderWidth: 1,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1.5 },
    elevation: 1,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
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
