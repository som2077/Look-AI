import { useRevenueCat } from "@/features/payments/model/useRevenueCat";
import { useStreakStore } from "@/shared/store/useStreakStore";
import { useSupabase } from "@/shared/supabase/use-supabase";
import {
  IconArrowLeft,
  IconCheck,
  IconDownload,
  IconInfoCircle,
  IconPencil,
  IconShare,
  IconSparklesFilled,
} from "@tabler/icons-react-native";
import { decode } from "base64-arraybuffer";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
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
      Alert.alert("Error", "Failed to save.");
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
      Alert.alert("Error", "Failed to share.");
    }
  };

  const { supabase } = useSupabase();
  const { isPro } = useRevenueCat();
  const [loading, setLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Outfit States
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  // Toggles (assume user will wire UI later as they mentioned)
  const [garmentPhotoType, setGarmentPhotoType] = useState<
    "model" | "flat-lay"
  >("model");
  const [garmentCategory, setGarmentCategory] = useState<
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
        useStreakStore.getState().incrementStreakAction();
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
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            // paddingTop: 10,
            // paddingBottom: 16,
          }}
        >
          <Pressable onPress={() => router.replace("/")}>
            <IconArrowLeft size={24} color="#1D1A27" />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#1D1A27" }}>
              Virtual Try On
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(root)/(ai-features)/history")}
            style={{ padding: 8 }}
          >
            <IconInfoCircle size={24} color="#1D1A27" />
          </Pressable>
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
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Virtual Try-On View */}
            <View style={{ paddingHorizontal: 15, alignItems: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  width: "100%",
                  gap: 13,
                  marginTop: 7,
                }}
              >
                {/* Card 1: Your Photo */}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Pressable
                    onPress={() => pickImage(setPersonImage)}
                    style={{
                      width: "100%",
                      aspectRatio: 3 / 4,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: "#E2E2EA",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {personImage ? (
                      <>
                        <Image
                          source={{ uri: personImage }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                        <View
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: "#000000",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconPencil size={16} color="#FFFFFF" />
                        </View>
                      </>
                    ) : (
                      <Video
                        source={require("../../../../assets/yourImage.webm")}
                        style={{ width: "100%", height: "80%" }}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isMuted
                      />
                    )}
                  </Pressable>
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#1D1A27",
                    }}
                  >
                    Select Your Image
                  </Text>
                </View>

                {/* Card 2: Garment */}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Pressable
                    onPress={() => pickImage(setOutfitImage)}
                    style={{
                      width: "100%",
                      aspectRatio: 3 / 4,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: "#E2E2EA",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {outfitImage ? (
                      <>
                        <Image
                          source={{ uri: outfitImage }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                        <View
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: "#000000",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconPencil size={16} color="#FFFFFF" />
                        </View>
                      </>
                    ) : (
                      <Video
                        source={require("../../../../assets/outfitImage.webm")}
                        style={{ width: "100%", height: "80%" }}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isMuted
                      />
                    )}
                  </Pressable>
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#1D1A27",
                    }}
                  >
                    Select Outfit Image
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <Pressable
                disabled={!personImage || !outfitImage}
                onPress={handleGenerate}
                style={{
                  width: "100%",
                  marginTop: 20,
                  backgroundColor:
                    !personImage || !outfitImage ? "#E2E2EA" : "#1D1A27",
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: "center",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <IconSparklesFilled
                    size={20}
                    color={!personImage || !outfitImage ? "#9B9BAF" : "#FFFFFF"}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color:
                        !personImage || !outfitImage ? "#9B9BAF" : "#FFFFFF",
                    }}
                  >
                    Generate Try-On
                  </Text>
                </View>
              </Pressable>

              {/* Final Result Placeholder */}
              <View
                style={{
                  marginTop: 10,
                  width: "100%",
                  aspectRatio: 3 / 4,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {resultImageUrl ? (
                  <Image
                    source={{ uri: resultImageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Video
                      source={require("../../../../assets/final.webm")}
                      style={{
                        width: 350,
                        height: 350,
                        marginBottom: 16,
                      }}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay
                      isMuted
                      isLooping
                    />

                    <Text
                      style={{
                        fontSize: 14,
                        color: "#9B9BAF",
                        textAlign: "center",
                        paddingHorizontal: 32,
                        lineHeight: 22,
                      }}
                    >
                      Your merged try-on image will appear here after
                      generation.
                    </Text>
                  </>
                )}
              </View>

              {/* Download and Share Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 10,
                  marginTop: 10,
                  width: "100%",
                }}
              >
                <Pressable
                  onPress={handleDownload}
                  style={{
                    flex: 1,
                    backgroundColor: "#1D1A27",
                    borderRadius: 50,
                    paddingVertical: 17,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <IconDownload size={20} color="#FFFFFF" />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#FFFFFF",
                    }}
                  >
                    Download
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleShare}
                  style={{
                    flex: 1,
                    backgroundColor: "#1D1A27",
                    borderRadius: 50,
                    paddingVertical: 17,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <IconShare size={20} color="#FFFFFF" />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#FFFFFF",
                    }}
                  >
                    Share
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
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
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
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
    </View>
  );
}
