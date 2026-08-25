import { usePremiumLimits } from "@/features/payments/model/usePremiumLimits";
import {
  IconBolt,
  IconCamera,
  IconPhoto,
  IconPhotoScan,
  IconShirt,
  IconTag,
  IconX,
} from "@tabler/icons-react-native";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureFeatureError, addAppBreadcrumb } from "@/shared/telemetry/sentry";
import { posthogAnalytics } from "@/shared/telemetry/posthog";
import Svg, { Path } from "react-native-svg";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanMode = "scan-cloth" | "label" | "fit-check" | "gallery";

interface ModeConfig {
  id: ScanMode;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  hint: string;
  frameStyle: "square" | "portrait" | "fullbody";
}

// ─── Mode definitions ─────────────────────────────────────────────────────────

const MODES: ModeConfig[] = [
  {
    id: "scan-cloth",
    label: "Scan Cloth",
    Icon: IconShirt,
    hint: "Point at a clothing item",
    frameStyle: "square",
  },

  {
    id: "label",
    label: "Cloth Label",
    Icon: IconTag,
    hint: "Capture the care label",
    frameStyle: "portrait",
  },
  {
    id: "fit-check",
    label: "Fit Check",
    Icon: IconPhotoScan,
    hint: "Stand back for a full-body shot",
    frameStyle: "fullbody",
  },
  {
    id: "gallery",
    label: "Library",
    Icon: IconPhoto,
    hint: "Pick from your gallery",
    frameStyle: "square",
  },
];

// ─── Frame guide dimensions ───────────────────────────────────────────────────

function getFrameDimensions(style: ModeConfig["frameStyle"]): {
  w: number;
  h: number;
} {
  switch (style) {
    case "portrait":
      return { w: 260, h: 340 };
    case "fullbody":
      return { w: 240, h: 400 };
    default:
      return { w: 300, h: 300 };
  }
}

// ─── Corner bracket SVG ───────────────────────────────────────────────────────

