import React, { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  IconArrowLeft,
  IconCamera,
  IconChevronRight,
  IconPencil,
  IconPhoto,
  IconSparkles,
  IconX,
} from "@tabler/icons-react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OptionCard {
  id: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  recommended?: boolean;
}

const OPTIONS: OptionCard[] = [
  {
    id: "scan",
    icon: IconSparkles,
    iconColor: "#6366F1",
    iconBg: "#EEF2FF",
    title: "Scan with AI",
    subtitle: "Take or pick a photo — AI detects category, color & style instantly.",
    badge: "Recommended",
    badgeColor: "#6366F1",
    badgeBg: "#EEF2FF",
    recommended: true,
  },
  {
    id: "manual",
    icon: IconPencil,
    iconColor: "#0F766E",
    iconBg: "#F0FDFA",
    title: "Add manually",
    subtitle: "Fill in the details yourself. Add a photo optionally — no AI needed.",
    badge: "Manual",
    badgeColor: "#0F766E",
    badgeBg: "#F0FDFA",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddClothesIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sheetRendered, setSheetRendered] = useState(false);

  const sheetY = useSharedValue(400);
  const sheetOpacity = useSharedValue(0);

  const openSheet = useCallback(() => {
    setSheetRendered(true);
    sheetY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
    sheetOpacity.value = withTiming(1, { duration: 240 });
  }, [sheetY, sheetOpacity]);

  const closeSheet = useCallback(() => {
    sheetY.value = withTiming(400, { duration: 260, easing: Easing.in(Easing.quad) });
    sheetOpacity.value = withTiming(0, { duration: 240 }, (done) => {
      if (done) runOnJS(setSheetRendered)(false);
    });
  }, [sheetY, sheetOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: sheetOpacity.value }));

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(root)/(tabs)" as never);
  }, [router]);

  const handleGallery = useCallback(async () => {
    closeSheet();
    setTimeout(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        router.push({
          pathname: "/(root)/add-clothes/scanning",
          params: { photoUri: result.assets[0].uri },
        } as never);
      }
    }, 280);
  }, [router, closeSheet]);

  const handleCamera = useCallback(() => {
    closeSheet();
    setTimeout(() => {
      router.push("/(root)/add-clothes/camera" as never);
    }, 280);
  }, [router, closeSheet]);

  const handleManual = useCallback(() => {
    router.push({
      pathname: "/(root)/add-clothes/form",
      params: { mode: "manual" },
    } as never);
  }, [router]);

  const handleOptionPress = useCallback(
    (id: string) => {
      if (id === "scan") openSheet();
      else handleManual();
    },
    [openSheet, handleManual],
  );

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Pressable onPress={handleBack} style={s.backBtn} hitSlop={8}>
            <IconArrowLeft size={18} color="#111827" strokeWidth={2.2} />
          </Pressable>
          <Text style={s.headerTitle}>Add Clothes</Text>
          <View style={s.headerSpacer} />
        </View>

        {/* ── Hero text ───────────────────────────────────────────────── */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>How would you{"\n"}like to add it?</Text>
          <Text style={s.heroSub}>
            Choose a method below to start building your wardrobe.
          </Text>
        </View>

        {/* ── Option cards ────────────────────────────────────────────── */}
        <View style={s.cards}>
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <Pressable
                key={opt.id}
                onPress={() => handleOptionPress(opt.id)}
                style={({ pressed }) => [s.card, pressed && s.cardPressed]}
              >
                {/* Recommended ribbon */}
                {opt.recommended && (
                  <View style={s.ribbon}>
                    <IconSparkles size={9} color="#6366F1" strokeWidth={2} />
                    <Text style={s.ribbonText}>Recommended</Text>
                  </View>
                )}

                <View style={s.cardInner}>
                  {/* Icon */}
                  <View style={[s.cardIcon, { backgroundColor: opt.iconBg }]}>
                    <Icon size={26} color={opt.iconColor} strokeWidth={1.8} />
                  </View>

                  {/* Text */}
                  <View style={s.cardText}>
                    <Text style={s.cardTitle}>{opt.title}</Text>
                    <Text style={s.cardSub}>{opt.subtitle}</Text>

                    {/* Badge */}
                    <View style={[s.badge, { backgroundColor: opt.badgeBg }]}>
                      <Text style={[s.badgeText, { color: opt.badgeColor }]}>
                        {opt.badge}
                      </Text>
                    </View>
                  </View>

                  {/* Chevron */}
                  <IconChevronRight size={18} color="#D1D5DB" strokeWidth={2} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Items added here will appear in your wardrobe.
          </Text>
        </View>

      </SafeAreaView>

      {/* ── Bottom sheet — source picker ───────────────────────────── */}
      <Modal
        visible={sheetRendered}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
        statusBarTranslucent
      >
        <Animated.View style={[s.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeSheet} />

          <Animated.View
            style={[
              s.sheet,
              sheetStyle,
              { paddingBottom: Math.max(28, insets.bottom + 12) },
            ]}
          >
            {/* Drag handle */}
            <View style={s.sheetHandle} />

            {/* Sheet header */}
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Choose source</Text>
              <Pressable onPress={closeSheet} style={s.sheetClose} hitSlop={8}>
                <IconX size={15} color="#6B7280" strokeWidth={2.5} />
              </Pressable>
            </View>

            <Text style={s.sheetSub}>
              How do you want to provide the photo?
            </Text>

            {/* Camera option */}
            <Pressable
              onPress={handleCamera}
              style={({ pressed }) => [s.sheetRow, pressed && s.sheetRowPressed]}
            >
              <View style={[s.sheetRowIcon, { backgroundColor: "#EEF2FF" }]}>
                <IconCamera size={22} color="#6366F1" strokeWidth={1.8} />
              </View>
              <View style={s.sheetRowText}>
                <Text style={s.sheetRowTitle}>Take a photo</Text>
                <Text style={s.sheetRowSub}>Open camera — edit before scanning</Text>
              </View>
              <IconChevronRight size={16} color="#D1D5DB" strokeWidth={2} />
            </Pressable>

            {/* Divider */}
            <View style={s.divider} />

            {/* Gallery option */}
            <Pressable
              onPress={handleGallery}
              style={({ pressed }) => [s.sheetRow, pressed && s.sheetRowPressed]}
            >
              <View style={[s.sheetRowIcon, { backgroundColor: "#F0FDFA" }]}>
                <IconPhoto size={22} color="#0F766E" strokeWidth={1.8} />
              </View>
              <View style={s.sheetRowText}>
                <Text style={s.sheetRowTitle}>Choose from gallery</Text>
                <Text style={s.sheetRowSub}>Pick & crop an existing photo</Text>
              </View>
              <IconChevronRight size={16} color="#D1D5DB" strokeWidth={2} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  headerSpacer: { width: 38 },

  // Hero
  hero: {
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 24,
  },
  heroTitle: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },

  // Cards
  cards: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: "#F9FAFB",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSub: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Recommended ribbon
  ribbon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  ribbonText: {
    color: "#6366F1",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  footerText: {
    color: "#D1D5DB",
    fontSize: 11,
    textAlign: "center",
  },

  // Bottom sheet
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sheetTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSub: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 20,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  sheetRowPressed: {
    backgroundColor: "#F9FAFB",
  },
  sheetRowIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRowText: { flex: 1 },
  sheetRowTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  sheetRowSub: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#F3F4F6",
    marginVertical: 2,
    marginHorizontal: 4,
  },
});
