import { Stack } from "expo-router";
import { View } from "react-native";

export default function AddClothesLayout() {
  return (
    <View className="flex-1 bg-[#ffffff]">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#ffffff" },
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="scanning" options={{ gestureEnabled: false }} />
        <Stack.Screen name="form" />
        <Stack.Screen name="scan-result" />
        <Stack.Screen name="barcode-result" />
        <Stack.Screen name="label-result" />
        <Stack.Screen name="fitcheck-result" />
        <Stack.Screen
          name="success"
          options={{ gestureEnabled: false, animation: "fade" }}
        />
      </Stack>
    </View>
  );
}
