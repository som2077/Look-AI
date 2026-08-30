import { ResizeMode, Video } from "expo-av";
import { View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Video
        source={require("@/assets/loading_starting.webm")}
        style={{ width: 50, height: 50 }}
        shouldPlay
        isLooping
        isMuted
        resizeMode={ResizeMode.CONTAIN}
      />
    </View>
  );
}
