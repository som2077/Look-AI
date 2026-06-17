import { View } from "react-native";
import { useRouter } from "expo-router";
import { BackButton } from "./BackButton";
import { ProgressIndicator } from "./ProgressIndicator";

type Props = {
  step: number;
  showBack?: boolean;
};

export function OnboardingHeader({ step, showBack = true }: Props) {
  const router = useRouter();

  return (
    <View className="mb-4 flex-row items-center justify-between">
      {showBack ? (
        <BackButton onPress={() => router.back()} />
      ) : (
        <View className="h-10 w-10" />
      )}
      <ProgressIndicator step={step} />
    </View>
  );
}
