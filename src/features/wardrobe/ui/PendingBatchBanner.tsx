import { formatTimeShort } from "@/shared/utils/date";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePendingBatchStore } from "../model/usePendingBatchStore";

export function PendingBatchBanner() {
  const items = usePendingBatchStore((s) => s.items);
  const router = useRouter();

  const opacity = useRef(new Animated.Value(0.4)).current;

  const allDone = items.every(
    (i) => i.status === "success" || i.status === "error",
  );

  // Subtle pulse on status text when analysis is in progress
  useEffect(() => {
    if (items.length === 0 || allDone) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [items.length, allDone, opacity]);

  if (items.length === 0) return null;

  const avatars = items.slice(0, 4);
  const totalAvatars = avatars.length;
  // Offset between overlapping circular avatars
  const avatarSize = 64;
  const avatarOverlap = 17;
  const avatarsWidth =
    totalAvatars > 0 ? (totalAvatars - 1) * avatarOverlap + avatarSize : avatarSize;
  const timeStr = formatTimeShort();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push("/(root)/add-clothes/batch-scan")}
    >
      <View style={[styles.avatarsContainer, { width: avatarsWidth }]}>
        {avatars.map((item, index) => (
          <ExpoImage
            key={item.id}
            source={{ uri: item.cloudinaryUrl || item.originalUri }}
            style={[
              styles.avatar,
              { left: index * avatarOverlap, zIndex: 4 - index },
            ]}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ))}
      </View>
      <View style={styles.textContainer}>
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Batch Scan</Text>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {items.length} Item{items.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        {allDone ? (
          <Text style={styles.statusText}>
            Analysis complete and ready to view.
          </Text>
        ) : (
          <Animated.Text style={[styles.statusText, { opacity }]}>
            Analysis in progress...
          </Animated.Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F3F2F770",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 0.8,
    borderColor: "#E9EBF8",
  },
  avatarsContainer: {
    height: 64,
    position: "relative",
    marginRight: 16,
    justifyContent: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    position: "absolute",
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "TikTokSans16pt-Bold",
    fontWeight: "700",
    color: "#111827",
  },
  badge: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "TikTokSans16pt-Medium",
    fontWeight: "600",
  },
  timeText: {
    fontSize: 11,
    color: "#00000090",
    fontFamily: "TikTokSans16pt-Medium",
    fontWeight: "500",
    backgroundColor: "#FFFFFF",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 40,
    overflow: "hidden",
  },
  statusText: {
    fontSize: 13,
    fontFamily: "TikTokSans16pt-Bold",
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
});
