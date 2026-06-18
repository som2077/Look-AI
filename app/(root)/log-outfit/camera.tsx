import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as NavigationBar from "expo-navigation-bar"; // ✅
import { useOutfitAnalysisStore } from "@/backend/store/outfit-analysis-store";
import {
  IconBolt,
  IconPhoto,
  IconUser,
  IconX,
  IconScan,
  IconBarcode,
  IconTag,
  IconShirt,
} from "@tabler/icons-react-native";

const BRACKET_SIZE = 36;
const BRACKET_THICKNESS = 3;
const BRACKET_COLOR = "rgba(255,255,255,0.90)";
const CORNER_RADIUS = 10;

function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const isTop = position.startsWith("t");
  const isLeft = position.endsWith("l");

  return (
    <View
      style={{
        position: "absolute",
        width: BRACKET_SIZE,
        height: BRACKET_SIZE,
        ...(isTop ? { top: 0 } : { bottom: 0 }),
        ...(isLeft ? { left: 0 } : { right: 0 }),
        // Two-sided border with rounded outer corner
        borderTopWidth: isTop ? BRACKET_THICKNESS : 0,
        borderBottomWidth: !isTop ? BRACKET_THICKNESS : 0,
        borderLeftWidth: isLeft ? BRACKET_THICKNESS : 0,
        borderRightWidth: !isLeft ? BRACKET_THICKNESS : 0,
        borderTopLeftRadius: position === "tl" ? CORNER_RADIUS : 0,
        borderTopRightRadius: position === "tr" ? CORNER_RADIUS : 0,
        borderBottomLeftRadius: position === "bl" ? CORNER_RADIUS : 0,
        borderBottomRightRadius: position === "br" ? CORNER_RADIUS : 0,
        borderColor: BRACKET_COLOR,
      }}
    />
  );
}

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [capturing, setCapturing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [activeMode, setActiveMode] = useState("scan-cloth");
  const insets = useSafeAreaInsets();

  const SCAN_MODES = [
    { id: "scan-cloth", label: "Scan Cloth", icon: IconScan },
    { id: "barcode", label: "Barcode", icon: IconBarcode },
    { id: "cloth-label", label: "Cloth Label", icon: IconTag },
    { id: "fit-check", label: "Fit Check", icon: IconShirt },
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
      useOutfitAnalysisStore.getState().startAnalysis(uri);
      router.replace("/(root)/(tabs)" as never);
    },
    [router],
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
      <View className="flex-1 bg-[#0c0c0c]">
        <StatusBar style="light" />
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <View className="h-16 w-16 rounded-full bg-[#c9a84c]/15 items-center justify-center mb-5">
            <IconUser size={32} color="#c9a84c" />
          </View>
          <Text className="text-white text-lg font-bold text-center mb-2">
            Camera access needed
          </Text>
          <Text className="text-[#888] text-xs text-center mb-6">
            Look AI needs your camera to capture and log your outfits.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-[#c9a84c] rounded-xl px-6 py-3"
          >
            <Text className="text-[#1a1400] font-bold text-sm">
              Grant permission
            </Text>
          </Pressable>
          <Pressable onPress={handleBack} className="mt-4 py-2">
            <Text className="text-[#888] text-xs">Cancel</Text>
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
          <View className="flex-row justify-center px-4 mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SCAN_MODES.map((mode) => {
                const isActive = activeMode === mode.id;
                const IconComponent = mode.icon;
                return (
                  <Pressable
                    key={mode.id}
                    onPress={() => setActiveMode(mode.id)}
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
          <View className="flex-row items-center justify-between px-8">
            <Pressable
              onPress={handlePickGallery}
              className="items-center justify-center"
            >
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-black/40 mb-1 border border-white/20">
                <IconPhoto size={22} color="#FFFFFF" strokeWidth={1.5} />
              </View>
              <Text className="text-white/80 text-[10px] font-medium">From Gallery</Text>
            </Pressable>

            <Pressable
              onPress={handleShutter}
              disabled={capturing}
              className="h-[76px] w-[76px] rounded-full border-[3px] border-white items-center justify-center"
            >
              {capturing ? (
                <ActivityIndicator color="#111" />
              ) : (
                <View className="h-[62px] w-[62px] rounded-full bg-white" />
              )}
            </Pressable>

            <Pressable
              onPress={() => setFlashOn((f) => !f)}
              className="h-10 w-10 items-center justify-center bg-black/40 rounded-full border border-white/20"
            >
              <IconBolt
                size={20}
                color={flashOn ? "#c9a84c" : "#ffffff"}
                strokeWidth={1.5}
              />
            </Pressable>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}
