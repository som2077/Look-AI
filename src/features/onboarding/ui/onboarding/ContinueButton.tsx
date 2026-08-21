import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

export function ContinueButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled}
      className={`mt-auto w-full  ${disabled ? "opacity-70" : ""}`}
    >
      <View className="rounded-[32px] bg-[#000000]" style={{ paddingBottom: 4, marginBottom: -20 }}>
        <View className="items-center justify-center rounded-[32px] bg-[#000000] py-4">
          <Text className="text-[17px] font-sans font-bold text-white">
            Continue
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
