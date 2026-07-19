import { View } from "react-native";

const TOTAL_STEPS = 10;

export function ProgressIndicator({ step }: { step: number }) {
  const progress = Math.min(Math.max(step / TOTAL_STEPS, 0), 1);

  return (
    <View className="w-full h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden flex-row">
      <View
        className="h-full bg-[#1D1A27] rounded-full"
        style={{ width: `${progress * 100}%` }}
      />
    </View>
  );
}
