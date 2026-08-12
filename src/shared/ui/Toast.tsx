import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from "@tabler/icons-react-native";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore, type ToastItem, type ToastType } from "./toast-store";

// ─── ToastProvider — top-anchored stack of transient notifications ───────────
// Mount once in _layout.tsx. Each toast slides in from the top and is removed
// (immediately) when the store dismisses it. Stays below the ErrorStateView
// full-screen overlay (zIndex 99999).

const TOAST_COLORS: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: "#1D1A27", icon: "#4ADE80" },
  error: { bg: "#B91C1C", icon: "#FCA5A5" },
  info: { bg: "#4C36F5", icon: "#E0E7FF" },
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const colors = TOAST_COLORS[toast.type];
  const Icon =
    toast.type === "success"
      ? IconCircleCheck
      : toast.type === "error"
        ? IconAlertTriangle
        : IconInfoCircle;

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: colors.bg, marginTop: insets.top + 8, transform: [{ translateY }] },
      ]}
    >
      <Icon size={18} color={colors.icon} strokeWidth={2.2} />
      <Text style={styles.message} numberOfLines={3}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99990,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    maxWidth: 460,
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
