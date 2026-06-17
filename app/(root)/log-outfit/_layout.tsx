import { Stack } from "expo-router";
import { View } from "react-native";

export default function LogOutfitLayout() {
  return (
    <View className="flex-1 bg-[#0c0c0c]">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0c0c0c" },
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="camera" />
        <Stack.Screen
          name="info"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="analyzing" options={{ gestureEnabled: false }} />
        <Stack.Screen name="confirm" />
        <Stack.Screen name="details" />
        <Stack.Screen
          name="success"
          options={{
            gestureEnabled: false,
            animation: "fade",
          }}
        />
      </Stack>
    </View>
  );
}