function CornerBracket({ rotate }: { rotate: string }) {
  return (
    <Svg
      width={56}
      height={56}
      viewBox="0 0 56 56"
      style={{ transform: [{ rotate }] }}
    >
      <Path
        d="M 3 53 L 3 23 A 20 20 0 0 1 23 3 L 53 3"
        stroke="#ffffff"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// ─── Frame Guide component ────────────────────────────────────────────────────

function FrameGuide({ mode }: { mode: ModeConfig }) {
  const { w, h } = getFrameDimensions(mode.frameStyle);
  return (
    <View style={{ width: w, height: h, position: "relative" }}>
      <View style={{ position: "absolute", top: -2, left: -2 }}>
        <CornerBracket rotate="0deg" />
      </View>
      <View style={{ position: "absolute", top: -2, right: -2 }}>
        <CornerBracket rotate="90deg" />
      </View>
      <View style={{ position: "absolute", bottom: -2, left: -2 }}>
        <CornerBracket rotate="-90deg" />
      </View>
      <View style={{ position: "absolute", bottom: -2, right: -2 }}>
        <CornerBracket rotate="180deg" />
      </View>
      {/* Hint text inside frame */}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 5,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "500" }}>
            {mode.hint}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Camera Screen ───────────────────────────────────────────────────────

export default function AddClothesCameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const {
    canAddWardrobe,
    canAddClothLabel,
    canAddFitCheck,
    handleLimitReached,
  } = usePremiumLimits();
  const [capturing, setCapturing] = useState(false);
  const [activeMode, setActiveMode] = useState<ScanMode>("scan-cloth");

  const currentMode = MODES.find((m) => m.id === activeMode) ?? MODES[0];

  // ── Navigation helpers ──────────────────────────────────────────────────────

  const navigateToResult = useCallback(
    (uri: string | string[], mode: ScanMode) => {
      const firstUri = Array.isArray(uri) ? uri[0] : uri;
      const remainingUris =
        Array.isArray(uri) && uri.length > 1
          ? JSON.stringify(uri.slice(1))
          : undefined;

      switch (mode) {
        case "scan-cloth":
          router.push({
            pathname: "/(root)/add-clothes/scan-result",
            params: { photoUri: firstUri, remainingUris, mode: "cloth" },
          } as never);
          break;

        case "label":
          import("@/features/ai-styling/model/outfit-analysis-store").then(
            ({ useOutfitAnalysisStore }) => {
              useOutfitAnalysisStore.getState().startAnalysis(firstUri, mode);
              router.replace("/(root)/(tabs)" as never);
            },
          );
          break;
        case "fit-check":
          import("@/features/ai-styling/model/outfit-analysis-store").then(
            ({ useOutfitAnalysisStore }) => {
              useOutfitAnalysisStore.getState().startAnalysis(firstUri, mode);
              router.replace("/(root)/(tabs)" as never);
            },
          );
          break;
        default:
          break;
      }
    },
    [router],
  );

  // ── Capture photo ───────────────────────────────────────────────────────────

  const handleShutter = useCallback(async () => {
    if (activeMode === "gallery") {
      // Gallery mode acts like "scan-cloth" when opened from the carousel
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        orderedSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (result.assets.length === 1) {
          navigateToResult([result.assets[0].uri], "scan-cloth");
        } else {
          router.push({
            pathname: "/(root)/add-clothes/batch-scan",
            params: {
              uris: JSON.stringify(result.assets.map((a) => a.uri)),
              mode: "cloth",
            },
          } as never);
        }
      }
      return;
    }

    if (!cameraRef.current || capturing) return;

    // Check limits before capturing
    if (activeMode === "scan-cloth" && !canAddWardrobe) {
      handleLimitReached("wardrobe");
      return;
    }
    if (activeMode === "label" && !canAddClothLabel) {
      handleLimitReached("cloth_label");
      return;
    }
    if (activeMode === "fit-check" && !canAddFitCheck) {
      handleLimitReached("fit_check");
      return;
    }

    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      if (photo?.uri) navigateToResult(photo.uri, activeMode);
    } catch (e) {
      captureFeatureError(e, 'scan_and_add', 'capture', 'unknown', { active_mode: activeMode });
    } finally {
      setCapturing(false);
    }
  }, [
    activeMode,
    capturing,
    navigateToResult,
    canAddWardrobe,
    canAddClothLabel,
    canAddFitCheck,
    handleLimitReached,
  ]);

  // ── Gallery picker for each mode ────────────────────────────────────────────

  const handleGallery = useCallback(async () => {
    let uris: string[] = [];
    const isMultiple = activeMode === "scan-cloth";

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: isMultiple,
      selectionLimit: isMultiple ? 5 : 1,
      orderedSelection: true,
    });
    if (!result.canceled && result.assets) {
      uris = result.assets.map((a) => a.uri);
    }

    if (uris.length > 0) {
      if (activeMode === "scan-cloth" && !canAddWardrobe) {
        handleLimitReached("wardrobe");
        return;
      }
      if (activeMode === "label" && !canAddClothLabel) {
        handleLimitReached("cloth_label");
        return;
      }
      if (activeMode === "fit-check" && !canAddFitCheck) {
        handleLimitReached("fit_check");
        return;
      }

      if (activeMode === "scan-cloth" && uris.length > 1) {
        router.push({
          pathname: "/(root)/add-clothes/batch-scan",
          params: { uris: JSON.stringify(uris), mode: "cloth" },
        } as never);
      } else {
        navigateToResult(uris, activeMode);
      }
    }
  }, [
    activeMode,
    router,
    navigateToResult,
    canAddClothLabel,
    canAddFitCheck,
    handleLimitReached,
  ]);

  // ── Mode change ─────────────────────────────────────────────────────────────

  const handleModeChange = useCallback(
    (mode: ScanMode) => {
      setActiveMode(mode);
      if (mode === "gallery") {
        // Immediately open gallery
        const pickGallery = async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            orderedSelection: true,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            if (result.assets.length === 1) {
              navigateToResult([result.assets[0].uri], "scan-cloth");
            } else {
              router.push({
                pathname: "/(root)/add-clothes/batch-scan",
                params: {
                  uris: JSON.stringify(result.assets.map((a) => a.uri)),
                  mode: "cloth",
                },
              } as never);
            }
          } else {
            setActiveMode("scan-cloth");
          }
        };
        pickGallery();
      }
    },
    [router, navigateToResult],
  );

  const toggleFacing = useCallback(() => {
    setFacing((f) => (f === "back" ? "front" : "back"));
  }, []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  // ── Permission screens ──────────────────────────────────────────────────────

  if (!permission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0c0c0c",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#7C6AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0c0c0c" }}>
        <StatusBar style="light" />
        <SafeAreaView
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#7C6AFF22",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <IconCamera size={32} color="#7C6AFF" />
          </View>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Camera access needed
          </Text>
          <Text
            style={{
              color: "#888",
              fontSize: 13,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Look AI needs your camera to scan clothing items.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={{
              backgroundColor: "#7C6AFF",
              borderRadius: 16,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
              Grant Permission
            </Text>
          </Pressable>
          <Pressable onPress={handleBack} style={{ marginTop: 16, padding: 8 }}>
            <Text style={{ color: "#888", fontSize: 13 }}>Cancel</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // ── Main camera UI ──────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: "#0c0c0c" }}>
      <StatusBar style="light" />

      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        facing={facing}
      />

      {/* Dark overlay */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <Pressable
            onPress={handleBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconX size={20} color="#FFFFFF" />
          </Pressable>

          {/* Active mode label */}
          <View
            style={{
              backgroundColor: "rgba(124,106,255,0.85)",
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
              {currentMode.label}
            </Text>
          </View>

          <Pressable
            onPress={toggleFacing}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBolt size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Viewfinder */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          {activeMode !== "gallery" && <FrameGuide mode={currentMode} />}
          {activeMode === "gallery" && (
            <View style={{ alignItems: "center" }}>
              <IconPhoto size={64} color="rgba(255,255,255,0.3)" />
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 12,
                  fontSize: 14,
                }}
              >
                Tap below to pick from gallery
              </Text>
            </View>
          )}
        </View>

        {/* Mode selector strip */}
        <View style={{ paddingBottom: 8 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {MODES.map((mode) => {
              const active = activeMode === mode.id;
              const ModeIcon = mode.Icon;
              return (
                <Pressable
                  key={mode.id}
                  onPress={() => handleModeChange(mode.id)}
                  style={{
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 16,
                    backgroundColor: active
                      ? "rgba(124,106,255,0.2)"
                      : "transparent",
                    borderWidth: active ? 1 : 0,
                    borderColor: "#7C6AFF",
                  }}
                >
                  <ModeIcon
                    size={22}
                    color={active ? "#7C6AFF" : "rgba(255,255,255,0.6)"}
                  />
                  <Text
                    style={{
                      color: active ? "#7C6AFF" : "rgba(255,255,255,0.6)",
                      fontSize: 11,
                      fontWeight: active ? "700" : "500",
                    }}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Bottom controls */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
            paddingBottom: 48,
            paddingTop: 8,
            position: "relative",
            height: 76,
          }}
        >
          {/* Flash / Toggle */}
          <Pressable
            onPress={toggleFacing}
            style={{
              position: "absolute",
              left: 40,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#1D1A27",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBolt size={22} color="#FFFFFF" />
          </Pressable>

          {/* Shutter */}
          <Pressable
            onPress={handleShutter}
            disabled={capturing}
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              borderWidth: 4,
              borderColor: "#313131",
              alignItems: "center",
              justifyContent: "center",
              opacity: capturing ? 0.6 : 1,
            }}
          >
            {capturing ? (
              <ActivityIndicator color="#0c0c0c" />
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "#FFFFFF",
                }}
              />
            )}
          </Pressable>

          {/* Gallery Button */}
          {activeMode !== "gallery" && (
            <Pressable
              onPress={handleGallery}
              style={{
                position: "absolute",
                right: 40,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#1D1A27",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconPhoto size={22} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
