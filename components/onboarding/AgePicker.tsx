import { useRef } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Text,
  View,
  ViewToken,
} from "react-native";
import * as Haptics from "expo-haptics";

const AGE_MIN = 13;
const AGE_MAX = 70;
const ages = Array.from(
  { length: AGE_MAX - AGE_MIN + 1 },
  (_, idx) => AGE_MIN + idx,
);

export function AgePicker({
  age,
  onChange,
}: {
  age: number;
  onChange: (value: number) => void;
}) {
  const { width } = Dimensions.get("window");
  const AGE_ITEM_WIDTH = Math.floor(width / 3); // sirf 3 items visible
  const sideSpacer = AGE_ITEM_WIDTH; // left+right padding = 1 item width

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

  return (
    <>
      {/* Big number + arrow */}
      <View className="items-center">
        <Text className="text-[70px] font-bold leading-[80px] text-[#1D1A27]">
          {age}
        </Text>
        <Image
          source={require("@/assets/images/polygon.png")}
          className="mt-3 h-10 w-10"
          resizeMode="contain"
        />
      </View>

      {/* Picker strip — black background */}
      <View className="mt-8 overflow-hidden bg-[#000000] py-[30px]">
        <FlatList
          data={ages}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={AGE_ITEM_WIDTH}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={{ paddingHorizontal: sideSpacer }}
          getItemLayout={(_, index) => ({
            length: AGE_ITEM_WIDTH,
            offset: AGE_ITEM_WIDTH * index,
            index,
          })}
          initialScrollIndex={age - AGE_MIN}
          viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
          onViewableItemsChanged={onViewable}
          renderItem={({ item }) => {
            const isSelected = item === age;
            return (
              <View
                style={{ width: AGE_ITEM_WIDTH }}
                className="items-center justify-center"
              >
                <Text
                  style={{
                    fontSize: isSelected ? 45 : 35,
                    fontWeight: isSelected ? "700" : "500",
                    // selected → white, others → muted gray
                    color: isSelected ? "#FFFFFF" : "#A3A3A3",
                  }}
                >
                  {item}
                </Text>
              </View>
            );
          }}
        />

        {/* Selected cell highlight — dark border left/right */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: sideSpacer,
            width: AGE_ITEM_WIDTH,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderLeftWidth: 3,
            borderRightWidth: 3,
            borderColor: "rgba(255,255,255)",
          }}
        />
      </View>
    </>
  );
}
