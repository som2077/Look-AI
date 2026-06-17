import React, { useEffect, useRef } from "react";
import { useAnalysisCompleteNotification } from "@/src/services/notificationService";
import { Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  IconCheck,
  IconLoader2,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react-native";

interface DetectChip {
  label: string;
  state: "done" | "progress" | "wait";
}

const CHIPS: DetectChip[] = [
  { label: "Clothing items", state: "done" },
  { label: "Colors", state: "done" },
  { label: "Wardrobe match...", state: "progress" },
  { label: "Categories...", state: "progress" },
  { label: "New items...", state: "wait" },
];

interface WardrobeCheck {
  label: string;
  state: "done" | "progress";
}

const CHECKS: WardrobeCheck[] = [
  { label: "Blue kurta — found in wardrobe", state: "done" },
  { label: "Beige palazzo — found", state: "done" },
  { label: "Tan sandals — checking...", state: "progress" },
];

const PROGRESS_TARGET = 0.72;

export default function AnalyzingScreen() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const scan = useSharedValue(0);
  const progress = useSharedValue(0);
  const spin = useSharedValue(0);
  const notifyComplete = useAnalysisCompleteNotification();
  const notifyRef = useRef(notifyComplete);
  notifyRef.current = notifyComplete;

  useEffect(() => {
    scan.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    progress.value = withTiming(PROGRESS_TARGET, {
      duration: 2200,
      easing: Easing.out(Easing.cubic),
    });
    spin.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );

    const timer = setTimeout(() => {
      notifyRef.current();
      // Small delay so the chime is audible before unmount
      setTimeout(() => {
        router.replace("/(root)/log-outfit/confirm" as never);
      }, 600);
    }, 3200);
    return () => clearTimeout(timer);
  }, [router, scan, progress, spin]);

  const scanStyle = useAnimatedStyle(() => ({
    top: `${10 + scan.value * 80}%`,
  }));
  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <View className="flex-1 bg-[#0c0c0c]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Top bar */}
        <View className="flex-row items-center gap-2 px-4 py-3 border-b border-[#1e1e1e]">
          <Animated.View style={spinStyle}>
            <IconLoader2 size={18} color="#534AB7" />
          </Animated.View>
          <Text className="text-white text-sm font-bold">
            Analyzing your outfit...
          </Text>
        </View>

        <View className="flex-1 px-4 pt-4">
          {/* Photo preview with scan line */}
          <View
            className="rounded-2xl border border-[#1e1e1e] overflow-hidden items-center justify-center"
            style={{ height: 220, backgroundColor: "#141414" }}
          >
            {photoUri ? (
              <ExpoImage
                source={{ uri: photoUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory"
              />
            ) : (
              <IconUser size={70} color="#2e2e2e" strokeWidth={1.5} />
            )}
            <Animated.View
              className="absolute left-0 right-0 h-[2px] bg-[#534AB7]"
              style={[
                scanStyle,
                {
                  shadowColor: "#534AB7",
                  shadowOpacity: 0.8,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            />
            <View className="absolute top-2 right-2 flex-row items-center gap-1 bg-[#534AB7] px-2 py-1 rounded-full">
              <IconSparkles size={10} color="#ffffff" />
              <Text className="text-white text-[9px] font-bold">
                AI scanning
              </Text>
            </View>
          </View>

          {/* Detecting chips */}
          <Text className="text-white text-xs font-bold mt-4 mb-2">
            What AI is detecting:
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mb-3">
            {CHIPS.map((c) => {
              const cls =
                c.state === "done"
                  ? "bg-[#1D9E75]/15 border-[#1D9E75]/40"
                  : c.state === "progress"
                    ? "bg-[#534AB7]/15 border-[#534AB7]/50"
                    : "bg-[#141414] border-[#1e1e1e]";
              const txt =
                c.state === "done"
                  ? "text-[#1D9E75]"
                  : c.state === "progress"
                    ? "text-[#8b82ff]"
                    : "text-[#666]";
              return (
                <View
                  key={c.label}
                  className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full border ${cls}`}
                >
                  {c.state === "done" && (
                    <IconCheck size={10} color="#1D9E75" strokeWidth={3} />
                  )}
                  {c.state === "progress" && (
                    <Animated.View style={spinStyle}>
                      <IconLoader2 size={10} color="#8b82ff" />
                    </Animated.View>
                  )}
                  <Text className={`text-[10px] font-semibold ${txt}`}>
                    {c.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Progress bar */}
          <View className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <Animated.View className="h-full bg-[#534AB7]" style={barStyle} />
          </View>
          <Text className="text-[#aaa] text-[10px] mt-1.5 mb-3">
            72% — matching with your wardrobe
          </Text>

          {/* Wardrobe check card */}
          <View className="bg-[#141414] border border-[#1e1e1e] rounded-2xl p-3">
            <Text className="text-[#888] text-[10px] mb-2">
              Checking wardrobe for:
            </Text>
            {CHECKS.map((c) => (
              <View
                key={c.label}
                className="flex-row items-center gap-2 py-1.5"
              >
                {c.state === "done" ? (
                  <View className="h-5 w-5 rounded-full bg-[#1D9E75]/20 items-center justify-center">
                    <IconCheck size={12} color="#1D9E75" strokeWidth={3} />
                  </View>
                ) : (
                  <Animated.View
                    style={spinStyle}
                    className="h-5 w-5 rounded-full bg-[#534AB7]/20 items-center justify-center"
                  >
                    <IconLoader2 size={12} color="#8b82ff" />
                  </Animated.View>
                )}
                <Text className="text-[#ddd] text-[11px] flex-1">
                  {c.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
