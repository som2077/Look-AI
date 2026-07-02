import { Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="h-11 w-11 items-center justify-center rounded-full bg-[#ECEDF9]"
    >
      <ChevronLeft size={23} color="#1D1A27" strokeWidth={2.5} />
    </Pressable>
  );
}