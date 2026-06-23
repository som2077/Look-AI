import { useOutfitAnalysisStore } from "@/backend/store/outfit-analysis-store";
import {
  IconArrowLeft,
  IconBookmark,
  IconBookmarkFilled,
  IconDots,
  IconHanger,
  IconShare,
  IconSparkles,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Stop,
  LinearGradient as SvgGrad,
} from "react-native-svg";

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
    score >= 90 ? "#000000" : score >= 75 ? "#000000" : "#000000";

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
          stroke="#FFFFFF"
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
          <IconSparkles size={16} color="#8B5CF6" strokeWidth={2} />
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
  const { lastOutfits, removeOutfit, toggleSaved } = useOutfitAnalysisStore();
  const outfit = lastOutfits[outfitIndex];

  // Fade entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
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

  const handleMoreOptions = () => {
    Alert.alert("Outfit Options", "What would you like to do?", [
      { text: "Share", onPress: () => {} },
      { text: "Edit", onPress: () => {} },
      { text: "Delete", style: "destructive", onPress: handleDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const scoreColor =
    outfit.score >= 90 ? "#000000" : outfit.score >= 75 ? "#000000" : "#000000";
  const scoreLabel =
    outfit.score >= 90 ? "Excellent" : outfit.score >= 75 ? "Good" : "Fair";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Top Header Bar ── */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.topHeaderBtn}>
          <IconArrowLeft size={24} color="#1D1A27" strokeWidth={2} />
        </Pressable>
        <Text style={styles.topHeaderTitle}>Outfit Details</Text>
        <Pressable
          onPress={() => toggleSaved(outfitIndex)}
          style={styles.topHeaderBtn}
        >
          {outfit.isSaved ? (
            <IconBookmarkFilled size={24} color="#1D1A27" />
          ) : (
            <IconBookmark size={24} color="#1D1A27" strokeWidth={2} />
          )}
        </Pressable>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim, flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        bounces={false}
      >
        {/* ── Image ── */}
        <View style={styles.hero}>
          <ExpoImage
            source={{ uri: outfit.imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory"
          />
          <View style={styles.imageActionsRow}>
            <Pressable style={styles.imageActionBtn}>
              <IconShare size={20} color="#1D1A27" strokeWidth={2.5} />
            </Pressable>
            <Pressable
              onPress={handleMoreOptions}
              style={styles.imageActionBtn}
            >
              <IconDots size={20} color="#1D1A27" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* ── Content Below Image ── */}
        <View style={styles.contentContainer}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {outfit.name}
            </Text>
            <Text style={styles.heroSubtitle}>{outfit.subtitle}</Text>
          </View>

          {/* Score Card */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>Outfit Score</Text>
              <Text style={styles.scoreValue}>
                {Math.round(outfit.score / 10)}/10
              </Text>
            </View>
            <View style={styles.scoreBarBg}>
              <View
                style={[styles.scoreBarFill, { width: `${outfit.score}%` }]}
              />
            </View>
            <Text style={styles.scoreText}>
              Weather-friendly style starts here. Find outfits curated for
              today&apos;s forecast. Tap to see outfit suggestions.
            </Text>
          </View>

          {/* Style score breakdown */}
          {/* Style score breakdown */}
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Style breakdown</Text>
              <View style={styles.breakdownBadge}>
                <Text style={styles.breakdownBadgeText}>
                  {outfit.score} avg
                </Text>
              </View>
            </View>
            {[
              {
                label: "Colour harmony",
                value: Math.min(100, outfit.score + 3),
              },
              {
                label: "Fit & proportion",
                value: Math.max(60, outfit.score - 8),
              },
              {
                label: "Occasion match",
                value: Math.min(100, outfit.score + 1),
              },
              {
                label: "Trend relevance",
                value: Math.max(55, outfit.score - 5),
              },
            ].map(({ label, value }) => {
              const color =
                value >= 88 ? "#84CC16" : value >= 72 ? "#F59E0B" : "#EF4444";
              return (
                <View key={label} style={styles.barItemContainer}>
                  <View style={styles.barTextRow}>
                    <Text style={styles.barLabel}>{label}</Text>
                    <Text style={[styles.barValue, { color }]}>{value}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${value}%` as any, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* AI Tip */}
          {/* AI Tip */}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
            AI Suggestion
          </Text>
          <AITipCard score={outfit.score} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },

  // Top Header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
  },
  topHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero Image
  hero: {
    width: SW - 32,
    aspectRatio: 3 / 4,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F0F0F4",
    marginBottom: 24,
  },
  imageActionsRow: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  imageActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Content Layout
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },

  // Title Section
  titleSection: {
    marginBottom: 20,
  },
  heroTitle: {
    color: "#1D1A27",
    fontSize: 24,
    fontFamily: "TikTokSans16pt-Medium",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "#7E7C8C",
    fontSize: 14,
    fontFamily: "TikTokSans16pt-Regular",
  },

  // Score Card
  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 16,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
  },
  scoreValue: {
    fontSize: 16,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
  },
  scoreBarBg: {
    height: 8,
    backgroundColor: "#F0F0F6",
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    backgroundColor: "#1D1A27",
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 13,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#4C4B5E",
    lineHeight: 20,
  },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
    marginBottom: 16,
  },

  // Breakdown container
  breakdownContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 20,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#000000",
  },
  breakdownBadge: {
    backgroundColor: "rgba(132, 204, 22, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  breakdownBadgeText: {
    color: "#84CC16",
    fontSize: 12,
    fontFamily: "TikTokSans16pt-Bold",
  },

  // Bar chart
  barItemContainer: {
    marginBottom: 16,
  },
  barTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 14,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#E5E5EA",
  },
  barValue: {
    fontSize: 14,
    fontFamily: "TikTokSans16pt-Bold",
  },
  barTrack: {
    height: 6,
    backgroundColor: "#1C1C1E",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },

  // AI tip
  tipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  tipIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    fontSize: 15,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
  },
  tipText: {
    fontSize: 14,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#4C4B5E",
    lineHeight: 22,
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
  ringContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 100,
    height: 100,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringScore: {
    fontSize: 24,
    fontFamily: "TikTokSans16pt-Bold",
  },
  ringLabel: {
    fontSize: 10,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#9B9BAF",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    gap: 12,
    flex: 1,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 12,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#4C4B5E",
  },
  chipValue: {
    fontSize: 14,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
  },
});
