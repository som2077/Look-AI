import { usePostHog } from 'posthog-react-native';
import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { createSupabaseClient } from "@/backend/api/supabase";
import * as Haptics from "expo-haptics";
import { Info, Upload, X } from "lucide-react-native";

const BUCKET = "full-length-pics";

export default function FullLengthPicsScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const [selectedImages, setSelectedImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [uploading, setUploading] = useState(false);

  const handlePickImages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 2,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages((prev) => {
        const combined = [...prev, ...result.assets];
        return combined.slice(0, 2);
      });
    }
  };

  const removeImage = (indexToRemove: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const uploadToSupabase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectedImages.length === 0) {
      await handlePickImages();
      return;
    }

    setUploading(true);
    try {
      const supabase = createSupabaseClient(() =>
        getToken({ template: "supabase" }),
      );

      for (const asset of selectedImages) {
        const ext = (
          asset.mimeType?.split("/")[1] ??
          asset.uri.split(".").pop() ??
          "jpg"
        ).split("?")[0];
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const contentType = asset.mimeType ?? `image/${ext}`;

        const formData = new FormData();
        formData.append("file", {
          uri: asset.uri,
          name: fileName.split("/").pop()!,
          type: contentType,
        } as unknown as Blob);

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(fileName, formData, {
            contentType,
            upsert: false,
          });

        if (error) {
          throw new Error(error.message);
        }
      }

      router.push("/(root)/onboarding/nickname" as any);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      Alert.alert("Upload Error", message);
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(root)/onboarding/nickname" as any);
  };

  const showPreview = selectedImages.length > 0;

  return (
    <View className="flex-1 px-5 pb-6 pt-2">
      <OnboardingHeader step={6} />

      <Text className="text-4xl font-semibold tracking-tight px-1 text-[#1D1A27]">
        Full length pics
      </Text>
      <Text className="mt-2 text-base px-1 font-regular text-[#6B7280]">
        This helps AI understand your body shape and styling needs.
      </Text>

      {/* Image area: show selected previews or placeholder */}
      <View className="mt-8 flex-1 items-center justify-center">
        {showPreview ? (
          <View className="flex-row justify-center gap-4 w-full px-2">
            {selectedImages.map((img, idx) => (
              <View key={idx} className="relative">
                <Image
                  source={{ uri: img.uri }}
                  className="h-[280px] w-[150px] rounded-2xl border border-[#E5E7EB]"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => removeImage(idx)}
                  className="absolute -right-3 -top-3 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-[#E5E7EB]"
                >
                  <X size={16} color="#1D1A27" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedImages.length < 2 && (
              <TouchableOpacity
                onPress={handlePickImages}
                className="h-[280px] w-[150px] items-center justify-center rounded-2xl border-2 border-dashed border-[#D1D1D8] bg-[#F9F9FB]"
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-[#ECEDF9]">
                  <Upload size={24} color="#1D1A27" />
                </View>
                <Text className="mt-3 text-sm font-medium text-[#1D1A27]">
                  Add More
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePickImages}
            className="w-full items-center justify-center rounded-3xl border-2 border-dashed border-[#D1D1D8] bg-[#FAFAFA] py-10"
          >
            <Image
              source={require("@/assets/images/full-lenght.png")}
              className="h-[200px] w-[200px] mb-6"
              resizeMode="contain"
            />
            <View className="flex-row items-center justify-center rounded-full bg-[#1D1A27] px-6 py-3">
              <Upload size={18} color="#FFFFFF" />
              <Text className="ml-2 text-sm font-semibold text-white">
                Upload Photos
              </Text>
            </View>
            <Text className="mt-3 text-xs font-regular text-[#9CA3AF]">
              Max 2 photos • JPEG or PNG
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tips */}
      <View className="mt-6 flex-row items-start rounded-2xl bg-[#F5F4F8] p-4">
        <Info size={20} color="#1D1A27" className="mt-0.5" />
        <Text className="ml-3 flex-1 text-[13px] leading-5 font-regular text-[#6B7280]">
          Please upload a clear full-length photo with no close-ups, glasses,
          hats, AirPods, bags, pets, or phones.
        </Text>
      </View>

      {/* Buttons */}
      <View className="mt-8 gap-3">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={showPreview ? uploadToSupabase : handlePickImages}
          disabled={uploading}
          className="items-center justify-center rounded-2xl bg-[#1D1A27] py-5"
        >
          {uploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              {showPreview ? "Continue" : "Select Images"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          className="items-center justify-center py-3"
        >
          <Text className="text-sm font-semibold text-[#6B7280]">
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
