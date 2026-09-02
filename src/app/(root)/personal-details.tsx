import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import { useUserProfile } from "@/features/profile/api/useProfile";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import {
  IconArrowLeft,
  IconShirtFilled as IconBleach,
  IconBodyScan,
  IconCalendarMonthFilled as IconCalendarMonth,
  IconCameraFilled as IconCameraPlus,
  IconEditFilled as IconFilter2Edit,
  IconGenderBigender,
  IconRulerMeasure2,
  IconUserFilled as IconUserCheck,
} from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text as RNText, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Text = (props: any) => {
  const { style, ...rest } = props;
  const flatStyle = StyleSheet.flatten(style || {});
  let fontFamily = flatStyle.fontFamily || "BricolageGrotesque_400Regular";
  
  if (flatStyle.fontWeight === "500") fontFamily = "BricolageGrotesque_500Medium";
  else if (flatStyle.fontWeight === "600") fontFamily = "BricolageGrotesque_600SemiBold";
  else if (flatStyle.fontWeight === "700" || flatStyle.fontWeight === "bold") fontFamily = "BricolageGrotesque_700Bold";
  else if (flatStyle.fontWeight === "800") fontFamily = "BricolageGrotesque_800ExtraBold";

  const { fontWeight, ...cleanStyle } = flatStyle;
  return <RNText style={[cleanStyle, { fontFamily }]} {...rest} />;
};

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
      borderBottomWidth: 0.5,
      borderBottomColor: "#F3F4F6",
    }}
  >
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#F5F3FF90",
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
  const { data: profile } = useUserProfile();

  // Source of truth is user_profiles in Supabase; the local store is a
  // fallback (and the live draft during onboarding edits).
  const nickname = profile?.nickname || onboardingState.nickname || "";
  const age = profile?.age ?? onboardingState.age;
  const height = profile?.height ?? onboardingState.height;
  const gender = profile?.gender || onboardingState.gender || "";
  const bodyType = profile?.body_type || onboardingState.bodyType || "";
  const stylePreferences = profile?.style_preferences?.length
    ? profile.style_preferences
    : onboardingState.stylePreferences;

  const fields: Field[] = [
    {
      key: "name",
      label: "Nickname",
      value: nickname,
      icon: <IconUserCheck size={24} color="#00000090" strokeWidth={1.5} />,
      editable: true,
      type: "text",
    },
    {
      key: "dob",
      label: "Age",
      value: age ? age.toString() : "",
      icon: <IconCalendarMonth size={24} color="#00000090" strokeWidth={1.5} />,
      editable: true,
      type: "text",
    },
    {
      key: "height",
      label: "Height",
      value: height ? `${height} cm` : "",
      icon: <IconRulerMeasure2 size={24} color="#00000090" strokeWidth={1.5} />,
      editable: true,
      type: "select",
    },
    {
      key: "gender",
      label: "Gender",
      value: gender,
      icon: (
        <IconGenderBigender size={24} color="#00000080" strokeWidth={1.5} />
      ),
      editable: true,
      type: "select",
    },
    {
      key: "bodyType",
      label: "Body Type",
      value: bodyType
        ? bodyType.charAt(0).toUpperCase() + bodyType.slice(1)
        : "Tap to add...",
      icon: <IconBodyScan size={24} color="#00000080" strokeWidth={1.5} />,
      editable: true,
      type: "select",
    },
    {
      key: "style",
      label: "Choose your style",
      value: stylePreferences?.length
        ? stylePreferences.join(", ")
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
                borderRadius: 25,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#F3F4F6",
                shadowColor: "#00000040",
                shadowOpacity: 0.04,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 5,
              }}
            >
              {fields.map((field) => (
                <FieldRow key={field.key} field={field} onEdit={openEdit} />
              ))}
            </View>

            <Text
              style={{
                fontSize: 13,
                color: "#00000070",
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
