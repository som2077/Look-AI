import { OutfitAnalyzingCard } from "@/features/ai-styling/ui/OutfitAnalyzingCard";
import { WeatherOutfitCard } from "@/features/ai-styling/ui/WeatherOutfitCard";
import { useWardrobeSummary } from "@/features/wardrobe/api/useWardrobeSummary";
import {
  EmptyStyleBanner,
  ErrorBanner,
  NotifyBanner,
  RecentlyUploadedHeading,
} from "@/features/wardrobe/ui/RecentlyUploadedCard";
import { WardrobeFilterTabs } from "@/features/wardrobe/ui/WardrobeFilterTabs";
import { WardrobeMessageBar } from "@/features/wardrobe/ui/WardrobeMessageBar";
import type { RingProgressSegment } from "@/features/wardrobe/ui/WardrobeRingSummaryCard";
import { WardrobeRingSummaryCard } from "@/features/wardrobe/ui/WardrobeRingSummaryCard";
import { useStreakStore } from "@/shared/store/useStreakStore";
import { AddClothesCTA } from "@/shared/ui/AddClothesCTA";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { HomeHeader } from "@/shared/ui/HomeHeader";
import { LookAIBanner } from "@/shared/ui/LookAIBanner";
import { PlannedOutfitBanner } from "@/shared/ui/PlannedOutfitBanner";
import { StreakPopup } from "@/shared/ui/StreakPopup";
import { UpcomingEvents } from "@/shared/ui/UpcomingEvents";
import { WeeklyCalendarStrip } from "@/shared/ui/WeeklyCalendarStrip";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
import { useScrollToHideTabBar } from "@/shared/ui/useScrollToHideTabBar";
import { useUser } from "@clerk/clerk-expo";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

type FilterTab = "Days" | "Weeks" | "Months" | "All";

export default function HomeScreen() {
  const { user } = useUser();
  const [timeframe, setTimeframe] = useState<FilterTab>("Days");
  const period =
    timeframe === "Days"
      ? "daily"
      : timeframe === "Weeks"
        ? "weekly"
        : timeframe === "Months"
          ? "monthly"
          : "all";
  const { summary } = useWardrobeSummary(user?.id, period);
  const [activeIndex, setActiveIndex] = useState(0); // Start at index 0 directly
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scrollY = useRef(new Animated.Value(0)).current;
  const { currentStreak, hasIncrementedToday, dismissIncrement } =
    useStreakStore();

  // Streak popup driven by useStreakStore.hasIncrementedToday (set in layout)

  const ringSegments = useMemo<readonly RingProgressSegment[]>(() => {
    const total = summary.totalWorn; // total wardrobe items
    const hasData = total > 0;

    // Ring 1 (orange) — Worn %: what % of wardrobe has been worn at least once
    const wornRatio = hasData ? summary.wornPercentage : 0;

    // Ring 2 (pink) — Never worn ratio: neverCount / total
    const neverRatio = hasData ? summary.neverCount / total : 0;

    // Ring 3 (blue) — Wear frequency: wearCount / total (avg wears per item)
    // Cap at 1 (100%) for visualization if they wore items more times than total items
    const wearFreqRatio = hasData ? Math.min(1, summary.wearCount / total) : 0;

    // Ring 4 (orange) — Streak: always uses real streak data
    const STREAK_GOAL = 30;
    const streakRatio = clampRatio(currentStreak / STREAK_GOAL);

    return [
      { ...RING_SEGMENT_BASE[0], progress: wornRatio },
      { ...RING_SEGMENT_BASE[1], progress: neverRatio },
      { ...RING_SEGMENT_BASE[2], progress: wearFreqRatio },
      { ...RING_SEGMENT_BASE[3], progress: streakRatio },
    ];
  }, [summary, currentStreak]);

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
              totalWorn={currentStreak}
              wearCount={summary.wearCount}
              neverCount={summary.totalWorn + summary.neverCount}
              ringSegments={ringSegments}
              streak={currentStreak}
              labels={{
                topLeft: "Usage",
                bottomLeft: "Streak",
                topRight: "Avg Wears",
                bottomRight: "Total Items",
              }}
              statColors={{
                bottomLeft: "#FEC466",
                bottomRight: "#1D1A27",
              }}
            />
            <View
              style={{
                borderWidth: 0.7,
                borderColor: "#E9EBF8",
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 8,
                marginTop: 5,
                shadowColor: "#FFFFFF",
                shadowOpacity: 0.02,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 10,
                // padddingBottom:1
              }}
            >
              <WardrobeFilterTabs onChange={setTimeframe} />
              <WardrobeMessageBar />
            </View>
          </>
        ) : (
          <>
            <WeatherOutfitCard />
            <LookAIBanner />
          </>
        )}
      </View>
    ),
    [summary, ringSegments, currentStreak],
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
              <WeeklyCalendarStrip onDateChange={setSelectedDate} />
            </Animated.View>

            {/* Scrollable content — scrolls over the header */}
            <View style={{ zIndex: 1, position: "relative" }}>
              {/* FlatList full-width — pagingEnabled snaps correctly */}
              <FlatList
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
                  marginTop: 12,
                  marginBottom: 4,
                  gap: 5,
                }}
              >
                {[0, 1].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: i === indicatorIndex ? 18 : 6,
                      height: 6,
                      borderRadius: 100,
                      backgroundColor:
                        i === indicatorIndex ? "#1D1A27" : "#D8D6E3",
                    }}
                  />
                ))}
              </View>

              <RecentlyUploadedHeading />
              <ErrorBanner />
              <NotifyBanner />
              <EmptyStyleBanner />
              <OutfitAnalyzingCard />
              <PlannedOutfitBanner date={selectedDate} />
              <UpcomingEvents date={selectedDate} showAISuggestion={false} />
              <AddClothesCTA />
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
      <StreakPopup
        visible={hasIncrementedToday}
        onClose={dismissIncrement}
        streakCount={currentStreak}
      />
    </SwipeTabWrapper>
  );
}
