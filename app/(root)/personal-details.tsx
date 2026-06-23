import {
  IconArrowLeft,
  IconCalendarMonth,
  IconCameraPlus,
  IconChevronDown,
  IconFilter2Edit,
  IconNotes,
  IconRulerMeasure2,
  IconUserCheck,
} from "@tabler/icons-react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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
import { uploadToCloudinary } from "../../backend/api/cloudinary";
import { useOnboardingState } from "../../backend/store/onboarding-store";
import { AppGradientBackground } from "../../components/ui/AppGradientBackground";

// ─── Types ────────────────────────────────────────────────────────────────────

type Field = {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  editable: boolean;
  type?: "text" | "select";
  options?: string[];
};

// ─── Field Row Component ──────────────────────────────────────────────────────

const FieldRow = ({
  field,
  onEdit,
}: {
  field: Field;
  onEdit: (field: Field) => void;
}) => (
  <Pressable
    onPress={() => field.editable && onEdit(field)}
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
    }}
  >
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#F5F3FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
      }}
    >
      {field.icon}
    </View>
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 12,
          color: "#9CA3AF",
          fontWeight: "500",
          marginBottom: 2,
        }}
      >
        {field.label}
      </Text>
      <Text style={{ fontSize: 15, color: "#1D1A27", fontWeight: "600" }}>
        {field.value || "—"}
      </Text>
    </View>
    {field.editable && <IconFilter2Edit size={18} color="#00000080" />}
  </Pressable>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PersonalDetailsScreen() {
  const router = useRouter();

  const onboardingState = useOnboardingState();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const fields: Field[] = [
    {
      key: "name",
      label: "Nickname",
      value: onboardingState.nickname || "",
      icon: <IconUserCheck size={24} color="#00000090" />,
      editable: true,
      type: "text",
    },
    {
      key: "dob",
      label: "Age",
      value: onboardingState.age ? onboardingState.age.toString() : "",
      icon: <IconCalendarMonth size={24} color="#00000090" />,
      editable: true,
      type: "text",
    },
    {
      key: "height",
      label: "Height",
      value: onboardingState.height ? `${onboardingState.height} cm` : "",
      icon: <IconRulerMeasure2 size={24} color="#00000090" />,
      editable: true,
      type: "select",
    },
    {
      key: "gender",
      label: "Gender",
      value: onboardingState.gender || "",
      icon: <IconChevronDown size={24} color="#00000080" />,
      editable: true,
      type: "select",
    },
    {
      key: "about",
      label: "About",
      value: onboardingState.about || "Tap to add your bio...",
      icon: <IconNotes size={24} color="#00000080" />,
      editable: true,
      type: "text",
    },
  ];

  // ── Image Pickers ──────────────────────────────────────────────────────────

  const pickImage = async (target: "avatar" | "banner") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: target === "avatar" ? [1, 1] : [4, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;

      // Show local preview immediately
      if (target === "avatar") {
        setAvatarUri(uri);
        setUploadingAvatar(true);
      } else {
        setBannerUri(uri);
        setUploadingBanner(true);
      }

      // Upload to Cloudinary
      const folder =
        target === "avatar" ? "look-ai/avatars" : "look-ai/banners";
      const cloudUrl = await uploadToCloudinary(uri, folder);

      if (target === "avatar") {
        setUploadingAvatar(false);
        if (cloudUrl) setAvatarUri(cloudUrl);
      } else {
        setUploadingBanner(false);
        if (cloudUrl) setBannerUri(cloudUrl);
      }

      if (!cloudUrl) {
        Alert.alert(
          "Upload failed",
          "Image save nahi ho saka. Dobara try karein.",
        );
      }
    }
  };

  // ── Field Edit ─────────────────────────────────────────────────────────────

  const openEdit = (field: Field) => {
    let route = "";
    switch (field.key) {
      case "name":
      case "username":
        route = "/(root)/onboarding/nickname";
        break;
      case "dob":
        route = "/(root)/onboarding/age";
        break;
      case "height":
        route = "/(root)/onboarding/height";
        break;
      case "gender":
        route = "/(root)/onboarding/gender";
        break;
      case "about":
        route = "/(root)/onboarding/about";
        break;
      default:
        return;
    }
    router.push(`${route}?fromProfile=true` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <AppGradientBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="dark" />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: "transparent",
            }}
          >
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <IconArrowLeft size={24} color="#1D1A27" />
            </Pressable>
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 18,
                fontWeight: "700",
                color: "#1D1A27",
                marginRight: 28,
              }}
            >
              Personal Details
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {/* ── Banner + Avatar Section ── */}
            <View
              style={{
                backgroundColor: "transparent",
                marginBottom: 12,
              }}
            >
              {/* Banner */}
              <View style={{ paddingHorizontal: 16, paddingTop: 1 }}>
                <Pressable
                  onPress={() => pickImage("banner")}
                  style={{
                    position: "relative",
                    borderRadius: 24,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: 200,
                      backgroundColor: bannerUri ? "#D1D5DB" : "#0014FF",
                    }}
                  >
                    {bannerUri ? (
                      <Image
                        source={{ uri: bannerUri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 24,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 40,
                            fontWeight: "900",
                            transform: [{ rotate: "45deg" }],
                          }}
                        >
                          ↑
                        </Text>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 40,
                            fontWeight: "900",
                            transform: [{ rotate: "135deg" }],
                          }}
                        >
                          ↑
                        </Text>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 40,
                            fontWeight: "900",
                            transform: [{ rotate: "315deg" }],
                          }}
                        >
                          ↑
                        </Text>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 40,
                            fontWeight: "900",
                            transform: [{ rotate: "225deg" }],
                          }}
                        >
                          ↑
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Banner edit badge / uploading spinner */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      shadowColor: "#000",
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {uploadingBanner && (
                      <ActivityIndicator size="small" color="#1D1A27" />
                    )}
                    <Text
                      style={{
                        color: "#1D1A27",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {uploadingBanner ? "Uploading..." : "Edit Banner"}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Avatar and Info */}
              <View
                style={{
                  paddingHorizontal: 32,
                  marginTop: -40,
                  marginBottom: 24,
                  alignItems: "flex-start",
                }}
              >
                <Pressable
                  onPress={() => pickImage("avatar")}
                  style={{ position: "relative" }}
                >
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      borderWidth: 4,
                      borderColor: "#FFFFFF",
                      overflow: "hidden",
                      backgroundColor: "#6B7280",
                    }}
                  >
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={{
                          uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
                        }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  {/* Camera badge / uploading spinner */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "#E5E7EB",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "#FFFFFF",
                    }}
                  >
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color="#1D1A27" />
                    ) : (
                      <IconCameraPlus size={14} color="#1D1A27" />
                    )}
                  </View>
                </Pressable>

                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "500",
                    color: "#1D1A27",
                    marginTop: 5,
                  }}
                >
                  {onboardingState.nickname || "Your Name"}
                </Text>
                <Text style={{ fontSize: 16, color: "#9263FE", marginTop: 2 }}>
                  {onboardingState.username
                    ? "@" + onboardingState.username
                    : ""}
                </Text>
              </View>
            </View>

            {/* Fields Card */}
            <View
              style={{
                marginHorizontal: 16,
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#F3F4F6",
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 2 },
                // elevation: 1,
              }}
            >
              {fields.map((field) => (
                <FieldRow key={field.key} field={field} onEdit={openEdit} />
              ))}
            </View>

            <Text
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                textAlign: "center",
                marginTop: 20,
                paddingHorizontal: 32,
                lineHeight: 18,
              }}
            >
              Tap any field to edit your personal information.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </View>
  );
}
