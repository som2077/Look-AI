import {
  IconArrowLeft,
  IconDownload,
  IconInfoCircle,
  IconPencil,
  IconShare,
  IconSparklesFilled,
} from "@tabler/icons-react-native";
import { Asset } from "expo-asset";
import { ResizeMode, Video } from "expo-av";
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
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to save the file to your gallery.",
        );
        return;
      }
      const asset = await Asset.fromModule(
        require("../../../../assets/final.webm"),
      ).downloadAsync();
      if (asset.localUri || asset.uri) {
        await MediaLibrary.saveToLibraryAsync(asset.localUri || asset.uri);
        Alert.alert("Success", "Saved to your gallery!");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save.");
    }
  };

  const handleShare = async () => {
    try {
      const asset = await Asset.fromModule(
        require("../../../../assets/final.webm"),
      ).downloadAsync();
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }
      if (asset.localUri || asset.uri) {
        await Sharing.shareAsync(asset.localUri || asset.uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to share.");
    }
  };

  const [loading, setLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

  // Outfit States
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);

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

  const handleGenerate = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

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
                      aspectRatio: 1,
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
                        style={{ width: "100%", height: "100%" }}
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
                      aspectRatio: 1,
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
                        style={{ width: "100%", height: "100%" }}
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
                  height: 460,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "#E2E2EA",
                  // borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Video
                  source={require("../../../../assets/final.webm")}
                  style={{
                    width: "70%",
                    height: "70%",
                    position: "absolute",
                    borderRadius: 22,
                    marginTop: -40,
                  }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isMuted
                  isLooping
                />

                <Text
                  style={{
                    marginTop: 280,
                    fontSize: 13,
                    color: "#00000090",
                    textAlign: "center",
                    paddingHorizontal: 32,
                  }}
                >
                  Your merged try-on image will appear here after generation.
                </Text>
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
      </SafeAreaView>
    </View>
  );
}
