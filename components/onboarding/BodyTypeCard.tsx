import { Check } from "lucide-react-native";
import React from "react";
import { Image as ExpoImage } from "expo-image";
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

export type BodyTypeOption = {
  id: string;
  title: string;
  description: string;
  image: number;
};

type BodyTypeCardProps = {
  item: BodyTypeOption;
  selected: boolean;
  expanded: boolean;
  onPress: () => void;
  index: number;
};

export const BodyTypeCard = React.memo(function BodyTypeCard({
  item,
  selected,
  onPress,
  index,
}: BodyTypeCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 60)}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 20,
            borderWidth: selected ? 2 : 1.5,
            borderColor: selected ? "#1D1A27" : "#E2E2E8",
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
            paddingRight: 16,
          }}
        >
          {/* Image box — left side */}
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ExpoImage
              source={item.image}
              contentFit="contain"
              cachePolicy="memory-disk"
              style={{ width: 90, height: 90 }}
            />
          </View>

          {/* Text — center */}
          <View style={{ flex: 1, paddingLeft: 1 }}>
            <Text
              style={{
                fontFamily: "TikTokSans16pt-SemiBold",
                fontSize: 16,
                color: "#1D1A27",
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontFamily: "TikTokSans16pt-Regular",
                fontSize: 12,
                color: "#6B7280",
                marginTop: 4,
                lineHeight: 17,
              }}
            >
              {item.description}
            </Text>
          </View>

          {/* Radio / check — right side */}
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: selected ? 0 : 2,
              borderColor: "#D1D1D8",
              backgroundColor: selected ? "#1D1A27" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 12,
            }}
          >
            {selected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});
