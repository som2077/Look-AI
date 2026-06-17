import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  IconSparkles,
  IconRefresh,
  IconCheck,
} from "@tabler/icons-react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AIPickData {
  badge: string;
  matchPercent: number;
  outfitTitle: string;
  tags: string[];
}

interface AIPickOfTheDayCardProps {
  data?: AIPickData;
  onWearToday?: () => void;
  onTryAnother?: () => void;
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_DATA: AIPickData = {
  badge: "AI Pick of the Day",
  matchPercent: 98,
  outfitTitle: "Smart Casual\nWork Look",
  tags: ["Work", "Hot weather", "Slim fit"],
};

// ─── Match Ring ───────────────────────────────────────────────────────────────

const RING_SIZE = 68;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function MatchRing({ percent }: { percent: number }) {
  const [dashOffset, setDashOffset] = useState(RING_CIRCUMFERENCE);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percent / 100,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listenerId = progress.addListener(({ value }) => {
      setDashOffset(RING_CIRCUMFERENCE * (1 - value));
    });
    return () => progress.removeListener(listenerId);
  }, [percent]);

  const center = RING_SIZE / 2;

  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={RING_STROKE}
          fill="transparent"
        />
        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          stroke="#1C1C1E"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          fill="transparent"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringTextBox}>
        <Text style={styles.ringPercent}>{percent}%</Text>
        <Text style={styles.ringLabel}>match</Text>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const AIPickOfTheDayCard = React.memo(function AIPickOfTheDayCard({
  data = DEFAULT_DATA,
  onWearToday,
  onTryAnother,
}: AIPickOfTheDayCardProps) {
  const wearScale = useRef(new Animated.Value(1)).current;
  const tryScale = useRef(new Animated.Value(1)).current;

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={styles.outerWrapper}>
      {/* ── Purple top card ──────────────────────────────────────────── */}
      <View style={styles.topCard}>
        {/* Decorative glow blobs */}
        <View style={styles.glowBlob1} />
        <View style={styles.glowBlob2} />
        <View style={styles.glowBlob3} />

        {/* Badge + Match Ring */}
        <View style={styles.headerRow}>
          <View style={styles.badgePill}>
            <IconSparkles size={11} color="#1C1C1E" strokeWidth={2.5} />
            <Text style={styles.badgeText}>{data.badge}</Text>
          </View>
          <MatchRing percent={data.matchPercent} />
        </View>

        {/* Title + tags */}
        <View style={styles.titleBlock}>
          <Text style={styles.outfitTitle}>
            {data.outfitTitle}
            {"  "}
            <Text style={styles.titleStar}>✦</Text>
          </Text>
          <View style={styles.tagsRow}>
            {data.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── White bottom section ──────────────────────────────────────── */}
      <View style={styles.bottomCard}>
        {/* CTA buttons */}
        <View style={styles.ctaRow}>
          <Animated.View style={{ transform: [{ scale: tryScale }], flex: 1 }}>
            <Pressable
              onPress={onTryAnother}
              onPressIn={() => pressIn(tryScale)}
              onPressOut={() => pressOut(tryScale)}
              style={styles.tryBtn}
            >
              <IconRefresh size={14} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.tryText}>Try another</Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            style={{ transform: [{ scale: wearScale }], flex: 1.6 }}
          >
            <Pressable
              onPress={onWearToday}
              onPressIn={() => pressIn(wearScale)}
              onPressOut={() => pressOut(wearScale)}
              style={styles.wearBtn}
            >
              <View style={styles.wearBtnGlow} />
              <IconCheck size={15} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.wearText}>Wear This Today</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrapper: {
    marginTop: 14,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // ── Top card
  topCard: {
    backgroundColor: "#F9FAFB",
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: "hidden",
  },
  glowBlob1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(0,0,0,0.03)",
    top: -60,
    right: -40,
    opacity: 0.6,
  },
  glowBlob2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    // backgroundColor: "#4338CA",
    bottom: -30,
    left: -30,
    opacity: 0.5,
  },
  glowBlob3: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    // backgroundColor: "#7C3AED",
    top: 40,
    left: "40%",
    opacity: 0.25,
  },

  // ── Header row
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1C1C1E",
    letterSpacing: 0.2,
  },

  // ── Match ring
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringTextBox: { alignItems: "center" },
  ringPercent: {
    fontSize: 17,
    fontFamily: "TikTokSans16pt-ExtraBold",
    color: "#1C1C1E",
    lineHeight: 20,
  },
  ringLabel: {
    fontSize: 8.5,
    fontFamily: "TikTokSans16pt-SemiBold",
    color: "rgba(0,0,0,0.6)",
    letterSpacing: 0.3,
  },

  // ── Title block
  titleBlock: { marginTop: 10, gap: 8 },
  outfitTitle: {
    fontSize: 24,
    fontFamily: "TikTokSans16pt-Black",
    color: "#1C1C1E",
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  titleStar: { fontSize: 20, color: "#1C1C1E" },
  tagsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tagChip: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "TikTokSans16pt-SemiBold",
    color: "#1C1C1E",
  },

  // ── Bottom section
  bottomCard: {
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },

  // CTA row
  ctaRow: { flexDirection: "row", gap: 8 },
  tryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 13,
  },
  tryText: {
    fontSize: 13,
    fontFamily: "TikTokSans16pt-SemiBold",
    color: "#9CA3AF",
  },
  wearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    paddingVertical: 13,
    overflow: "hidden",
  },
  wearBtnGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  wearText: {
    fontSize: 13,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
});
