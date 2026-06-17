import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
} from "react-native-svg";
import {
  IconArrowLeft,
  IconCalendar,
  IconCloud,
  IconFlame,
  IconHanger,
  IconSparkles,
  IconStar,
  IconTag,
  IconTrash,
} from "@tabler/icons-react-native";
import { useOutfitAnalysisStore } from "@/backend/store/outfit-analysis-store";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Score Ring ───────────────────────────────────────────────────────────────

const RING_SIZE = 100;
const STROKE = 8;
const R = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const CENTER = RING_SIZE / 2;

function ScoreRing({ score }: { score: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [offset, setOffset] = React.useState(CIRC);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: score / 100,
      duration: 1400,
      useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value }) => setOffset(CIRC * (1 - value)));
    return () => anim.removeListener(id);
  }, [score]);

  const scoreColor =
    score >= 90 ? "#22C55E" : score >= 75 ? "#F59E0B" : "#EF4444";

  return (
    <View style={styles.ringContainer}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGrad id="sg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={scoreColor} stopOpacity={1} />
            <Stop offset="100%" stopColor={scoreColor} stopOpacity={0.6} />
          </SvgGrad>
        </Defs>
        {/* Track */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          stroke="#F0F0F4"
          strokeWidth={STROKE}
          fill="transparent"
        />
        {/* Progress */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          stroke="url(#sg)"
          strokeWidth={STROKE}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringScore, { color: scoreColor }]}>{score}</Text>
        <Text style={styles.ringLabel}>Score</Text>
      </View>
    </View>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <View style={styles.chipIcon}>{icon}</View>
      <View>
        <Text style={styles.chipLabel}>{label}</Text>
        <Text style={styles.chipValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── AI Tip Card ─────────────────────────────────────────────────────────────

const AI_TIPS = [
  "Try pairing with a statement necklace to elevate this look.",
  "This palette works perfectly for daytime events.",
  "Swap flats for block heels to make it evening-ready.",
  "Add a structured bag to complete the polished silhouette.",
  "A pop of color via accessories would make this look memorable.",
];

function AITipCard({ score }: { score: number }) {
  const tip = AI_TIPS[score % AI_TIPS.length];
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <View style={styles.tipIconBg}>
          <IconSparkles size={14} color="#8B5CF6" strokeWidth={2} />
        </View>
        <Text style={styles.tipTitle}>AI Style Tip</Text>
      </View>
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OutfitLogDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ index: string }>();
  const outfitIndex = parseInt(params.index ?? "0", 10);
  const { lastOutfits, removeOutfit } = useOutfitAnalysisStore();
  const outfit = lastOutfits[outfitIndex];

  // Fade + slide entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
    ]).start();
  }, []);

  if (!outfit) {
    return (
      <View style={styles.notFound}>
        <IconHanger size={48} color="#C7C7D0" strokeWidth={1.5} />
        <Text style={styles.notFoundText}>Outfit not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const handleDelete = () => {
    removeOutfit(outfitIndex);
    router.back();
  };

  const scoreColor =
    outfit.score >= 90 ? "#22C55E" : outfit.score >= 75 ? "#F59E0B" : "#EF4444";
  const scoreLabel =
    outfit.score >= 90 ? "Excellent" : outfit.score >= 75 ? "Good" : "Fair";

  return (
    <View style={styles.root}>
      {/* ── Full-bleed image with gradient overlay ── */}
      <View style={styles.hero}>
        <ExpoImage
          source={{ uri: outfit.imageUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)", "#000000"]}
          locations={[0.3, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Back button */}
        <Pressable
          style={[styles.headerBack, { top: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <IconArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>

        {/* Delete button */}
        <Pressable
          style={[styles.headerDelete, { top: insets.top + 8 }]}
          onPress={handleDelete}
        >
          <IconTrash size={18} color="#FF4D4D" strokeWidth={2} />
        </Pressable>

        {/* Hero bottom content */}
        <View style={styles.heroBottom}>
          <View style={styles.heroBadgeRow}>
            {outfit.tags.map((tag) => (
              <View key={tag} style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.heroTitle}>{outfit.name}</Text>
          <Text style={styles.heroSubtitle}>{outfit.subtitle}</Text>
          <Text style={styles.heroTime}>
            {outfit.date} · {outfit.time}
          </Text>
        </View>
      </View>

      {/* ── Bottom sheet content ── */}
      <Animated.View
        style={[
          styles.sheet,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 32,
            paddingTop: 24,
          }}
        >
          {/* Score + quick stats row */}
          <View style={styles.scoreRow}>
            <ScoreRing score={outfit.score} />
            <View style={styles.scoreRight}>
              <Text style={[styles.scoreGrade, { color: scoreColor }]}>
                {scoreLabel} ✦
              </Text>
              <Text style={styles.scoreDesc}>
                AI analysed {outfit.itemCount} items in your outfit
              </Text>
              <View style={styles.scoreDots}>
                {[...Array(5)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.scoreDot,
                      {
                        backgroundColor:
                          i < Math.round(outfit.score / 20)
                            ? scoreColor
                            : "#E9EBF8",
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Stat chips grid */}
          <Text style={styles.sectionTitle}>Outfit Details</Text>
          <View style={styles.chipGrid}>
            <StatChip
              icon={<IconTag size={16} color="#6366F1" strokeWidth={2} />}
              label="Occasion"
              value={outfit.occasion}
              bg="#EEF2FF"
            />
            <StatChip
              icon={<IconCloud size={16} color="#0EA5E9" strokeWidth={2} />}
              label="Weather"
              value={outfit.weather}
              bg="#F0F9FF"
            />
            <StatChip
              icon={<IconHanger size={16} color="#EC4899" strokeWidth={2} />}
              label="Items"
              value={`${outfit.itemCount} pieces`}
              bg="#FDF2F8"
            />
            <StatChip
              icon={<IconCalendar size={16} color="#10B981" strokeWidth={2} />}
              label="Logged"
              value={outfit.date}
              bg="#ECFDF5"
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Style score breakdown */}
          <Text style={styles.sectionTitle}>Style Breakdown</Text>
          {[
            { label: "Colour Harmony", value: Math.min(100, outfit.score + 3) },
            {
              label: "Fit & Proportion",
              value: Math.max(60, outfit.score - 8),
            },
            { label: "Occasion Match", value: Math.min(100, outfit.score + 1) },
            { label: "Trend Relevance", value: Math.max(55, outfit.score - 5) },
          ].map(({ label, value }) => (
            <View key={label} style={styles.barRow}>
              <Text style={styles.barLabel}>{label}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${value}%` as any,
                      backgroundColor:
                        value >= 88
                          ? "#22C55E"
                          : value >= 72
                            ? "#F59E0B"
                            : "#6366F1",
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{value}</Text>
            </View>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* AI Tip */}
          <Text style={styles.sectionTitle}>AI Suggestion</Text>
          <AITipCard score={outfit.score} />

          {/* Wear again CTA */}
          <Pressable style={styles.wearBtn}>
            <IconFlame size={18} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.wearBtnText}>Log as Worn Today</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },

  // Hero
  hero: { width: SW, height: SH * 0.48, position: "relative" },
  headerBack: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerDelete: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,77,77,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,77,77,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },
  heroBadgeRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "TikTokSans16pt-SemiBold",
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "TikTokSans16pt-Black",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontFamily: "TikTokSans16pt-Medium",
    marginBottom: 6,
  },
  heroTime: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "TikTokSans16pt-Regular",
  },

  // Sheet
  sheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },

  // Score row
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 8,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: { alignItems: "center" },
  ringScore: {
    fontSize: 26,
    fontFamily: "TikTokSans16pt-Black",
    lineHeight: 30,
  },
  ringLabel: {
    fontSize: 10,
    fontFamily: "TikTokSans16pt-SemiBold",
    color: "#9B9BAF",
    letterSpacing: 0.5,
  },
  scoreRight: { flex: 1 },
  scoreGrade: {
    fontSize: 20,
    fontFamily: "TikTokSans16pt-Bold",
    marginBottom: 4,
  },
  scoreDesc: {
    fontSize: 12,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#7E7C8C",
    lineHeight: 18,
    marginBottom: 10,
  },
  scoreDots: { flexDirection: "row", gap: 5 },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#F0F0F6",
    marginVertical: 20,
  },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
    marginBottom: 14,
  },

  // Chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    width: (SW - 50) / 2,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 10,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#7E7C8C",
  },
  chipValue: {
    fontSize: 13,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
    marginTop: 1,
  },

  // Bar chart
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  barLabel: {
    width: 130,
    fontSize: 12,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#4C4B5E",
  },
  barTrack: {
    flex: 1,
    height: 7,
    backgroundColor: "#F0F0F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
  barValue: {
    width: 28,
    fontSize: 12,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
    textAlign: "right",
  },

  // AI tip
  tipCard: {
    backgroundColor: "#F5F3FF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  tipIconBg: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    fontSize: 13,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#5B21B6",
  },
  tipText: {
    fontSize: 13,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#4C4B5E",
    lineHeight: 20,
  },

  // CTA
  wearBtn: {
    marginTop: 20,
    backgroundColor: "#1D1A27",
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  wearBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "TikTokSans16pt-Bold",
  },

  // Not found
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#9B9BAF",
  },
  backBtn: {
    marginTop: 8,
    backgroundColor: "#1D1A27",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "TikTokSans16pt-Bold",
  },
});
