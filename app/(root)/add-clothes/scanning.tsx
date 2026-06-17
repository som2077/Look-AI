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
  IconMesh,
  IconLoader2,
  IconSparkles,
} from "@tabler/icons-react-native";

interface DetectChip {
  label: string;
  state: "done" | "progress" | "wait";
}

const CHIPS: DetectChip[] = [
  { label: "Item type", state: "done" },
  { label: "Color", state: "done" },
  { label: "Category...", state: "progress" },
  { label: "Style...", state: "progress" },
  { label: "Material...", state: "wait" },
];

interface DetectedAttribute {
  label: string;
  value: string;
  state: "done" | "progress";
}

const ATTRS: DetectedAttribute[] = [
  { label: "Type", value: "Top", state: "done" },
  { label: "Color", value: "Blue", state: "done" },
  { label: "Category", value: "Ethnic — Kurta", state: "progress" },
];

export default function AddClothesScanningScreen() {
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
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    progress.value = withTiming(0.85, {
      duration: 2400,
      easing: Easing.out(Easing.cubic),
    });
    spin.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );

    const t = setTimeout(() => {
      notifyRef.current();
      // Small delay so the chime is audible before unmount
      setTimeout(() => {
        router.replace({
          pathname: "/(root)/add-clothes/form",
          params: {
            mode: "scanned",
            photoUri: photoUri ?? "",
            name: "Blue kurta",
            category: "ethnic",
            color: "Blue",
          },
        } as never);
      }, 600);
    }, 3200);
    return () => clearTimeout(t);
  }, [router, photoUri, scan, progress, spin]);

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
        <View className="flex-row items-center gap-2 px-4 py-3 border-b border-[#1e1e1e]">
          <Animated.View style={spinStyle}>
            <IconLoader2 size={18} color="#534AB7" />
          </Animated.View>
          <Text className="text-white text-sm font-bold">
            Scanning your item...
          </Text>
        </View>

        <View className="flex-1 px-4 pt-4">
          {/* Photo with scan line */}
          <View
            className="rounded-2xl border border-[#1e1e1e] overflow-hidden items-center justify-center"
            style={{ height: 240, backgroundColor: "#141414" }}
          >
            {photoUri ? (
              <ExpoImage
                source={{ uri: photoUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory"
              />
            ) : (
              <IconMesh size={70} color="#2e2e2e" strokeWidth={1.5} />
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

          {/* Progress */}
          <View className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <Animated.View className="h-full bg-[#534AB7]" style={barStyle} />
          </View>
          <Text className="text-[#aaa] text-[10px] mt-1.5 mb-3">
            85% — analyzing item details
          </Text>

          {/* Detected attributes */}
          <View className="bg-[#141414] border border-[#1e1e1e] rounded-2xl p-3">
            <Text className="text-[#888] text-[10px] mb-2">
              AI detected so far:
            </Text>
            {ATTRS.map((a) => (
              <View
                key={a.label}
                className="flex-row items-center gap-2 py-1.5"
              >
                {a.state === "done" ? (
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
                <Text className="text-[#888] text-[11px]">{a.label}:</Text>
                <Text className="text-white text-[11px] font-semibold flex-1">
                  {a.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
