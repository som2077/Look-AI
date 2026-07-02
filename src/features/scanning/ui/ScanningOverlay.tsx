import { useAnalysisCompleteNotification } from "@/shared/lib/notificationService";
import React, { useEffect, useRef } from "react";
import { Modal, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface ScanningOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

export function ScanningOverlay({ visible, onComplete }: ScanningOverlayProps) {
  const spin = useSharedValue(0);
  const notifyComplete = useAnalysisCompleteNotification();
  const notifyRef = useRef(notifyComplete);
  notifyRef.current = notifyComplete;

  useEffect(() => {
    if (visible) {
      spin.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1,
        false,
      );

      const t = setTimeout(() => {
        notifyRef.current();
        const completionTimeout = setTimeout(() => {
          onComplete();
        }, 600);
        return () => clearTimeout(completionTimeout);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [visible, spin, onComplete]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60  items-center justify-center">
        {/* Outer Light Gray Card */}
        <View className="bg-[#ffffff] w-[88%] rounded-[48px] px-6 py-10 pb-12 shadow-sm">
          <View className="mb-8 pl-2">
            <Text className="text-[26px] font-extrabold text-black tracking-tight">
              Scanning your item...
            </Text>
            <Text className="text-[15px] text-gray-500 font-medium mt-1">
              Based on your selections
            </Text>
          </View>

          <View className="items-center py-6">
            <View className="relative w-32 h-32 mb-8">
              <View className="absolute inset-0 border-[6px] border-[#E0E0E0] rounded-full" />
              <Animated.View style={spinStyle} className="absolute inset-0">
                <View
                  className="w-full h-full border-[6px] border-transparent rounded-full"
                  style={{
                    borderTopColor: "#1A1A1A",
                    borderRightColor: "#1A1A1A",
                  }}
                />
              </Animated.View>
            </View>

            <Text className="text-[24px] font-bold text-black mb-4">
              AI is styling you
            </Text>

            <View className="items-center mb-8">
              <Text className="text-[14px] text-gray-500 font-medium">
                Scanning 2 cloths
              </Text>
              <Text className="text-[14px] text-gray-500 font-medium">
                for the best item/s
              </Text>
            </View>

            <View className="flex-row items-center justify-center flex-wrap gap-2.5 px-2">
              {["Happy mood", "Office", "Sunny"].map((chip) => (
                <View
                  key={chip}
                  className="bg-[#1A1A1E] px-5 py-2.5 rounded-full"
                >
                  <Text className="text-white text-[11px] font-semibold">
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-10 items-center">
            <Text className="text-gray-500 font-medium text-[15px]">
              This takes just a moment...
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
