import { Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";

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
      className={`mt-auto items-center rounded-2xl py-5 ${disabled ? "bg-gray-300" : "bg-[#000000]"}`}
    >
      <Text className="text-base font-semibold text-white">Continue</Text>
    </Pressable>
  );
}
