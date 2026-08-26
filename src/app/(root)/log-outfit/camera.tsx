import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import {
  IconBolt,
  IconCameraSpark,
  IconPhoto,
  IconScan,
  IconShirt,
  IconTag,
  IconX,
} from "@tabler/icons-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as NavigationBar from "expo-navigation-bar"; // ✅
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import Svg, { Path } from "react-native-svg";

const BRACKET_SIZE = 56;
const BRACKET_THICKNESS = 6;
const BRACKET_COLOR = "#FFFFFF";

function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const isTop = position.startsWith("t");
  const isLeft = position.endsWith("l");

  let rotate = "0deg";
  if (position === "tr") rotate = "90deg";
  if (position === "br") rotate = "180deg";
  if (position === "bl") rotate = "-90deg";

  return (
    <View
      style={{
        position: "absolute",
        width: BRACKET_SIZE,
        height: BRACKET_SIZE,
        ...(isTop ? { top: -2 } : { bottom: -2 }),
        ...(isLeft ? { left: -2 } : { right: -2 }),
      }}
    >
      <Svg
        width={BRACKET_SIZE}
        height={BRACKET_SIZE}
        viewBox="0 0 56 56"
        style={{ transform: [{ rotate }] }}
      >
        <Path
          d="M 3 53 L 3 23 A 20 20 0 0 1 23 3 L 53 3"
          stroke={BRACKET_COLOR}
          strokeWidth={BRACKET_THICKNESS}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<"back" | "front">("back");
  const [capturing, setCapturing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [activeMode, setActiveMode] = useState("scan-cloth");
  const insets = useSafeAreaInsets();

  const SCAN_MODES = [
    { id: "scan-cloth", label: "Scan Cloth", icon: IconScan },
    { id: "label", label: "Cloth Label", icon: IconTag },
    { id: "fit-check", label: "Fit Check", icon: IconShirt },
    { id: "gallery", label: "Library", icon: IconPhoto },
  ];

  // ✅ Camera screen pe navigation bar black, wapas jaane pe restore
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("#000000");
    NavigationBar.setButtonStyleAsync("light");

    return () => {
      // Screen se bahar jaane pe transparent restore karo
      NavigationBar.setBackgroundColorAsync("transparent");
    };
  }, []);

  const goToAnalyzing = useCallback(
    (uri: string) => {
      useOutfitAnalysisStore.getState().startAnalysis(uri, activeMode);
      // Directly go to the home screen to show the analyzing banner
      router.replace("/(root)/(tabs)" as never);
    },
    [router, activeMode],
  );

  const handleShutter = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      if (photo?.uri) goToAnalyzing(photo.uri);
    } catch (e) {
      console.warn("Camera capture failed", e);
    } finally {
      setCapturing(false);
    }
  }, [capturing, goToAnalyzing]);

  const handlePickGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      goToAnalyzing(result.assets[0].uri);
    }
  }, [goToAnalyzing]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(root)/(tabs)" as never);
  }, [router]);

  const handleInfo = useCallback(() => {
    router.push("/(root)/log-outfit/info" as never);
  }, [router]);

  if (!permission) {
    return (
      <View className="flex-1 bg-[#0c0c0c] items-center justify-center">
        <ActivityIndicator color="#c9a84c" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#000000]">
        <StatusBar style="light" />
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <View className="h-20 w-20 rounded-full bg-[#FFFFFF] items-center justify-center mb-2">
            <IconCameraSpark size={35} color="#000000" />
          </View>
          <Text className="text-white text-lg font-bold text-center mb-2">
            Camera access needed
          </Text>
          <Text className="text-[#888] text-sm text-center mb-4 px-7">
            We need camera access so AI can scan your clothes and give you
            instant styling feedback.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-[#ffffff] rounded-xl px-6 py-3"
          >
            <Text className="text-[#1a1400] font-bold text-sm">
              Grant permission
            </Text>
          </Pressable>
          <Pressable onPress={handleBack} className="mt-4 py-2 ">
            <Text className="text-[#ffffff] text-sm">Cancel</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0c0c0c]">
      <StatusBar style="light" />

      {/* Live camera — full screen */}
      <CameraView
        key={facing}
        ref={cameraRef}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        facing={facing}
        flash={flashOn ? "on" : "off"}
        enableTorch={flashOn}
      />

      {/* Subtle vignette */}
      <View pointerEvents="none" className="absolute inset-0 bg-black/20" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-3">
          <Pressable
            onPress={handleBack}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <IconX size={18} color="#ffffff" strokeWidth={2} />
          </Pressable>

          <Pressable
            onPress={handleInfo}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <Text className="text-white text-lg font-bold">?</Text>
          </Pressable>
        </View>

        {/* Framing guide */}
        <View className="flex-1 items-center justify-center px-12">
          <View
            style={{
              width: "100%",
              aspectRatio: 1,
              position: "relative",
              borderRadius: 20,
            }}
          >
            <CornerBracket position="tl" />
            <CornerBracket position="tr" />
            <CornerBracket position="bl" />
            <CornerBracket position="br" />
          </View>
        </View>

        {/* Bottom Area (Modes + Controls) */}
        <View style={{ paddingBottom: insets.bottom + 20 }}>
          {/* Scan Modes Row */}
          <View className="flex-row items-center justify-center px-10 mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, alignItems: "center" }}
            >
              {SCAN_MODES.map((mode) => {
                const isActive = activeMode === mode.id;
                const IconComponent = mode.icon;
                return (
                  <Pressable
                    key={mode.id}
                    onPress={() => {
                      if (mode.id === "gallery") {
                        handlePickGallery();
                      } else {
                        setActiveMode(mode.id);
                      }
                    }}
                    style={{
                      backgroundColor: isActive ? "#FFFFFF" : "rgba(0,0,0,0.5)",
                      borderRadius: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: isActive ? 0 : 1,
                      borderColor: "rgba(255,255,255,0.2)",
                      minWidth: 80,
                    }}
                  >
                    <IconComponent
                      size={24}
                      color={isActive ? "#000000" : "#FFFFFF"}
                      strokeWidth={1.5}
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={{
                        color: isActive ? "#000000" : "#FFFFFF",
                        fontSize: 11,
                        fontWeight: isActive ? "600" : "400",
                        textAlign: "center",
                      }}
                    >
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Bottom Controls Row */}
          <View className="flex-row items-center justify-center px-8 relative h-[76px]">
            <Pressable
              onPress={() => setFlashOn((f) => !f)}
              className="absolute left-10 h-12 w-12 items-center justify-center bg-[#1D1A27] rounded-full"
            >
              <IconBolt
                size={22}
                color={flashOn ? "#c9a84c" : "#ffffff"}
                strokeWidth={1.5}
              />
            </Pressable>

            <Pressable
              onPress={handleShutter}
              disabled={capturing}
              className="h-[76px] w-[76px] rounded-full border-[4px] border-[#313131] items-center justify-center"
            >
              {capturing ? (
                <ActivityIndicator color="#111" />
              ) : (
                <View className="h-[62px] w-[62px] rounded-full bg-white" />
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
