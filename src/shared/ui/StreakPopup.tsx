import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import { LOTTIE_FLAME_URL } from "@/shared/constants/assets";
import { daysBetween, startOfDay } from "@/shared/utils/date";
import { IconFlameFilled, IconFlameOff } from "@tabler/icons-react-native";
import LottieView from "lottie-react-native";
import React from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fr", "Sat"];

interface StreakPopupProps {
  visible: boolean;
  onClose: () => void;
  streakCount?: number;
}

export function StreakPopup({
  visible,
  onClose,
  streakCount = 0,
}: StreakPopupProps) {
  const lastActiveDate = useStreakStore((state) => state.lastActiveDate);

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

  if (!visible) return null;

  // Determine current day of week (0 = Sunday)
  const currentDay = new Date().getDay();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/60 justify-center p-4">
        <Animated.View
          className="bg-white rounded-[42px] flex-1 max-h-[500px] overflow-hidden shadow-xl"
          style={{ opacity: fadeAnim }}
        >
          <SafeAreaView className="flex-1 px-6 py-4 justify-between">
            {/* Main Content */}
            <View className="items-center justify-center flex-1">
              {/* Giant Flame Graphic */}
              <View
                style={{
                  width: 180,
                  height: 200,
                  alignItems: "center",
                  justifyContent: "flex-end",
                  // marginBottom: 2,
                }}
              >
                <LottieView
                  source={{
                    uri: LOTTIE_FLAME_URL,
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
                  {WEEK_DAYS.map((day, i) => (
                    <Text
                      key={i}
                      className={`text-center font-bold text-sm w-8 ${i === currentDay ? "text-[#E2833F]" : "text-gray-500"}`}
                    >
                      {day}
                    </Text>
                  ))}
                </View>
                <View className="flex-row justify-between w-full px-2">
                  {WEEK_DAYS.map((_, i) => {
                    const isFuture = i > currentDay;

                    let isStreak = false;
                    if (!isFuture && lastActiveDate) {
                      const today = startOfDay(new Date());
                      const lastActive = startOfDay(new Date(lastActiveDate));

                      // `currentDay - i` is how many days ago that weekday was.
                      const daysAgoFromToday = currentDay - i;
                      const daysAgoFromLastActive =
                        daysAgoFromToday - daysBetween(today, lastActive);

                      if (
                        daysAgoFromLastActive >= 0 &&
                        daysAgoFromLastActive < streakCount
                      ) {
                        isStreak = true;
                      }
                    }

                    return (
                      <View key={i} className="items-center w-8">
                        {isFuture ? (
                          <View className="w-8 h-8 rounded-full bg-gray-100" />
                        ) : isStreak ? (
                          <View className="w-8 h-8 rounded-full bg-[#FFF0E5] items-center justify-center">
                            <IconFlameFilled size={18} color="#E2833F" />
                          </View>
                        ) : (
                          <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
                            <IconFlameOff size={18} color="black" />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Motivational Text */}
              <Text className="text-center text-gray-500 text-base font-medium px-3 leading-6">
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
