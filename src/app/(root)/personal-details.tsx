import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import {
  IconArrowLeft,
  IconBleach,
  IconBodyScan,
  IconCalendarMonth,
  IconCameraPlus,
  IconFilter2Edit,
  IconGenderBigender,
  IconRulerMeasure2,
  IconUserCheck,
} from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const fields: Field[] = [
    {
      key: "name",
      label: "Nickname",
      value: onboardingState.nickname || "",
      icon: <IconUserCheck size={24} color="#00000090" strokeWidth={1.5} />,
      editable: true,
      type: "text",
    },
    {
      key: "dob",
      label: "Age",
      value: onboardingState.age ? onboardingState.age.toString() : "",
      icon: <IconCalendarMonth size={24} color="#00000090" strokeWidth={1.5} />,
      editable: true,
      type: "text",
    },
    {
      key: "height",
      label: "Height",
      value: onboardingState.height ? `${onboardingState.height} cm` : "",
      icon: <IconRulerMeasure2 size={24} color="#00000090" strokeWidth={1.5} />,
      editable: true,
      type: "select",
    },
    {
      key: "gender",
      label: "Gender",
      value: onboardingState.gender || "",
      icon: (
        <IconGenderBigender size={24} color="#00000080" strokeWidth={1.5} />
      ),
      editable: true,
      type: "select",
    },
    {
      key: "bodyType",
      label: "Body Type",
      value: onboardingState.bodyType
        ? onboardingState.bodyType.charAt(0).toUpperCase() +
          onboardingState.bodyType.slice(1)
        : "Tap to add...",
      icon: <IconBodyScan size={24} color="#00000080" strokeWidth={1.5} />,
      editable: true,
      type: "select",
    },
    {
      key: "style",
      label: "Choose your style",
      value: onboardingState.stylePreferences?.length
        ? onboardingState.stylePreferences.join(", ")
        : "Tap to choose...",
      icon: <IconBleach size={24} color="#00000080" strokeWidth={1.5} />,
      editable: true,
      type: "select",
    },
    {
      key: "fullLengthPic",
      label: "Full Length Pic",
      value: "Tap to view/upload...",
      icon: <IconCameraPlus size={24} color="#00000080" strokeWidth={1.5} />,
      editable: true,
      type: "select",
    },
  ];

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
      case "bodyType":
        route = "/(root)/onboarding/body-type";
        break;
      case "style":
        route = "/(root)/onboarding/style-preference";
        break;
      case "fullLengthPic":
        route = "/(root)/onboarding/full-length-pics";
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

          <ScrollView
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
          >
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
                // marginTop:-20
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
