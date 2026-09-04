import { posthogAnalytics } from "@/shared/telemetry/posthog";
import { trackAiUsage } from "@/shared/telemetry/ai-usage";
import { captureFeatureError, addAppBreadcrumb } from "@/shared/telemetry/sentry";
import { useRevenueCat } from "@/features/payments/model/useRevenueCat";
import { useStreakSync } from "@/features/streaks/api/useStreakSync";
import { useStreakStore } from "@/features/streaks/model/useStreakStore";
import { StreakPopup } from "@/shared/ui/StreakPopup";
import { showToast } from "@/shared/ui/toast-store";
import { useSupabase } from "@/shared/supabase/use-supabase";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconHanger,
  IconPencil,
  IconShare,
  IconSparklesFilled,
  IconUser,
  IconCamera,
  IconPhoto,
  IconX,
  IconHelp,
  IconCloudUpload,
  IconHome,
  IconPlus,
} from "@tabler/icons-react-native";


import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { Image as ExpoImage } from "expo-image";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_PHRASES = [
  "Analyzing styling parameters...",
  "Synthesizing clothing geometry...",
  "Running diffusion models...",
  "Finalizing virtual try-on...",
];

// ─── Main Outfit Screen ───────────────────────────────────────────────────────

export default function OutfitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleDownload = async () => {
    try {
      if (!resultImageUrl) {
        Alert.alert("No Image", "Please generate an outfit first.");
        return;
      }
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to save the file to your gallery.",
        );
        return;
      }

      const filename = resultImageUrl.split("/").pop() || "outfit.jpg";
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadedFile = await FileSystem.downloadAsync(
        resultImageUrl,
        fileUri,
      );

      if (downloadedFile.uri) {
        await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
        setShowSuccessModal(true);
      }
    } catch (e) {
      captureFeatureError(e, 'virtual_try_on', 'download', 'unknown');
      showError("Failed to save.");
    }
  };

  const handleShare = async () => {
    try {
      if (!resultImageUrl) {
        Alert.alert("No Image", "Please generate an outfit first.");
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }

      const filename = resultImageUrl.split("/").pop() || "outfit.jpg";
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadedFile = await FileSystem.downloadAsync(
        resultImageUrl,
        fileUri,
      );

      if (downloadedFile.uri) {
        await Sharing.shareAsync(downloadedFile.uri);
      }
    } catch (e) {
      captureFeatureError(e, 'virtual_try_on', 'share', 'unknown');
      showError("Failed to share.");
    }
  };

  const { supabase } = useSupabase();
  const { isPro } = useRevenueCat();
  const { syncStreak } = useStreakSync();
  const { hasIncrementedToday, dismissIncrement, currentStreak } = useStreakStore();
  const [loading, setLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const showError = (msg: string) => {
    showToast("error", msg);
  };

  // Outfit States
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);


  // Toggles (assume user will wire UI later as they mentioned)
  const [garmentPhotoType] = useState<
    "model" | "flat-lay"
  >("model");
  const [garmentCategory] = useState<
    "tops" | "bottoms" | "footwear"
  >("tops");

  const handleSelectImage = (setImage: (uri: string) => void) => {
    Alert.alert("Select Image", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission needed", "Please grant camera permission.");
            return;
          }
          let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
          if (!result.canceled) {
            setImage(result.assets[0].uri);
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
          if (!result.canceled) {
            setImage(result.assets[0].uri);
          }
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  // Loading Phrase cycle
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingPhraseIndex(0);
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 300);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = useCallback(async () => {
    if (!isPro) {
      router.push("/(root)/(subscription)/subscription");
      return;
    }

    if (!personImage || !outfitImage) {
      Alert.alert(
        "Missing Images",
        "Please select both a person image and an outfit image.",
      );
      return;
    }

    addAppBreadcrumb('virtual_try_on', 'Started Virtual Try-On generation', { garmentCategory });
    setLoading(true);
    const startTime = Date.now();

    try {
      // 1. Helper function to upload image to Supabase Storage
      const uploadImage = async (uri: string, folder: string) => {
        const fileName = `${Date.now()}_${uri.split("/").pop()}`;
        const filePath = `${folder}/${fileName}`;

        // Read the local file as base64 to avoid React Native fetch Blob issues
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });
        const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

        const { error } = await supabase.storage
          .from("try-on-uploads")
          .upload(filePath, arrayBuffer, {
            contentType: "image/jpeg",
          });

        if (error) throw error;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("try-on-uploads")
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      };

      // 2. Upload both images
      const personImageUrl = await uploadImage(personImage, "person");
      const garmentImageUrl = await uploadImage(outfitImage, "garment");

      // 3. Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke(
        "virtual-try-on",
        {
          body: {
            person_image_url: personImageUrl,
            garment_image_url: garmentImageUrl,
            garment_photo_type: garmentPhotoType,
            garment_category: garmentCategory,
          },
        },
      );

      if (error) {
        throw new Error(error.message || "Failed to invoke edge function");
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.resultUrl) {
        setResultImageUrl(data.resultUrl);
        // Increment local streak + sync to Supabase DB
        syncStreak("virtual_try_on");
        posthogAnalytics.captureEvent('try_on_generation_completed', { duration_ms: Date.now() - startTime, success: true });
        // Track AI usage for the profile section (fire-and-forget).
        void trackAiUsage("virtual_try_on", {
          status: "completed",
          duration_ms: Date.now() - startTime,
        });
      } else {
        throw new Error("No result URL returned from AI");
      }
    } catch (e: any) {
      const durationMs = Date.now() - startTime;
      const isTimeout = e.message?.toLowerCase().includes('timeout');
      captureFeatureError(e, 'virtual_try_on', 'generation', isTimeout ? 'ai_timeout' : 'ai_generation_failed', { duration_ms: durationMs.toString() });
      Alert.alert(
        "Generation Failed",
        e.message || "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    personImage,
    outfitImage,
    garmentPhotoType,
    garmentCategory,
    supabase,
    isPro,
    router,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: "#9CA3AF" }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            paddingTop: 10,
            paddingBottom: 24,
            zIndex: 10,
          }}
        >
          <ExpoImage
            source={require("@/assets/images/getStartedLogo.png")}
            style={{ height: 44, width: 120, marginLeft: -12 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <View style={{ width: 64, height: 28, borderRadius: 14, backgroundColor: "#FFFFFF" }} />
        </View>

        {loading ? (
          /* Loading State */
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
            }}
          >
            <ActivityIndicator size="large" color="#4C36F5" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1D1A27",
                marginTop: 24,
              }}
            >
              AI Stylist is planning...
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#1D1A27",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {LOADING_PHRASES[loadingPhraseIndex]}
            </Text>
          </View>
        ) : resultImageUrl ? (
          /* Final Result State */
          <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 32,
                padding: 16,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginBottom: 16,
                  zIndex: 10,
                }}
              >
                <Pressable
                  onPress={handleShare}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#00000010",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconShare size={20} color="#000000" />
                </Pressable>
                <Pressable
                  onPress={handleDownload}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#00000010",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconDownload size={20} color="#000000" />
                </Pressable>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 24,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                  <ExpoImage
                    source={{ uri: resultImageUrl }}
                    style={{ flex: 1, width: "100%" }}
                    contentFit="cover"
                  />
              </View>
            </View>
            <Pressable
              onPress={() => setResultImageUrl(null)}
              style={{
                width: "100%",
                backgroundColor: "#1D1A27",
                borderRadius: 50,
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Go Back</Text>
            </Pressable>
          </View>
        ) : (
          /* Input Steps */
          <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
            {/* Person Card */}
            <Pressable
              onPress={() => handleSelectImage(setPersonImage)}
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 32,
                marginBottom: 12,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {personImage ? (
                <ExpoImage
                  source={{ uri: personImage }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ alignItems: "center", padding: 24 }}>
                  {/* Placeholder Illustration */}
                  <View style={{ width: 100, height: 130, marginBottom: 24, position: "relative" }}>
                    <View style={{ position: "absolute", top: 10, right: -10, width: "100%", height: "100%", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 20 }} />
                    <View style={{ position: "absolute", top: 5, right: -5, width: "100%", height: "100%", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 20 }} />
                    <View style={{ width: "100%", height: "100%", borderWidth: 1.5, borderColor: "#9CA3AF", borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                      <IconUser size={48} color="#9CA3AF" />
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27", marginBottom: 6 }}>
                    Upload Your Own Photo
                  </Text>
                  <Text style={{ fontSize: 14, color: "#4B5563" }}>
                    Select or take a photo to start
                  </Text>
                </View>
              )}
              
              {/* Plus Button */}
              {!personImage && (
                <View style={{ position: "absolute", bottom: 20, left: 0, right: 0, alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
                    <IconPlus size={20} color="#1D1A27" />
                  </View>
                </View>
              )}
            </Pressable>

            {/* Outfit Card */}
            <Pressable
              onPress={() => handleSelectImage(setOutfitImage)}
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 32,
                marginTop: 12,
                marginBottom: 24,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {outfitImage ? (
                <ExpoImage
                  source={{ uri: outfitImage }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ alignItems: "center", padding: 24 }}>
                  {/* Placeholder Illustration */}
                  <View style={{ width: 100, height: 130, marginBottom: 24, position: "relative" }}>
                    <View style={{ position: "absolute", top: 10, right: -10, width: "100%", height: "100%", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 20 }} />
                    <View style={{ position: "absolute", top: 5, right: -5, width: "100%", height: "100%", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 20 }} />
                    <View style={{ width: "100%", height: "100%", borderWidth: 1.5, borderColor: "#9CA3AF", borderRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                      <IconHanger size={48} color="#9CA3AF" />
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27", marginBottom: 6 }}>
                    Upload Your Outfit Image
                  </Text>
                  <Text style={{ fontSize: 14, color: "#4B5563" }}>
                    Upload or snap a photo to try on
                  </Text>
                </View>
              )}
              
              {/* Plus Button */}
              {!outfitImage && (
                <View style={{ position: "absolute", bottom: 20, left: 0, right: 0, alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}>
                    <IconPlus size={20} color="#1D1A27" />
                  </View>
                </View>
              )}
            </Pressable>

            {/* Bottom Actions */}
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Pressable
                onPress={() => router.replace("/(root)/(tabs)" as never)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#000000",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LottieView
                  source={require("@/assets/icons/home.json")}
                  autoPlay={false}
                  loop={false}
                  style={{ width: 28, height: 28 }}
                  colorFilters={[
                    {
                      keypath: "**",
                      color: "#FFFFFF",
                    },
                  ]}
                />
              </Pressable>
              
              <Pressable
                onPress={() => {
                  if (personImage && outfitImage) {
                    handleGenerate();
                  } else {
                    Alert.alert("Missing Images", "Please upload both your photo and outfit.");
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#000000",
                  borderRadius: 28,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <IconSparklesFilled size={20} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>
                  Generated Try On
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 32,
                alignItems: "center",
                width: "100%",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#E8F5E9",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <IconCheck size={32} color="#4CAF50" />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#1D1A27",
                  marginBottom: 8,
                }}
              >
                Success!
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#9B9BAF",
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Image successfully saved to your gallery.
              </Text>

              <Pressable
                onPress={() => setShowSuccessModal(false)}
                style={{
                  backgroundColor: "#1D1A27",
                  borderRadius: 50,
                  width: "100%",
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  OK
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
      <StreakPopup
        visible={hasIncrementedToday}
        onClose={dismissIncrement}
        streakCount={currentStreak}
      />
    </View>
  );
}
