import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePendingBatchStore } from "../model/usePendingBatchStore";

import { useRouter } from "expo-router";

export function PendingBatchBanner() {
  const items = usePendingBatchStore((s) => s.items);
  const router = useRouter();

  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  if (items.length === 0) return null;

  const firstSuccess = items.find((i) => i.status === "success");
  const allDone = items.every(
    (i) => i.status === "success" || i.status === "error",
  );

  const avatars = items.slice(0, 4);
  const totalAvatars = avatars.length;
  // Calculate container width based on number of avatars
  // each avatar overlaps the previous one by a certain amount (e.g. left: index * 24)
  // let's use 24 as the offset. Width = (totalAvatars - 1) * 24 + 64 (width of avatar)
  const avatarsWidth = totalAvatars > 0 ? (totalAvatars - 1) * 17 + 64 : 64;

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push("/(root)/add-clothes/batch-scan")}
    >
      <View style={[styles.avatarsContainer, { width: avatarsWidth }]}>
        {avatars.map((item, index) => (
          <Image
            key={item.id}
            source={{ uri: item.cloudinaryUrl || item.originalUri }}
            style={[styles.avatar, { left: index * 17, zIndex: 4 - index }]}
          />
        ))}
      </View>
      <View style={styles.textContainer}>
        {firstSuccess ? (
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Text style={styles.title}>Batch Scan</Text>
              <Text style={styles.timeText}>
                {new Date().toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {items.length} Item{items.length !== 1 ? "s" : ""}
            </Text>
          </View>
        ) : (
          <Animated.View style={{ flex: 1, justifyContent: "center", opacity }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 6,
              }}
            >
              <View style={styles.skeletonLine1} />
              <Text style={styles.timeText}>
                {new Date().toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
            </View>
            <View style={styles.skeletonLine2} />
          </Animated.View>
        )}
        <Text style={styles.statusText}>
          {allDone
            ? "Analysis complete and ready to view."
            : "Analysis in progress..."}
        </Text>
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
    // marginBottom: 16,
    borderWidth: 0.8,
    borderColor: "#E9EBF8",
  },
  avatarsContainer: {
    height: 64,
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    position: "absolute",
    backgroundColor: "#E5E7EB",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  timeText: {
    fontSize: 11,
    color: "#00000090",
    fontWeight: "500",
    backgroundColor:"#FFFFFF",
    paddingVertical:3,
    paddingHorizontal:8,
    borderRadius:40
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
  },
  skeletonLine1: {
    height: 18,
    width: "50%",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  skeletonLine2: {
    height: 14,
    width: "30%",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
});
