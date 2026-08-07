import {
  IconArrowRight,
  IconBulb,
  IconCheck,
  IconShoe,
  IconSun,
  IconUser,
  IconX,
} from "@tabler/icons-react-native";
import * as NavigationBar from "expo-navigation-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Data ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: IconUser,
    label: "Full body in frame",
    desc: "Head, torso, and feet must all be visible. Please don't crop anything.",
  },
  {
    icon: IconSun,
    label: "Good, even lighting",
    desc: "Natural daylight or a bright room gives the sharpest AI detection.",
  },
  {
    icon: IconBulb,
    label: "Plain background",
    desc: "A clean wall or door helps the AI separate your clothes from the scene.",
  },
  {
    icon: IconShoe,
    label: "Include your shoes",
    desc: "Footwear is part of the outfit — make sure it's in the shot.",
  },
];

const DOS = [
  "Full body — head to toe",
  "Front-facing, upright pose",
  "Plain, well-lit background",
];

const DONTS = [
  "Cropped or zoomed-in shots",
  "Heavy shadows or backlight",
  "Multiple people in frame",
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function CameraInfoScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "android") {
        NavigationBar.setBackgroundColorAsync("#FFFFFF");
        NavigationBar.setButtonStyleAsync("dark");
      }

      return () => {
        if (Platform.OS === "android") {
          NavigationBar.setBackgroundColorAsync("#000000");
          NavigationBar.setButtonStyleAsync("light");
        }
      };
    }, []),
  );

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <View style={s.topBar}>
          <Pressable onPress={handleClose} style={s.closeBtn} hitSlop={15}>
            <IconX size={24} color="#1D1A27" strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <View style={s.hero}>
            <Text style={s.heroTitle}>
              Perfect the shot.{"\n"}Perfect the log.
            </Text>
            <Text style={s.heroSub}>
              Follow these steps so our AI can read every detail of your outfit.
            </Text>
          </View>

          {/* ── Steps Timeline ────────────────────────────────────────────── */}
          <View style={s.timelineContainer}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === STEPS.length - 1;
              return (
                <View key={step.label} style={s.stepRow}>
                  {/* Timeline track & node */}
                  <View style={s.timelineNodeContainer}>
                    <View style={s.timelineNode}>
                      <Icon size={18} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    {!isLast && <View style={s.timelineLine} />}
                  </View>

                  {/* Text */}
                  <View style={s.stepTextContainer}>
                    <Text style={s.stepLabel}>{step.label}</Text>
                    <Text style={s.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Do / Don't ───────────────────────────────────────────────── */}
          <View style={s.referenceContainer}>
            <Text style={s.sectionHeading}>Quick Reference</Text>

            <View style={s.referenceGrid}>
              <View style={s.referenceCol}>
                <View style={[s.refHeader, s.refHeaderDo]}>
                  <IconCheck size={18} color="#059669" strokeWidth={3} />
                  <Text style={[s.refTitle, { color: "#065F46" }]}>Do</Text>
                </View>
                {DOS.map((d) => (
                  <View key={d} style={s.refItem}>
                    <View style={s.refBulletDo} />
                    <Text style={s.refItemText}>{d}</Text>
                  </View>
                ))}
              </View>

              <View style={s.referenceCol}>
                <View style={[s.refHeader, s.refHeaderAvoid]}>
                  <IconX size={18} color="#DC2626" strokeWidth={3} />
                  <Text style={[s.refTitle, { color: "#991B1B" }]}>Avoid</Text>
                </View>
                {DONTS.map((d) => (
                  <View key={d} style={s.refItem}>
                    <View style={s.refBulletAvoid} />
                    <Text style={s.refItemText}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Pro tip ──────────────────────────────────────────────────── */}
          <View style={s.proTip}>
            <View style={s.proTipIconWrap}>
              <IconBulb size={20} color="#1D1A27" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.proTipTitle}>Pro Tip</Text>
              <Text style={s.proTipText}>
                Prop your phone against a wall at chest height and step back 6
                ft — hands-free, perfectly framed.
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <View style={s.cta}>
          <Pressable onPress={handleClose} style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>Got it, let&apos;s shoot</Text>
            <IconArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  safe: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },

  // Hero
  hero: { marginBottom: 40 },
  heroTitle: {
    color: "#1D1A27",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroSub: {
    color: "#4B5563",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: "90%",
  },

  // Timeline Steps
  timelineContainer: {
    marginBottom: 48,
  },
  stepRow: {
    flexDirection: "row",
  },
  timelineNodeContainer: {
    width: 40,
    alignItems: "center",
    marginRight: 16,
  },
  timelineNode: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1D1A27",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  stepTextContainer: {
    flex: 1,
    paddingBottom: 32,
    paddingTop: 6,
  },
  stepLabel: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  stepDesc: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 22,
  },

  // Reference Grid
  referenceContainer: {
    marginBottom: 40,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1D1A27",
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  referenceGrid: {
    flexDirection: "row",
    gap: 16,
  },
  referenceCol: {
    flex: 1,
  },
  refHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  refHeaderDo: {
    backgroundColor: "#ECFDF5",
  },
  refHeaderAvoid: {
    backgroundColor: "#FEF2F2",
  },
  refTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  refItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
    paddingRight: 8,
  },
  refBulletDo: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginTop: 7,
  },
  refBulletAvoid: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    marginTop: 7,
  },
  refItemText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#374151",
    flex: 1,
  },

  // Pro tip
  proTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8F7FC",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  proTipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9EBF8",
    alignItems: "center",
    justifyContent: "center",
  },
  proTipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D1A27",
    marginBottom: 4,
  },
  proTipText: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 22,
  },

  // CTA
  cta: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  ctaBtn: {
    backgroundColor: "#1D1A27",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  ctaBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
