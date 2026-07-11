import {
  IconCamera,
  IconSparkles,
  IconX,
  type IconProps,
} from "@tabler/icons-react-native";
import { BlurView } from "expo-blur";
import React, { useCallback, useEffect, useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ActionCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<IconProps>;
  route: string;
  color: string;
  chipText?: string;
}

const ACTION_CARDS: ActionCard[] = [
  {
    id: "log-outfit",
    title: "Camera / Scan",
    subtitle: "Log outfit, Add cloths",
    icon: IconCamera,
    route: "/(root)/log-outfit/camera",
    color: "#5ECFC2",
    chipText: "3 scans left",
  },
  {
    id: "ai-outfit",
    title: "AI Outfit",
    subtitle: "Generate my mood",
    icon: IconSparkles,
    route: "/(root)/outfit",
    color: "#A78BFA",
    chipText: "Unlimited",
  },
];

interface AddActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export function AddActionMenu({
  visible,
  onClose,
  onNavigate,
}: AddActionMenuProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  const translateY = useSharedValue(30);
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      const inConfig = { duration: 220, easing: Easing.out(Easing.quad) };
      fadeAnim.value = withTiming(1, inConfig);
      scaleAnim.value = withTiming(1, inConfig);
      translateY.value = withTiming(0, inConfig);
    } else if (rendered) {
      const outConfig = { duration: 200, easing: Easing.in(Easing.quad) };
      scaleAnim.value = withTiming(0.98, outConfig);
      translateY.value = withTiming(20, outConfig);
      fadeAnim.value = withTiming(0, outConfig, (finished) => {
        if (finished) runOnJS(setRendered)(false);
      });
    }
  }, [visible, rendered, fadeAnim, scaleAnim, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }, { translateY: translateY.value }],
  }));

  const handleCardPress = useCallback(
    (route: string) => {
      onClose();
      setTimeout(() => onNavigate(route), 200);
    },
    [onClose, onNavigate],
  );

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View className="flex-1" style={backdropStyle}>
        {/* ✅ Ek hi BlurView — poora screen cover, status bar + home indicator dono */}
        <BlurView intensity={140} tint="dark" className="absolute inset-0" />

        <Animated.View
          className="flex-1 px-[16px] justify-end"
          style={[
            contentStyle,
            { paddingBottom: Math.max(24, insets.bottom + 16) },
          ]}
        >
          <Text className="text-[#ffffff] text-3xl font-bold text-center mb-8">
            What would you like to do?
          </Text>

          <View className="flex-row flex-wrap justify-between mb-4">
            {ACTION_CARDS.map((card) => {
              const IconComponent = card.icon;
              return (
                <Pressable
                  key={card.id}
                  onPress={() => handleCardPress(card.route)}
                  className="w-[48%] h-[240px] rounded-[35px] bg-[#ffffff] mb-4 overflow-hidden"
                >
                  <View className="flex-1 pt-3 pb-6 px-3 items-center">
                    {!!card.chipText && (
                      <View className="bg-[#F1EFFF] px-3 py-[6px] rounded-full mb-3">
                        <Text className="text-[#594EE6] text-[11px] font-bold tracking-wide">
                          {card.chipText}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1 w-full rounded-full items-center justify-center overflow-hidden">
                      {card.id === "log-outfit" ? (
                        <Image
                          source={require("@/assets/action-menu/one.png")}
                          className="w-[120%] h-[120%]"
                          resizeMode="contain"
                        />
                      ) : card.id === "add-cloths" ? (
                        <Image
                          source={require("@/assets/action-menu/two.png")}
                          className="w-[120%] h-[120%]"
                          resizeMode="contain"
                        />
                      ) : card.id === "ai-outfit" ? (
                        <Image
                          source={require("@/assets/action-menu/three.png")}
                          className="w-[120%] h-[120%]"
                          resizeMode="cover"
                        />
                      ) : card.id === "style-score" ? (
                        <Image
                          source={require("@/assets/action-menu/four.png")}
                          className="w-[120%] h-[120%]"
                          resizeMode="center"
                        />
                      ) : (
                        <IconComponent
                          size={24}
                          color={card.color}
                          strokeWidth={1.8}
                        />
                      )}
                    </View>

                    <View>
                      <Text className="text-[#000000] text-xl font-semibold text-center mb-1 mt-2">
                        {card.title}
                      </Text>
                      <Text className="text-[#000000] text-sm text-center">
                        {card.subtitle}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            className="self-end rounded-full bg-white items-center justify-center"
            style={{ marginLeft: 12, height: 60, width: 60 }}
          >
            <IconX size={24} color="#000000" strokeWidth={2} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
