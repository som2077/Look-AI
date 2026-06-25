import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import React from "react";
import { Animated, Image, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface StreakPopupProps {
  visible: boolean;
  onClose: () => void;
  streakCount?: number;
}

export function StreakPopup({
  visible,
  onClose,
  streakCount = 1,
}: StreakPopupProps) {
  // Simple fade in animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  // Determine current day of week (0 = Sunday)
  const currentDay = new Date().getDay();
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/60 justify-center p-4">
        <Animated.View
          className="bg-white rounded-3xl flex-1 max-h-[700px] overflow-hidden shadow-xl"
          style={{ opacity: fadeAnim }}
        >
          <SafeAreaView className="flex-1 px-6 py-4 justify-between">
            {/* Top Bar */}
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Image
                  source={require("@/assets/images/getStartedLogo.png")}
                  className="w-24 h-20"
                  resizeMode="contain"
                />
              </View>
              <View className="bg-gray-100 flex-row items-center px-3 py-1.5 rounded-full">
                <Text className="text-base mr-1">🔥</Text>
                <Text className="font-bold text-black">{streakCount}</Text>
              </View>
            </View>

            {/* Main Content */}
            <View className="items-center justify-center flex-1">
              {/* Giant Flame Graphic */}
              <View
                style={{
                  width: 180,
                  height: 200,
                  alignItems: "center",
                  justifyContent: "flex-end",
                  marginBottom: 24,
                }}
              >
                <LottieView
                  source={{
                    uri: "https://lottie.host/90aa36ae-cfef-49e5-bd8e-8c4c54fc2004/df47Z2J4nI.json",
                  }}
                  autoPlay
                  loop
                  style={{
                    width: 180,
                    height: 180,
                    position: "absolute",
                    top: 0,
                  }}
                />

                {/* Number Overlay */}
                <Text
                  style={{
                    fontSize: 64,
                    fontWeight: "900",
                    color: "#FFFFFF",
                    textShadowColor: "rgba(255, 75, 38, 0.5)",
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  {streakCount}
                </Text>
              </View>

              <Text className="text-[#E2833F] text-4xl font-bold mb-8">
                {streakCount} Day streak
              </Text>

              {/* Weekly Calendar */}
              <View className="w-full mb-6">
                <View className="flex-row justify-between w-full px-2 mb-3">
                  {weekDays.map((day, i) => (
                    <Text
                      key={i}
                      className={`text-center font-semibold text-base w-8 ${i === currentDay ? "text-[#E2833F]" : "text-gray-500"}`}
                    >
                      {day}
                    </Text>
                  ))}
                </View>
                <View className="flex-row justify-between w-full px-2">
                  {weekDays.map((_, i) => (
                    <View key={i} className="items-center w-8">
                      {i === currentDay ? (
                        <View className="w-8 h-8 rounded-full bg-[#E2833F] items-center justify-center">
                          <Ionicons name="checkmark" size={18} color="white" />
                        </View>
                      ) : (
                        <View className="w-8 h-8 rounded-full bg-gray-100" />
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* Motivational Text */}
              <Text className="text-center text-gray-500 text-base font-medium px-4 leading-6">
                You&apos;re on fire! Every day matters for hitting your goal!
              </Text>
            </View>

            {/* Bottom Button */}
            <Pressable
              onPress={onClose}
              className="bg-black w-full py-4 rounded-[28px] items-center mb-2 active:scale-95 transition-transform"
            >
              <Text className="text-white font-bold text-lg">Continue</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
