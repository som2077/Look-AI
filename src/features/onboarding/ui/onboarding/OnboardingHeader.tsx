import { useRouter } from "expo-router";
import { IconMoodSmile } from "@tabler/icons-react-native";
import { View } from "react-native";
import { BackButton } from "./BackButton";
import { ProgressIndicator } from "./ProgressIndicator";

type Props = {
  step: number;
  showBack?: boolean;
};

export function OnboardingHeader({ step, showBack = true }: Props) {
  const router = useRouter();

  return (
    <View className="mb-4 flex-row items-center">
      {step === 1 ? (
        <View className="h-11 w-11 items-center justify-center rounded-full bg-[#F8F8FA]">
          <IconMoodSmile size={20} color="#1D1A27" strokeWidth={2} />
        </View>
      ) : showBack ? (
        <BackButton onPress={() => router.back()} />
      ) : (
        <View className="h-11 w-11" />
      )}
      <View className="flex-1 ml-6">
        <ProgressIndicator step={step} />
      </View>
    </View>
  );
}
