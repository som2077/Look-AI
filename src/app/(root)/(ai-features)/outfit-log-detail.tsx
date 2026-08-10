import { useOutfitAnalysisStore } from "@/features/ai-styling/model/outfit-analysis-store";
import { useSavedStore } from "@/features/wardrobe/model/saved-store";
import {
  IconArrowLeft,
  IconBookmark,
  IconBookmarkFilled,
  IconCheck,
  IconDotsVertical,
  IconEdit,
  IconHanger,
  IconShare,
  IconTrash,
} from "@tabler/icons-react-native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SW } = Dimensions.get("window");

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
      <View style={[styles.tipHeader]}>
        <ExpoImage
          source={require("@/assets/images/getStartedLogo.png")}
          style={{ width: 90, height: 34 }}
          contentFit="contain"
        />
        <Text style={styles.tipTitle}>Style Tip</Text>
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
  const lastOutfits = useOutfitAnalysisStore((state) => state.lastOutfits);
  const removeOutfit = useOutfitAnalysisStore((state) => state.removeOutfit);
  const toggleSaved = useOutfitAnalysisStore((state) => state.toggleSaved);
  const updateOutfit = useOutfitAnalysisStore((state) => state.updateOutfit);
  const addSavedItem = useSavedStore((state) => state.addSavedItem);
  const removeSavedItem = useSavedStore((state) => state.removeSavedItem);
  const outfit = lastOutfits[outfitIndex];

  // Fade entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");

  useEffect(() => {
    if (outfit) {
      setEditName(outfit.name);
      setEditSubtitle(outfit.subtitle);
    }
  }, [outfit]);

  const handleSaveEdits = () => {
    updateOutfit(outfitIndex, { name: editName, subtitle: editSubtitle });
    setIsEditing(false);
  };

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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Top Header Bar ── */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.back()} style={styles.topHeaderBtn}>
          <IconArrowLeft size={24} color="#1D1A27" strokeWidth={2} />
        </Pressable>
        <Text style={styles.topHeaderTitle}>
          {isEditing ? "Edit Outfit" : "Outfit Details"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {!isEditing && (
            <Pressable
              onPress={() => {
                const willSave = !outfit.isSaved;
                toggleSaved(outfitIndex);
                if (willSave) {
                  addSavedItem({
                    id: outfit.imageUri,
                    name: outfit.name,
                    occasion: outfit.occasion || "Casual",
                    wears: 0,
                    image: outfit.imageUri,
                    match: outfit.score,
                    tags: outfit.tags || [],
                    saveType: "outfit",
                  });
                } else {
                  removeSavedItem(outfit.imageUri);
                }
              }}
              style={styles.topHeaderBtn}
            >
              {outfit.isSaved ? (
                <IconBookmarkFilled size={24} color="#1D1A27" />
              ) : (
                <IconBookmark size={24} color="#1D1A27" strokeWidth={2} />
              )}
            </Pressable>
          )}
          {isEditing ? (
            <Pressable onPress={handleSaveEdits} style={styles.topHeaderBtn}>
              <IconCheck size={24} color="#1D1A27" strokeWidth={2} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setIsMenuOpen(true)}
              style={styles.topHeaderBtn}
            >
              <IconDotsVertical size={24} color="#1D1A27" strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setIsMenuOpen(false)}
        >
          <View style={[styles.menuContainer, { top: insets.top + 50 }]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                setIsEditing(true);
              }}
            >
              <IconEdit size={20} color="#1D1A27" />
              <Text style={styles.menuItemText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.menuItem}>
              <IconShare size={20} color="#1D1A27" />
              <Text style={styles.menuItemText}>Share</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                handleDelete();
              }}
            >
              <IconTrash size={20} color="#FF3B30" />
              <Text style={[styles.menuItemText, { color: "#FF3B30" }]}>
                Delete
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
        </View>

        {/* ── Content Below Image ── */}
        <View style={styles.contentContainer}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            {isEditing ? (
              <>
                <TextInput
                  style={[
                    styles.heroTitle,
                    {
                      borderBottomWidth: 1,
                      borderColor: "#E2E2EA",
                      paddingBottom: 4,
                      marginBottom: 8,
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Outfit Name"
                  placeholderTextColor="#9B9BAF"
                />
                <TextInput
                  style={[
                    styles.heroSubtitle,
                    {
                      borderBottomWidth: 1,
                      borderColor: "#E2E2EA",
                      paddingBottom: 4,
                    },
                  ]}
                  value={editSubtitle}
                  onChangeText={setEditSubtitle}
                  placeholder="Subtitle (e.g. Jacket · Jeans)"
                  placeholderTextColor="#9B9BAF"
                />
              </>
            ) : (
              <>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  {outfit.name}
                </Text>
                <Text style={styles.heroSubtitle}>{outfit.subtitle}</Text>
              </>
            )}
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

          {/* Color Palette */}
          {outfit.colorPalette && outfit.colorPalette.length > 0 && (
            <View style={styles.paletteContainer}>
              <Text style={styles.sectionTitle}>Color Palette</Text>
              <View style={styles.paletteRow}>
                {outfit.colorPalette.map((hex, i) => (
                  <View key={i} style={styles.paletteColorWrap}>
                    <View
                      style={[styles.paletteColor, { backgroundColor: hex }]}
                    />
                    <Text style={styles.paletteHex}>{hex.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

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
                value >= 88 ? "#000000" : value >= 72 ? "#000000" : "#000000";
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
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#F0F0F4",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
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
    // paddingTop: 0,
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
    // marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
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
    borderRadius: 10,
    marginBottom: 16,
    // borderRadius: 3,/
    borderWidth: 0.1,
    borderColor: "#000000",
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
    // marginBottom: 16,
  },

  // Breakdown container
  breakdownContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 12,
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
    backgroundColor: "#F0F0F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  breakdownBadgeText: {
    color: "#000000",
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
    color: "#00000090",
  },
  barValue: {
    fontSize: 14,
    fontFamily: "TikTokSans16pt-Bold",
  },
  barTrack: {
    height: 8,
    backgroundColor: "#F0F0F6",
    borderRadius: 10,
    borderWidth: 0.1,
    borderColor: "#000000",
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
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    // gap: 2,
    marginBottom: 2,
    marginTop: -10,
    marginLeft: -10,
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
    fontSize: 14.5,
    fontFamily: "TikTokSans16pt-Bold",
    color: "#1D1A27",
    marginBottom: 2.5,
    marginLeft: -6,
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
  paletteContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  paletteRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  paletteColorWrap: {
    alignItems: "center",
    gap: 6,
  },
  paletteColor: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  paletteHex: {
    fontSize: 10,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#5A5A6A",
  },
  // Menu Dropdown
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0)",
  },
  menuContainer: {
    position: "absolute",
    right: 16,
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontFamily: "TikTokSans16pt-Medium",
    color: "#1D1A27",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F6",
    marginVertical: 4,
  },
});
