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
} from "@tabler/icons-react-native";
import { decode } from "base64-arraybuffer";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
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
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";

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
      console.error(e);
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
      console.error(e);
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

  // Pager State
  const [activeStep, setActiveStep] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  // Toggles (assume user will wire UI later as they mentioned)
  const [garmentPhotoType] = useState<
    "model" | "flat-lay"
  >("model");
  const [garmentCategory] = useState<
    "tops" | "bottoms" | "footwear"
  >("tops");

  const pickImage = async (setImage: (uri: string) => void) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
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

    setLoading(true);

    try {
      // 1. Helper function to upload image to Supabase Storage
      const uploadImage = async (uri: string, folder: string) => {
        const fileName = `${Date.now()}_${uri.split("/").pop()}`;
        const filePath = `${folder}/${fileName}`;

        // Read the local file as base64 to avoid React Native fetch Blob issues
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });
        const arrayBuffer = decode(base64);

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
      } else {
        throw new Error("No result URL returned from AI");
      }
    } catch (e: any) {
      console.error("Virtual Try-On Error:", e);
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
    <View style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            paddingTop: 10,
            paddingBottom: 16,
          }}
        >
          {resultImageUrl || loading ? (
            <View style={{ width: 24 }} />
          ) : (
            <Pressable onPress={() => router.replace("/")}>
              <IconArrowLeft size={24} color="#1D1A27" />
            </Pressable>
          )}
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#1D1A27" }}>
            Virtual Try-On
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          /* Loading State screen */
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
                color: "#9B9BAF",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {LOADING_PHRASES[loadingPhraseIndex]}
            </Text>
          </View>
        ) : resultImageUrl ? (
          /* Final Result State */
          <View style={{ flex: 1, paddingHorizontal: 24, marginBottom: 10 }}>
            <Text
              style={{
                fontSize: 15,
                color: "#666666",
                textAlign: "center",
                lineHeight: 22,
                fontWeight: "400",
                // textAlign: "center",
                marginTop: 20,
                marginBottom: 30,
                // lineHeight: 26,
              }}
            >
              Seamlessly merge your digital identity with haute couture using
              our high-fidelity generative engine
            </Text>

            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 32,
                padding: 16,
                overflow: "hidden",
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
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {resultImageUrl === "mock_video" ? (
                  <>
                    <View style={{ flex: 1, width: "100%" }}>
                      <Video
                        source={require("../../../../assets/final.webm")}
                        style={{ width: "100%", height: "90%" }}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isMuted
                        isLooping
                      />
                    </View>
                    <Text
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#9CA3AF",
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      Your merged try-on image will appear here after
                      generation.
                    </Text>
                  </>
                ) : (
                  <Image
                    source={{ uri: resultImageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>

            <View style={{ paddingVertical: 20 }}>
              <Pressable
                onPress={() => setResultImageUrl(null)}
                style={{
                  width: "100%",
                  backgroundColor: "#1C1C1C",
                  borderRadius: 50,
                  paddingVertical: 18,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconArrowLeft size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ) : (
          /* Input Steps */
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 24 }}>
              <Text
                style={{
                  fontSize: 15,
                  color: "#666666",
                  textAlign: "center",
                  lineHeight: 22,
                  marginTop: 10,
                  marginBottom: 30,
                  fontWeight: "400",
                }}
              >
                Elevate your personal style through AI-powered vision. Visualize
                our high-fashion pieces tailored specifically to your
                silhouette.
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#1C1C1C",
                    flex: 1,
                  }}
                >
                  Swipe left or right to select your person and clothing images.
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginLeft: 16 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: activeStep === 0 ? "#000000" : "#999999",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      1
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: activeStep === 1 ? "#000000" : "#999999",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      2
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <PagerView
              style={{ flex: 1 }}
              initialPage={0}
              ref={pagerRef}
              onPageSelected={(e) => setActiveStep(e.nativeEvent.position)}
            >
              {/* Step 1: Person Image */}
              <View key="0" style={{ flex: 1, paddingHorizontal: 24 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 32,
                    overflow: "hidden",
                  }}
                >
                  {personImage ? (
                    <Image
                      source={{ uri: personImage }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#FFFFFF",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconUser size={64} color="#000000" />
                      <Text
                        style={{
                          marginTop: 16,
                          fontSize: 18,
                          fontWeight: "700",
                          color: "#000000",
                        }}
                      >
                        Select Your Photo
                      </Text>
                      <Text
                        style={{ marginTop: 8, fontSize: 14, color: "#9CA3AF" }}
                      >
                        Tap to choose from gallery
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={() => pickImage(setPersonImage)}
                    style={{
                      position: "absolute",
                      bottom: 20,
                      right: 20,
                      width: 40,
                      height: 40,
                      borderRadius: 24,
                      backgroundColor: "#000000",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconPencil size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              {/* Step 2: Garment Image */}
              <View key="1" style={{ flex: 1, paddingHorizontal: 24 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#E5E5E5",
                    borderRadius: 32,
                    overflow: "hidden",
                  }}
                >
                  {outfitImage ? (
                    <Image
                      source={{ uri: outfitImage }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#FFFFFF",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconHanger size={64} color="#000000" />
                      <Text
                        style={{
                          marginTop: 16,
                          fontSize: 18,
                          fontWeight: "700",
                          color: "#000000",
                        }}
                      >
                        Select Outfit
                      </Text>
                      <Text
                        style={{ marginTop: 8, fontSize: 14, color: "#9CA3AF" }}
                      >
                        Tap to choose from gallery
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={() => pickImage(setOutfitImage)}
                    style={{
                      position: "absolute",
                      bottom: 20,
                      right: 20,
                      width: 40,
                      height: 40,
                      borderRadius: 24,
                      backgroundColor: "#000000",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconPencil size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </PagerView>

            {/* Bottom Actions */}
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 24,
                paddingVertical: 30,
                gap: 12,
              }}
            >
              <Pressable
                disabled={!personImage || !outfitImage}
                onPress={handleGenerate}
                style={{
                  flex: 1,
                  backgroundColor:
                    !personImage || !outfitImage ? "#4A4A4A" : "#1C1C1C",
                  borderRadius: 50,
                  paddingVertical: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <IconSparklesFilled size={20} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#FFFFFF",
                  }}
                >
                  Generate Try-On
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  // Bypass to test the Final Result State UI with local video
                  setResultImageUrl("mock_video");
                }}
                style={{
                  width: 60,
                  backgroundColor: "#1C1C1C",
                  borderRadius: 30,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconArrowRight size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Success Modal */}
        <Modal
          transparent={true}
          visible={showSuccessModal}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
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

      </SafeAreaView>
      <StreakPopup
        visible={hasIncrementedToday}
        onClose={dismissIncrement}
        streakCount={currentStreak}
      />
    </View>
  );
}
