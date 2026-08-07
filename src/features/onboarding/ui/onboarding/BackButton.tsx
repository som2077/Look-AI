import * as Haptics from "expo-haptics";
import { ArrowLeft } from "lucide-react-native";
import { Pressable } from "react-native";

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="h-11 w-11 items-center justify-center rounded-full bg-[#F8F8FA]"
    >
      <ArrowLeft size={20} color="#1D1A27" strokeWidth={2} />
    </Pressable>
  );
}
