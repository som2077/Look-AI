import { Stack } from "expo-router";

export default function SocialLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="trend-feed" />
      <Stack.Screen name="group-detail" />
    </Stack>
  );
}
