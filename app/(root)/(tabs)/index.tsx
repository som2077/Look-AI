import { useWardrobeSummary } from "@/hooks/useWardrobeSummary";
import { useUser } from "@clerk/clerk-expo";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, AppState, Dimensions, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeTabWrapper } from "../../../components/navigation/SwipeTabWrapper";
import { AppGradientBackground } from "../../../components/ui/AppGradientBackground";
import { HomeHeader } from "../../../components/ui/HomeHeader";
import { OutfitAnalyzingCard } from "../../../components/ui/OutfitAnalyzingCard";
import {
  EmptyStyleBanner,
  NotifyBanner,
  RecentlyUploadedHeading,
} from "../../../components/ui/RecentlyUploadedCard";
import type { RingProgressSegment } from "../../../components/ui/WardrobeRingSummaryCard";
import { WardrobeRingSummaryCard } from "../../../components/ui/WardrobeRingSummaryCard";
import { WeeklyCalendarStrip } from "../../../components/ui/WeeklyCalendarStrip";
import { useScrollToHideTabBar } from "../../../hooks/useScrollToHideTabBar";
// import { TrendFeed } from "../../../components/ui/TrendFeed";
import { CURRENT_STREAK_DAYS } from "@/constants/streak";
import * as SecureStore from "expo-secure-store";
import { AddClothesCTA } from "../../../components/ui/AddClothesCTA";
import { LookAIBanner } from "../../../components/ui/LookAIBanner";
import { StreakPopup } from "../../../components/ui/StreakPopup";
import { WardrobeFilterTabs } from "../../../components/ui/WardrobeFilterTabs";
import { WardrobeMessageBar } from "../../../components/ui/WardrobeMessageBar";
import { WeatherOutfitCard } from "../../../components/ui/WeatherOutfitCard";
import { UpcomingEvents } from "../../../components/ui/UpcomingEvents";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = 20;

// Approximate height of HomeHeader + WeeklyCalendarStrip combined
const HEADER_HEIGHT = 140;

const RING_SEGMENT_BASE: readonly Omit<RingProgressSegment, "progress">[] = [
  { id: "outer", color: "#01B3F7", radius: 88, strokeWidth: 13 },
  { id: "middle", color: "#AB86F1", radius: 74.7, strokeWidth: 13 },
  { id: "inner", color: "#FEC466", radius: 61.4, strokeWidth: 13 },
  { id: "innermost", color: "#000000", radius: 47.9, strokeWidth: 13 },
] as const;

const clampRatio = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

type CardKey = "wardrobe" | "blank1";
// Only 2 cards needed — was wastefully creating 100 items
const CARDS: CardKey[] = ["wardrobe", "blank1"];

