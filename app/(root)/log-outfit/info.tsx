import React, { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  IconBulb,
  IconShoe,
  IconSun,
  IconUser,
  IconX,
  IconArrowRight,
} from "@tabler/icons-react-native";

// ─── Data ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: IconUser,
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
    label: "Full body in frame",
    desc: "Head, torso, and feet must all be visible — don't crop anything.",
  },
  {
    icon: IconSun,
    color: "#FCD34D",
    bg: "rgba(252,211,77,0.10)",
    label: "Good, even lighting",
    desc: "Natural daylight or a bright room gives the sharpest AI detection.",
  },
  {
    icon: IconBulb,
    color: "#34D399",
    bg: "rgba(52,211,153,0.10)",
    label: "Plain background",
    desc: "A clean wall or door helps the AI separate your clothes from the scene.",
  },
  {
    icon: IconShoe,
    color: "#FB923C",
    bg: "rgba(251,146,60,0.10)",
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

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <View style={s.topBar}>
          <View style={s.topBarSpacer} />
          <Text style={s.topBarTitle}>How to capture</Text>
          <Pressable onPress={handleClose} style={s.closeBtn} hitSlop={10}>
            <IconX size={16} color="#9CA3AF" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <View style={s.hero}>
            {/* Decorative ring */}
            <View style={s.heroRing}>
              <View style={s.heroIconWrap}>
                <IconUser size={34} color="#fff" strokeWidth={1.6} />
              </View>
            </View>
            <Text style={s.heroTitle}>Perfect the shot,{"\n"}perfect the log.</Text>
            <Text style={s.heroSub}>
              Follow these steps so our AI can read every detail of your outfit.
            </Text>
          </View>

          {/* ── Steps ────────────────────────────────────────────────────── */}
          <Text style={s.sectionLabel}>4 STEPS TO A GREAT PHOTO</Text>

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <View key={step.label} style={s.stepCard}>
                {/* Number */}
                <View style={s.stepNumWrap}>
                  <Text style={s.stepNum}>{i + 1}</Text>
                </View>

                {/* Icon */}
                <View style={[s.stepIconWrap, { backgroundColor: step.bg }]}>
                  <Icon size={20} color={step.color} strokeWidth={1.8} />
                </View>

                {/* Text */}
                <View style={s.stepText}>
                  <Text style={s.stepLabel}>{step.label}</Text>
                  <Text style={s.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            );
          })}

          {/* ── Do / Don't ───────────────────────────────────────────────── */}
          <Text style={[s.sectionLabel, { marginTop: 28 }]}>QUICK REFERENCE</Text>

          <View style={s.doRow}>
            {/* Do */}
            <View style={[s.doCard, s.doCardGreen]}>
              <Text style={[s.doCardTitle, { color: "#059669" }]}>✓  Do</Text>
              {DOS.map((d) => (
                <Text key={d} style={[s.doItem, { color: "#065F46" }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Don't */}
            <View style={[s.doCard, s.doCardRed]}>
              <Text style={[s.doCardTitle, { color: "#DC2626" }]}>✕  Avoid</Text>
              {DONTS.map((d) => (
                <Text key={d} style={[s.doItem, { color: "#7F1D1D" }]}>
                  {d}
                </Text>
              ))}
            </View>
          </View>

          {/* ── Pro tip ──────────────────────────────────────────────────── */}
          <View style={s.proTip}>
            <Text style={s.proTipEmoji}>💡</Text>
            <Text style={s.proTipText}>
              <Text style={{ color: "#D97706", fontWeight: "700" }}>Pro tip: </Text>
              Prop your phone against a wall at chest height and step back 6 ft — hands-free, perfectly framed.
            </Text>
          </View>
        </ScrollView>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <View style={s.cta}>
          <Pressable onPress={handleClose} style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>Got it, let's shoot</Text>
            <IconArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  topBarSpacer: { width: 36 },
  topBarTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 },

  // Hero
  hero: { alignItems: "center", marginBottom: 36 },
  heroRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 32,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  heroSub: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  // Section label
  sectionLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 14,
  },

  // Step cards
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  stepNumWrap: {
    width: 22,
    alignItems: "center",
  },
  stepNum: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "800",
  },
  stepIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { flex: 1 },
  stepLabel: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  stepDesc: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 17,
  },

  // Do / Dont
  doRow: { flexDirection: "row", gap: 10 },
  doCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  doCardGreen: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  doCardRed: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  doCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  doItem: {
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.85,
  },

  // Pro tip
  proTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 20,
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#FDE68A",
    padding: 14,
  },
  proTipEmoji: { fontSize: 16, marginTop: 1 },
  proTipText: {
    flex: 1,
    color: "#78716C",
    fontSize: 12,
    lineHeight: 18,
  },

  // CTA
  cta: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  ctaBtn: {
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
});
