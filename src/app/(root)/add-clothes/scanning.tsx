import { analyzeClothingImage } from "@/features/scanning/api/gemini-vision";
import { useAnalysisCompleteNotification } from "@/shared/notifications/notification-service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Step messages ──────────────────────────────────────────────────────────────
const STEPS = [
  "Reading fabric details...",
  "Identifying color palette...",
  "Detecting category & fit...",
  "Suggesting matching outfits...",
  "Almost done!",
];

export default function AddClothesScanningScreen() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const notifyComplete = useAnalysisCompleteNotification();
  const notifyRef = useRef(notifyComplete);
  notifyRef.current = notifyComplete;

  const [stepIndex, setStepIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // Spinner animation
  const spin = useSharedValue(0);
  const pulse = useSharedValue(1);
  // Overlay scan line
  const scanLine = useSharedValue(0);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.05], [0.6, 0.15]),
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scanLine.value, [0, 1], [0, SCREEN_W * 0.72]),
      },
    ],
  }));

  useEffect(() => {
    // Start spinner
    spin.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
    // Pulse glow ring
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // Scan line sweep
    scanLine.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  // Cycle through step messages every 1.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Run Gemini analysis
  useEffect(() => {
    if (!photoUri) return;

    const run = async () => {
      setIsAnalyzing(true);
      const result = await analyzeClothingImage(photoUri);
      setIsAnalyzing(false);

      // Minimum display time so the animation feels premium
      const minDelay = 6000;
      const elapsed = Date.now();

      const remaining = Math.max(0, minDelay - (Date.now() - elapsed));
      setTimeout(() => {
        notifyRef.current();
        setTimeout(() => {
          router.replace({
            pathname: "/(root)/add-clothes/form",
            params: {
              mode: "scanned",
              photoUri: photoUri ?? "",
              name: result?.name ?? "",
              category: result?.category ?? "top",
              color: result?.color ?? "",
              colorHex: result?.colorHex ?? "",
              occasion: result?.occasion ?? "Casual",
              season: result?.season ?? "All",
              matchingColors: JSON.stringify(result?.matchingColors ?? []),
              brand: result?.brand ?? "",
              careInstructions: result?.careInstructions ?? "",
              notes: result?.notes ?? "",
            },
          } as never);
        }, 500);
      }, remaining + 1000);
    };

    run();
  }, [photoUri]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E15" }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* ── Title ── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 26,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            AI is analyzing{"\n"}your item ✨
          </Text>
          <Text style={{ color: "#888", fontSize: 14, marginTop: 6 }}>
            Powered by Gemini Vision
          </Text>
        </Animated.View>

        {/* ── Photo with Scan Overlay ── */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={{
            marginHorizontal: 24,
            borderRadius: 28,
            overflow: "hidden",
            height: SCREEN_W * 0.75,
            backgroundColor: "#1A1827",
          }}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: "#1A1827",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#555", fontSize: 14 }}>No image</Text>
            </View>
          )}

          {/* Dark overlay */}
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          />

          {/* Pulsing glow ring */}
          <Animated.View
            style={[
              pulseStyle,
              {
                position: "absolute",
                inset: 0,
                borderRadius: 28,
                borderWidth: 3,
                borderColor: "#7C6AFF",
              },
            ]}
          />

          {/* Animated scan line */}
          <Animated.View
            style={[
              scanLineStyle,
              {
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 2,
                backgroundColor: "rgba(124,106,255,0.8)",
                shadowColor: "#7C6AFF",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}
          />

          {/* Corner brackets */}
          {[
            { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3 },
            { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3 },
            { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3 },
            {
              bottom: 16,
              right: 16,
              borderBottomWidth: 3,
              borderRightWidth: 3,
            },
          ].map((style, i) => (
            <View
              key={i}
              style={[
                {
                  position: "absolute",
                  width: 28,
                  height: 28,
                  borderColor: "#7C6AFF",
                  borderRadius: 4,
                },
                style,
              ]}
            />
          ))}

          {/* AI badge */}
          <View
            style={{
              position: "absolute",
              top: 12,
              alignSelf: "center",
              backgroundColor: "rgba(124,106,255,0.9)",
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Animated.View style={spinStyle}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  borderWidth: 2,
                  borderColor: "white",
                  borderTopColor: "transparent",
                }}
              />
            </Animated.View>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
              SCANNING
            </Text>
          </View>
        </Animated.View>

        {/* ── Step indicator ── */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={{ paddingHorizontal: 24, paddingTop: 28 }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 16,
            }}
          >
            {STEPS[stepIndex]}
          </Text>

          {/* Progress dots */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {STEPS.map((_, i) => (
              <Animated.View
                key={i}
                style={{
                  height: 4,
                  flex: i <= stepIndex ? 2 : 1,
                  borderRadius: 999,
                  backgroundColor: i <= stepIndex ? "#7C6AFF" : "#2A2840",
                  overflow: "hidden",
                }}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Feature tags being detected ── */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          style={{
            paddingHorizontal: 24,
            paddingTop: 24,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {["Category", "Color", "Occasion", "Season", "Matching Colors"].map(
            (tag, i) => (
              <View
                key={tag}
                style={{
                  backgroundColor: i <= stepIndex ? "#7C6AFF22" : "#1A1827",
                  borderWidth: 1,
                  borderColor: i <= stepIndex ? "#7C6AFF" : "#2A2840",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i <= stepIndex ? "#7C6AFF" : "#444",
                  }}
                />
                <Text
                  style={{
                    color: i <= stepIndex ? "#7C6AFF" : "#555",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {tag}
                </Text>
                {i < stepIndex && (
                  <Text style={{ color: "#7C6AFF", fontSize: 11 }}>✓</Text>
                )}
              </View>
            ),
          )}
        </Animated.View>

        {/* ── Bottom note ── */}
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            paddingBottom: 32,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#555", fontSize: 13, textAlign: "center" }}>
            This usually takes 5–8 seconds
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
