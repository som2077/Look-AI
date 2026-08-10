import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { IconClock } from "@tabler/icons-react-native";
import { useUserOutfitsStore } from "@/features/outfits/model/user-outfits-store";

export function PlannedOutfitBanner({ date }: { date: Date }) {
  const outfits = useUserOutfitsStore((state) => state.outfits);
  
  // Format the target date to match the store's YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  
  const plannedOutfit = outfits.find((o) => o.scheduledDate === dateStr);

  if (!plannedOutfit) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Your Planned Outfit</Text>
      <View style={styles.card}>
        {plannedOutfit.imageUri ? (
          <ExpoImage
            source={{ uri: plannedOutfit.imageUri }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]} />
        )}
        
        <View style={styles.content}>
          <Text style={styles.title}>{plannedOutfit.name || "My Outfit"}</Text>
          
          <View style={styles.row}>
            <IconClock size={14} color="#6B7280" />
            <Text style={styles.timeText}>
              {plannedOutfit.scheduledTime || "Anytime"}
            </Text>
          </View>

          {!!plannedOutfit.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              {plannedOutfit.notes}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1A27",
    marginBottom: 10,
    marginLeft: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  image: {
    width: 70,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  placeholderImage: {
    backgroundColor: "#E5E7EB",
  },
  content: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D1A27",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  notes: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
});
