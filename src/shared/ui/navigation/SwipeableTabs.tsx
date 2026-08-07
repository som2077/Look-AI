import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface TabConfig {
  key: string;
  title: string;
  component: React.ComponentType<any>;
}

interface SwipeableTabsProps {
  tabs: TabConfig[];
}

export const SwipeableTabs: React.FC<SwipeableTabsProps> = ({ tabs }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<any>(null);

  const TAB_WIDTH = SCREEN_WIDTH / tabs.length;

  // Handle Tab Tap
  const handleTabPress = useCallback(
    (index: number) => {
      setActiveIndex(index);
      const node = scrollViewRef.current;
      if (node?.scrollTo) {
        node.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
      }
    },
    []
  );

  // Sync active index when swiping manually
  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const newIndex = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH
    );
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Animate the bottom indicator line
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: (scrollX.value / SCREEN_WIDTH) * TAB_WIDTH,
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      {/* Sticky Tab Bar Header */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabRow}>
          {tabs.map((tab, index) => {
            const isActive = activeIndex === index;
            return (
              <Pressable
                key={tab.key}
                style={styles.tabButton}
                onPress={() => handleTabPress(index)}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.activeTabText,
                  ]}
                >
                  {tab.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Animated Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            { width: TAB_WIDTH },
            indicatorStyle,
          ]}
        />
      </View>

      {/* Swipeable Content Area */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        decelerationRate="fast"
        directionalLockEnabled={true}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleMomentumScrollEnd}
        style={styles.contentContainer}
      >
        {tabs.map((tab) => {
          const Component = tab.component;
          return (
            <View key={tab.key} style={styles.page}>
              <Component />
            </View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  tabBarContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E8",
    elevation: 2, // Shadow for Android
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 10,
  },
  tabRow: {
    flexDirection: "row",
    height: 48,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9B9BAF", // Inactive text color
  },
  activeTabText: {
    color: "#1D1A27", // Active text color
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: "#10B981", // WhatsApp-like Green indicator
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  contentContainer: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});