export default function HomeScreen() {
  const { user } = useUser();
  const { summary } = useWardrobeSummary(user?.id);
  const [activeIndex, setActiveIndex] = useState(0); // Start at index 0 directly
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showStreakPopup, setShowStreakPopup] = useState(false);

  React.useEffect(() => {
    const triggerPopup = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const lastSeen = await SecureStore.getItemAsync(
          "last_streak_popup_date",
        );

        if (lastSeen !== today) {
          setShowStreakPopup(true);
          await SecureStore.setItemAsync("last_streak_popup_date", today);
        }
      } catch (err) {
        console.warn("Failed to check streak popup date", err);
      }
    };

    // Trigger on initial mount (login / fresh start)
    const timer = setTimeout(triggerPopup, 800);

    // Trigger whenever app is reopened (brought to foreground)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setTimeout(triggerPopup, 500);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  const ringSegments = useMemo<readonly RingProgressSegment[]>(() => {
    const total = summary.totalWorn; // total wardrobe items
    const hasData = total > 0;

    // ── Fallback progress when no wardrobe data yet ──
    const FALLBACK = {
      wornRatio: 0.2, // 20% — gentle placeholder for worn %
      neverRatio: 0.45, // 45% — placeholder for never worn
      wearFreqRatio: 0.1, // 10% — placeholder for avg wears
    } as const;

    // Ring 1 (orange) — Worn %: what % of wardrobe has been worn at least once
    const wornRatio = hasData
      ? clampRatio(summary.wornPercentage)
      : FALLBACK.wornRatio;

    // Ring 2 (pink) — Never worn ratio: neverCount / total
    const neverRatio = hasData
      ? clampRatio(summary.neverCount / total)
      : FALLBACK.neverRatio;

    // Ring 3 (blue) — Wear frequency: wearCount / total (avg wears per item)
    const wearFreqRatio = hasData
      ? clampRatio(summary.wearCount / total)
      : FALLBACK.wearFreqRatio;

    // Ring 4 (orange) — Streak: always uses real streak data
    const STREAK_GOAL = 30;
    const streakRatio = clampRatio(CURRENT_STREAK_DAYS / STREAK_GOAL);

    return [
      { ...RING_SEGMENT_BASE[0], progress: wornRatio },
      { ...RING_SEGMENT_BASE[1], progress: neverRatio },
      { ...RING_SEGMENT_BASE[2], progress: wearFreqRatio },
      { ...RING_SEGMENT_BASE[3], progress: streakRatio },
    ];
  }, [summary]);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  const renderCard = useCallback(
    ({ item }: { item: CardKey }) => (
      <View style={{ width: SCREEN_WIDTH, paddingHorizontal: H_PADDING }}>
        {item === "wardrobe" ? (
          <>
            <WardrobeRingSummaryCard
              wornPercentage={clampRatio(summary.wornPercentage)}
              totalWorn={CURRENT_STREAK_DAYS}
              wearCount={summary.wearCount}
              neverCount={summary.totalWorn}
              ringSegments={ringSegments}
              streak={CURRENT_STREAK_DAYS}
              labels={{
                topLeft: "Worn",
                bottomLeft: "Streak",
                topRight: "Avg Wears",
                bottomRight: "Total Items",
              }}
              statColors={{
                bottomLeft: "#FEC466",
                bottomRight: "#1D1A27",
              }}
            />
            <WardrobeFilterTabs />
            <WardrobeMessageBar />
          </>
        ) : (
          <>
            <WeatherOutfitCard />
            <LookAIBanner />
          </>
        )}
      </View>
    ),
    [summary, ringSegments],
  );

  // Header stays in place (translateY counteracts scroll), clamped to HEADER_HEIGHT
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, HEADER_HEIGHT],
    extrapolate: "clamp",
  });

  // Fade out header as content scrolls over it
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.6, HEADER_HEIGHT],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  const indicatorIndex = activeIndex === 0 ? 0 : 1;
  const { onScroll: hideTabBarOnScroll } = useScrollToHideTabBar();

  return (
    <SwipeTabWrapper tabIndex={0}>
      <AppGradientBackground>
        <SafeAreaView className="flex-1">
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: hideTabBarOnScroll },
            )}
            scrollEventThrottle={16}
          >
            {/* Header & calendar — parallax: stays in place, content scrolls over */}
            <Animated.View
              style={{
                paddingHorizontal: 28,
                transform: [{ translateY: headerTranslateY }],
                opacity: headerOpacity,
                zIndex: 0,
              }}
            >
              <HomeHeader />
              <WeeklyCalendarStrip />
            </Animated.View>

            {/* Scrollable content — scrolls over the header */}
            <View style={{ zIndex: 1, position: "relative" }}>
              {/* FlatList full-width — pagingEnabled snaps correctly */}
              <FlatList
                ref={flatListRef}
                data={CARDS}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={renderCard}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={getItemLayout}
                style={{ flexGrow: 0 }}
                scrollEnabled
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={2}
                removeClippedSubviews={true}
              />

              {/* Pagination dots */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 14,
                  marginBottom: 6,
                  gap: 6,
                }}
              >
                {[0, 1].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: i === indicatorIndex ? 16 : 7,
                      height: 7,
                      borderRadius: 15,
                      borderWidth: 0.5,
                      borderColor: "#1D1A27",
                      backgroundColor:
                        i === indicatorIndex ? "#1D1A27" : "#FFFFFF",
                    }}
                  />
                ))}
              </View>

              <RecentlyUploadedHeading />
              <UpcomingEvents date={new Date()} showAISuggestion={false} />
              <NotifyBanner />
              <EmptyStyleBanner />
              <OutfitAnalyzingCard />
              <AddClothesCTA />
              {/* <TrendFeed /> */}
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
      <StreakPopup
        visible={showStreakPopup}
        onClose={() => setShowStreakPopup(false)}
        streakCount={CURRENT_STREAK_DAYS}
      />
    </SwipeTabWrapper>
  );
}
