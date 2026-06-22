import React, { useCallback, useMemo } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeableTabs } from "../../components/navigation/SwipeableTabs";
import { StatusBar } from "expo-status-bar";

// ─── Mock Data for FlatLists ────────────────────────────────────────────────
const generateMockData = (prefix: string, count: number) =>
  Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-${i}`,
    title: `${prefix} Item ${i + 1}`,
    subtitle: `This is a description for ${prefix} item ${i + 1}`,
  }));

// ─── Reusable List Component ───────────────────────────────────────────────
// We use React.memo to prevent unnecessary re-renders when switching tabs
const OptimizedList = React.memo(function OptimizedList({
  data,
  prefix,
}: {
  data: any[];
  prefix: string;
}) {
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.listItem}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{prefix.charAt(0)}</Text>
        </View>
        <View style={styles.listContent}>
          <Text style={styles.listTitle}>{item.title}</Text>
          <Text style={styles.listSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    ),
    [prefix],
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true} // Optimize memory
      directionalLockEnabled={true}
      nestedScrollEnabled={true}
    />
  );
});

// ─── Individual Tab Screens ─────────────────────────────────────────────────
const ChatsTab = () => {
  const data = useMemo(() => generateMockData("Chat", 50), []);
  return <OptimizedList data={data} prefix="Chats" />;
};

const StatusTab = () => {
  const data = useMemo(() => generateMockData("Status", 20), []);
  return <OptimizedList data={data} prefix="Status" />;
};

const CommunitiesTab = () => {
  const data = useMemo(() => generateMockData("Community", 10), []);
  return <OptimizedList data={data} prefix="Communities" />;
};

const CallsTab = () => {
  const data = useMemo(() => generateMockData("Call", 30), []);
  return <OptimizedList data={data} prefix="Calls" />;
};

// ─── Main Screen Component ──────────────────────────────────────────────────
export default function SwipeDemoScreen() {
  // Define our 4 tabs exactly as requested
  const TABS = useMemo(
    () => [
      { key: "chats", title: "Chats", component: ChatsTab },
      { key: "status", title: "Status", component: StatusTab },
      { key: "communities", title: "Communities", component: CommunitiesTab },
      { key: "calls", title: "Calls", component: CallsTab },
    ],
    [],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Fake Header similar to WhatsApp */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LookAI Connect</Text>
        </View>

        {/* WhatsApp-Style Swipeable Tabs */}
        <SwipeableTabs tabs={TABS} />
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#10B981", // WhatsApp Green Theme
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Padding for bottom tab bar if nested
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0EEF8",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF0F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#9B9BAF",
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1A27",
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: "#9B9BAF",
  },
});
