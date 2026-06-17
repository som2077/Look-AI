import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import {
  IconArrowLeft,
  IconMesh,
  IconPhoto,
  IconRotate,
} from "@tabler/icons-react-native";

export default function AddClothesCameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturing, setCapturing] = useState(false);

  const goToScanning = useCallback(
    (uri: string) => {
      router.replace({
        pathname: "/(root)/add-clothes/scanning",
        params: { photoUri: uri },
      } as never);
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
      if (photo?.uri) goToScanning(photo.uri);
    } catch (e) {
      console.warn("Camera capture failed", e);
    } finally {
      setCapturing(false);
    }
  }, [capturing, goToScanning]);

  const toggleFacing = useCallback(() => {
    setFacing((f) => (f === "back" ? "front" : "back"));
  }, []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const handleGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      goToScanning(result.assets[0].uri);
    }
  }, [goToScanning]);

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
            <IconMesh size={32} color="#c9a84c" />
          </View>
          <Text className="text-white text-lg font-bold text-center mb-2">
            Camera access needed
          </Text>
          <Text className="text-[#888] text-xs text-center mb-6">
            Look AI needs your camera to capture clothing items.
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
      <CameraView
        ref={cameraRef}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        facing={facing}
      />
      <View pointerEvents="none" className="absolute inset-0 bg-black/25" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={handleBack}
            className="h-10 w-10 items-center justify-center rounded-xl bg-black/55 border border-white/10"
          >
            <IconArrowLeft size={18} color="#ffffff" />
          </Pressable>
          <Text className="text-white text-base font-bold">Add clothes</Text>
          <View className="w-10" />
        </View>

        <Text className="text-center text-white/85 text-xs px-6 mb-4">
          Lay the item flat or hang on a plain wall
        </Text>

        {/* Framing guide */}
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="border-2 border-dashed border-white/55 rounded-2xl items-center justify-center"
            style={{ width: 240, height: 280 }}
          >
            <IconMesh
              size={64}
              color="rgba(255,255,255,0.6)"
              strokeWidth={1.5}
            />
            <Text className="text-white/70 text-xs mt-3">
              Place item inside frame
            </Text>
          </View>
        </View>

        {/* Bottom controls */}
        <View className="flex-row items-center justify-between px-8 pb-6 pt-4 bg-black/55">
          <Pressable
            onPress={handleGallery}
            className="h-12 w-12 items-center justify-center rounded-xl bg-black/55 border border-white/15"
          >
            <IconPhoto size={20} color="#ffffff" />
          </Pressable>
          <Pressable
            onPress={handleShutter}
            disabled={capturing}
            className="h-[72px] w-[72px] rounded-full border-[3px] border-white items-center justify-center"
          >
            {capturing ? (
              <ActivityIndicator color="#0c0c0c" />
            ) : (
              <View className="h-14 w-14 rounded-full bg-white" />
            )}
          </Pressable>
          <Pressable
            onPress={toggleFacing}
            className="h-12 w-12 items-center justify-center rounded-xl bg-black/55 border border-white/15"
          >
            <IconRotate size={20} color="#ffffff" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
