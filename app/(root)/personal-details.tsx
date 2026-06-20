import {
  IconArrowLeft,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconChevronDown,
  IconEdit,
  IconPhoto,
  IconRuler,
  IconUser,
  IconUserCircle,
} from "@tabler/icons-react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadToCloudinary } from "../../backend/api/cloudinary";

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
    {field.editable && <IconEdit size={18} color="#9263FE" />}
  </Pressable>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PersonalDetailsScreen() {
  const router = useRouter();

  const [userData, setUserData] = useState({
    name: "Lina Cho",
    username: "lina_cho",
    dob: "01 Jan 1998",
    height: "165 cm",
    gender: "Female",
  });

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [editingField, setEditingField] = useState<Field | null>(null);
  const [editValue, setEditValue] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];
  const HEIGHT_OPTIONS = [
    "145 cm",
    "150 cm",
    "155 cm",
    "158 cm",
    "160 cm",
    "162 cm",
    "165 cm",
    "168 cm",
    "170 cm",
    "172 cm",
    "175 cm",
    "178 cm",
    "180 cm",
    "183 cm",
    "185 cm",
    "190 cm",
  ];

  const fields: Field[] = [
    {
      key: "name",
      label: "Full Name",
      value: userData.name,
      icon: <IconUserCircle size={20} color="#9263FE" />,
      editable: true,
      type: "text",
    },
    {
      key: "username",
      label: "Username",
      value: "@" + userData.username,
      icon: <IconUser size={20} color="#9263FE" />,
      editable: true,
      type: "text",
    },
    {
      key: "dob",
      label: "Date of Birth",
      value: userData.dob,
      icon: <IconCalendar size={20} color="#9263FE" />,
      editable: true,
      type: "text",
    },
    {
      key: "height",
      label: "Height",
      value: userData.height,
      icon: <IconRuler size={20} color="#9263FE" />,
      editable: true,
      type: "select",
      options: HEIGHT_OPTIONS,
    },
    {
      key: "gender",
      label: "Gender",
      value: userData.gender,
      icon: <IconChevronDown size={20} color="#9263FE" />,
      editable: true,
      type: "select",
      options: GENDER_OPTIONS,
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
    setEditingField(field);
    setEditValue(
      field.key === "username"
        ? userData.username
        : (userData as any)[field.key],
    );
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!editingField) return;
    setUserData((prev) => ({ ...prev, [editingField.key]: editValue }));
    setModalVisible(false);
    setEditingField(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
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
            backgroundColor: "#FFFFFF",
            marginBottom: 12,
          }}
        >
          {/* Banner */}
          <Pressable
            onPress={() => pickImage("banner")}
            style={{ position: "relative" }}
          >
            <View
              style={{
                width: "100%",
                height: 130,
                backgroundColor: "#0014FF",
                overflow: "hidden",
              }}
            >
              {bannerUri ? (
                <Image
                  source={{ uri: bannerUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                // Default gradient-style pattern
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#0014FF",
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
                </View>
              )}
            </View>

            {/* Banner edit badge / uploading spinner */}
            <View
              style={{
                position: "absolute",
                bottom: 8,
                right: 12,
                backgroundColor: "rgba(0,0,0,0.55)",
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              {uploadingBanner ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconPhoto size={14} color="#FFFFFF" />
              )}
              <Text
                style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}
              >
                {uploadingBanner ? "Uploading..." : "Edit Banner"}
              </Text>
            </View>
          </Pressable>

          {/* Avatar */}
          <View
            style={{
              alignItems: "center",
              marginTop: -48,
              marginBottom: 16,
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
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                  overflow: "hidden",
                  backgroundColor: "#EDE9FE",
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
                  backgroundColor: "#9263FE",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                }}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <IconCamera size={14} color="#FFFFFF" />
                )}
              </View>
            </Pressable>

            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: "#1D1A27",
                marginTop: 10,
              }}
            >
              {userData.name}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#9263FE",
                fontWeight: "600",
                marginTop: 2,
              }}
            >
              @{userData.username}
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
            elevation: 2,
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

      {/* ── Edit Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingBottom: 40,
              maxHeight: "80%",
            }}
            onPress={() => {}}
          >
            {/* Handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#E5E7EB",
                alignSelf: "center",
                marginTop: 12,
                marginBottom: 20,
              }}
            />

            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#1D1A27",
                marginBottom: 20,
              }}
            >
              Edit {editingField?.label}
            </Text>

            {/* Text Input */}
            {editingField?.type === "text" && (
              <TextInput
                value={editValue}
                onChangeText={setEditValue}
                placeholder={`Enter ${editingField?.label}`}
                placeholderTextColor="#9CA3AF"
                style={{
                  borderWidth: 1.5,
                  borderColor: "#9263FE",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: "#1D1A27",
                  marginBottom: 20,
                }}
                autoFocus
              />
            )}

            {/* Select Options */}
            {editingField?.type === "select" && editingField.options && (
              <ScrollView style={{ maxHeight: 280, marginBottom: 20 }}>
                {editingField.options.map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => setEditValue(opt)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      marginBottom: 6,
                      backgroundColor:
                        editValue === opt ? "#F5F3FF" : "#F9FAFB",
                      borderWidth: 1.5,
                      borderColor:
                        editValue === opt ? "#9263FE" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: editValue === opt ? "600" : "400",
                        color: editValue === opt ? "#9263FE" : "#1D1A27",
                      }}
                    >
                      {opt}
                    </Text>
                    {editValue === opt && (
                      <IconCheck size={18} color="#9263FE" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              style={{
                backgroundColor: "#9263FE",
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}
              >
                Save Changes
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
