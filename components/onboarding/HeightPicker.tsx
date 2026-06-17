import { useRef } from "react";
import { FlatList, Image, Text, View, ViewToken } from "react-native";
import * as Haptics from "expo-haptics";

const HEIGHT_MIN = 140;
const HEIGHT_MAX = 210;
const ITEM_H = 28; // ← kam kiya: lines paas paas
const VISIBLE = 13; // ← zyada items visible
const RULER_H = ITEM_H * VISIBLE; // 392px

const values = Array.from(
  { length: HEIGHT_MAX - HEIGHT_MIN + 1 },
  (_, idx) => HEIGHT_MAX - idx,
);

export function HeightPicker({
  height,
  onChange,
}: {
  height: number;
  onChange: (value: number) => void;
}) {
  const onViewable = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const centered = viewableItems.find(
        (item) => item.isViewable && item.item != null,
      );
      if (centered?.item != null) {
        Haptics.selectionAsync();
        onChange(centered.item as number);
      }
    },
  ).current;

  const labelValues = [
    // height + 15,
    height + 10,
    height + 5,
    (height = HEIGHT_MAX ? height : height),
    height - 5,
    height - 10,
    // height - 15,
  ];

  return (
    <View className="flex-1 items-center">
      {/* Big number + Cm */}
      <View className="mt-16 flex-row items-end">
        <Text className="text-[70px] font-bold leading-[80px] text-[#1D1A27]">
          {height}
        </Text>
        <Text className="mb-3 ml-1 text-[20px] font-semibold text-[#6E6A79]">
          Cm
        </Text>
      </View>

      {/* Ruler row */}
      <View className="mt-10 flex-row items-center">
        {/* Left labels */}
        <View
          style={{ width: 80, height: RULER_H }}
          className="items-end justify-between pr-4"
        >
          {labelValues.map((val, i) => {
            const isSelected = val === height;
            const inRange = val >= HEIGHT_MIN && val <= HEIGHT_MAX;
            // Index 2 = center (selected), 0/4 = top/bottom (smallest)
            const fontSize = isSelected
              ? 30
              : i === 1 || i === 3
                ? 26
                : i === 0 || i === 4
                  ? 20
                  : 25;
            const fontWeight = isSelected
              ? "700"
              : i === 1 || i === 3
                ? "500"
                : "400";
            const color = isSelected
              ? "#1D1A27"
              : i === 1 || i === 3
                ? "#6B7280"
                : "#9CA3AF";
            return (
              <Text key={i} style={{ fontSize, fontWeight, color }}>
                {inRange ? val : ""}
              </Text>
            );
          })}
        </View>

        {/* Dark ruler */}
        <View
          style={{ width: 90, height: RULER_H }}
          className="overflow-hidden rounded-2xl bg-black"
        >
          <FlatList
            data={values}
            keyExtractor={(item) => item.toString()}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_H}
            decelerationRate="fast"
            bounces={false}
            contentContainerStyle={{
              paddingVertical: ITEM_H * Math.floor(VISIBLE / 2),
            }}
            getItemLayout={(_, index) => ({
              length: ITEM_H,
              offset: ITEM_H * index,
              index,
            })}
            initialScrollIndex={HEIGHT_MAX - height}
            viewabilityConfig={{ itemVisiblePercentThreshold: 65 }}
            onViewableItemsChanged={onViewable}
            renderItem={({ item }) => {
              const isSelected = item === height;
              const isMajor = item % 5 === 0;
              return (
                <View
                  style={{ height: ITEM_H, width: "100%" }}
                  className="items-center justify-center"
                >
                  <View
                    style={{
                      height: isSelected ? 2.5 : 1.5,
                      width: isSelected ? 50 : isMajor ? 40 : 35,
                      backgroundColor: isSelected
                        ? "#D4DD56"
                        : isMajor
                          ? "rgba(255,255,255,0.8)"
                          : "rgba(255,255,255,0.3)",
                      borderRadius: 2,
                    }}
                  />
                </View>
              );
            }}
          />
        </View>

        {/* Yellow polygon arrow */}
        <Image
          source={require("@/assets/images/polygon.png")}
          className="ml-2 h-[30px] w-[30px]"
          style={{
            transform: [{ rotate: "270deg" }],
            tintColor: "#000000",
          }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
