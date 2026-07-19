import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { OnboardingHeader } from "@/features/onboarding/ui/onboarding/OnboardingHeader";
import { createSupabaseClient } from "@/shared/supabase/client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Info, Upload, X } from "lucide-react-native";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BUCKET = "full-length-pics";

export default function FullLengthPicsScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const { completeOnboarding } = useOnboardingState();
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
      selectionLimit: 3,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages((prev) => {
        const combined = [...prev, ...result.assets];
        return combined.slice(0, 3);
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

      posthog?.capture("onboarding_step_completed", {
        step: "full-length-pics",
      });
      if (fromProfile === "true") {
        if (user) await completeOnboarding(user.id, supabase);
        router.back();
      } else {
        router.push("/(root)/onboarding/nickname" as any);
      }
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
    posthog?.capture("onboarding_step_completed", { step: "full-length-pics" });
    if (fromProfile === "true") {
      router.back();
    } else {
      router.push("/(root)/onboarding/nickname" as any);
    }
  };

  const showPreview = selectedImages.length > 0;

  return (
    <View className="flex-1 px-6 pb-8">
      <OnboardingHeader step={6} />

      <View className="mt-4">
        <Text className="text-4xl font-sans font-semibold tracking-tight text-[#1D1A27]">
          Full length pics
        </Text>
        <Text className="mt-3 text-[15px] font-sans leading-relaxed text-[#4B4852]">
          This helps AI understand your body shape and styling needs.
        </Text>
      </View>

      {/* Image area: show selected previews or placeholder */}
      <View className="mt-8 flex-1 items-center justify-center">
        {showPreview ? (
          <View className="h-[320px] w-full items-center justify-center relative">
            {selectedImages.map((img, idx) => {
              const transformConfig =
                idx === 0
                  ? {
                      rotate: "0deg",
                      translateX: 0,
                      translateY: 10,
                      zIndex: 10,
                    }
                  : idx === 1
                    ? {
                        rotate: "-12deg",
                        translateX: -60,
                        translateY: 20,
                        zIndex: 5,
                      }
                    : {
                        rotate: "12deg",
                        translateX: 60,
                        translateY: 20,
                        zIndex: 4,
                      };

              return (
                <View
                  key={idx}
                  style={{
                    position: "absolute",
                    transform: [
                      { rotate: transformConfig.rotate },
                      { translateX: transformConfig.translateX },
                      { translateY: transformConfig.translateY },
                    ],
                    zIndex: transformConfig.zIndex,
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 5,
                  }}
                  className="h-[280px] w-[200px] rounded-[24px] bg-white p-[6px]"
                >
                  <Image
                    source={{ uri: img.uri }}
                    className="h-full w-full rounded-[18px]"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(idx)}
                    className="absolute -right-3 -top-3 h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-[#E5E7EB]"
                    style={{ zIndex: 20 }}
                  >
                    <X size={16} color="#1D1A27" />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* "Add More" placeholder card stacked in the next available slot */}
            {selectedImages.length < 3 && (
              <TouchableOpacity
                onPress={handlePickImages}
                style={{
                  position: "absolute",
                  transform: [
                    {
                      rotate: selectedImages.length === 1 ? "-12deg" : "12deg",
                    },
                    { translateX: selectedImages.length === 1 ? -60 : 60 },
                    { translateY: 20 },
                  ],
                  zIndex: selectedImages.length === 1 ? 5 : 4,
                }}
                className="h-[280px] w-[200px] items-center justify-center rounded-[24px] border-2 border-dashed border-[#D1D1D8] bg-[#F9F9FB]"
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-[#ECEDF9]">
                  <Upload size={24} color="#1D1A27" />
                </View>
                <Text className="mt-3 text-sm font-sans font-medium text-[#1D1A27]">
                  {selectedImages.length === 1 ? "Add 2nd Pic" : "Add 3rd Pic"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePickImages}
            className="h-[320px] w-full items-center justify-center relative"
          >
            {/* Left Card */}
            <View
              style={{
                position: "absolute",
                transform: [
                  { rotate: "-12deg" },
                  { translateX: -60 },
                  { translateY: 20 },
                ],
                zIndex: 5,
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
              className="h-[280px] w-[200px] rounded-[24px] bg-white p-[6px]"
            >
              <Image
                source={require("@/assets/images/mirror_selfie_girl.png")}
                className="h-full w-full rounded-[18px]"
                resizeMode="cover"
              />
            </View>

            {/* Right Card */}
            <View
              style={{
                position: "absolute",
                transform: [
                  { rotate: "12deg" },
                  { translateX: 60 },
                  { translateY: 20 },
                ],
                zIndex: 4,
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
              className="h-[280px] w-[200px] rounded-[24px] bg-white p-[6px]"
            >
              <Image
                source={require("@/assets/Rectangle 126.png")}
                className="h-full w-full rounded-[18px]"
                resizeMode="cover"
              />
            </View>

            {/* Center Card (Top layer) */}
            <View
              style={{
                position: "absolute",
                transform: [
                  { rotate: "0deg" },
                  { translateX: 0 },
                  { translateY: 10 },
                ],
                zIndex: 10,
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
              className="h-[280px] w-[200px] rounded-[24px] bg-white p-[6px]"
            >
              <Image
                source={require("@/assets/Rectangle 125.png")}
                className="h-full w-full rounded-[18px]"
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Tips */}
      <View className="mt-6 flex-row items-start rounded-2xl bg-[#F5F4F8] p-4">
        <Info size={20} color="#1D1A27" className="mt-0.5" />
        <Text className="ml-3 flex-1 text-sm font-sans leading-relaxed text-[#000000]">
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
            <Text className="text-base font-sans font-semibold text-white">
              {showPreview ? "Continue" : "Select Images"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          className="items-center justify-center py-3"
        >
          <Text className="text-sm font-sans font-semibold text-[#6B7280]">
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
