import {
  ClothAnalysisResult,
  saveClothToWardrobe,
} from "@/features/wardrobe/api/saveClothToWardrobe";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Assume user auth is handled somewhere, using a placeholder for now
const CURRENT_USER_ID = "PLACEHOLDER_USER_ID";

export default function ClothScanScreen() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState("");

  const [analysisResult, setAnalysisResult] =
    useState<ClothAnalysisResult | null>(null);
  const [formState, setFormState] = useState<any>({});

  // Refs
  const cameraRef = React.useRef<any>(null);

  const startAnalysis = async (base64Image: string) => {
    setIsLoading(true);
    try {
      setProgressText("⬆️ Uploading & Analyzing...");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      // Call Edge Function
      const response = await supabase.functions.invoke("analyze-cloth-item", {
        body: { base64Image },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to analyze image");
      }

      const result = response.data;
      if (!result.success) {
        throw new Error(result.error || "Analysis failed");
      }

      setAnalysisResult(result);
      setFormState(result.form_fields || {});
      setProgressText("✅ Ready to save");
    } catch (error: any) {
      Alert.alert("Analysis Error", error.message);
    } finally {
      setIsLoading(false);
      setProgressText("");
      setIsCameraOpen(false);
    }
  };

  const handleCameraCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.8,
    });
    if (photo.base64) {
      await startAnalysis(photo.base64);
    }
  };

  const pickFromGallery = async () => {
    // We can support multiple, but for MVP we process the first one
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Process first image as an example
      const asset = result.assets[0];
      if (asset.base64) {
        await startAnalysis(asset.base64);
      }
    }
  };

  const handleSave = async () => {
    if (!analysisResult) return;

    setIsLoading(true);
    setProgressText("Saving to Wardrobe...");

    // Update the result with user's edits
    const finalResult = { ...analysisResult, form_fields: formState };

    const { success, error, itemId } = await saveClothToWardrobe(
      supabase,
      finalResult,
      "camera", // or gallery depending on source
      CURRENT_USER_ID,
    );

    setIsLoading(false);

    if (success) {
      Alert.alert("Success", "Item added to wardrobe!");
      setAnalysisResult(null); // Reset
    } else {
      Alert.alert("Save Error", error);
    }
  };

  if (isCameraOpen) {
    if (!cameraPermission?.granted) {
      return (
        <View className="flex-1 bg-[#0A0A0B] items-center justify-center">
          <Text className="text-white mb-4">We need camera permission</Text>
          <TouchableOpacity
            onPress={requestCameraPermission}
            className="bg-[#1D9E75] px-6 py-3 rounded-full"
          >
            <Text className="text-white font-bold">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="flex-1 bg-black">
        <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back" />
        <View className="absolute bottom-10 w-full flex-row justify-around items-center px-6">
          <TouchableOpacity
            onPress={() => setIsCameraOpen(false)}
            className="bg-gray-800 p-4 rounded-full"
          >
            <Text className="text-white">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCameraCapture}
            className="bg-[#1D9E75] w-20 h-20 rounded-full border-4 border-white"
          />
        </View>
        {isLoading && (
          <View className="absolute inset-0 bg-black/70 items-center justify-center">
            <ActivityIndicator size="large" color="#1D9E75" />
            <Text className="text-white mt-4 font-semibold">
              {progressText}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D9E75" />
          <Text className="text-white mt-4 font-semibold">{progressText}</Text>
          <View className="mt-8 bg-gray-900 p-4 rounded-xl max-w-[80%]">
            <Text className="text-gray-400 text-center">
              💡 Tip: Ensure good lighting for better AI results.
            </Text>
          </View>
        </View>
      ) : analysisResult ? (
        <ScrollView
          className="flex-1 px-4 pt-10"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {analysisResult.bg_removed_url && (
            <Image
              source={{ uri: analysisResult.bg_removed_url }}
              className="w-full h-64 rounded-2xl mb-6"
              resizeMode="contain"
            />
          )}

          <Text className="text-white text-xl font-bold mb-4">
            Item Details
          </Text>

          {Object.keys(formState).map((key) => (
            <View key={key} className="mb-4">
              <Text className="text-gray-400 capitalize mb-2">{key}</Text>
              <TextInput
                className="bg-[#17181C] text-white px-4 py-3 rounded-xl border border-gray-800"
                value={formState[key] || ""}
                onChangeText={(val) =>
                  setFormState({ ...formState, [key]: val })
                }
                multiline={key === "notes" || key === "careInstructions"}
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            className="bg-[#1D9E75] py-4 rounded-full mt-4 items-center"
          >
            <Text className="text-white font-bold text-lg">
              ✅ Save to Wardrobe
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white text-2xl font-bold mb-8">
            Add to Wardrobe
          </Text>

          <TouchableOpacity
            onPress={() => setIsCameraOpen(true)}
            className="bg-[#1D9E75] w-full py-4 rounded-xl flex-row justify-center items-center mb-4"
          >
            <Text className="text-white font-bold text-lg">
              📷 Scan from Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickFromGallery}
            className="bg-[#17181C] w-full py-4 rounded-xl flex-row justify-center items-center border border-gray-800"
          >
            <Text className="text-white font-bold text-lg">
              🖼️ Pick from Gallery
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
