import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconWorld,
  IconHanger,
  IconShare,
  IconPhoto,
  IconTrash,
  IconClock,
  IconX,
} from "@tabler/icons-react-native";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { useUserOutfitsStore } from "@/features/outfits/model/user-outfits-store";
import { useUserWardrobeStore } from "@/features/wardrobe/model/user-wardrobe-store";
import { useLogWears } from "@/features/wardrobe/api/useLogWears";
import analytics from "@react-native-firebase/analytics";

export default function PlanOutfitScreen() {
  const router = useRouter();
  const { imageUri, itemIds, ratio } = useLocalSearchParams<{
    imageUri: string;
    itemIds: string;
    ratio: string;
  }>();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { logWears } = useLogWears();

  const addOutfit = useUserOutfitsStore((state) => state.addOutfit);


  const handleSaveToCalendar = () => {
    if (!selectedDate) {
      Alert.alert("Date Required", "Please select a date on the calendar.");
      return;
    }

    addOutfit({
      id: Date.now().toString(),
      imageUri,
      name: "My Outfit",
      items: itemIds ? itemIds.split(",") : [],
      createdAt: Date.now(),
      scheduledDate: selectedDate,
      scheduledTime: selectedTime ? selectedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : undefined,
      notes,
    });

    Alert.alert("Success", "Outfit added to calendar!");
    setIsModalVisible(false);
    router.replace("/");
  };

  const handleSaveToWardrobe = async () => {
    const idsArray = itemIds ? itemIds.split(",") : [];
    addOutfit({
      id: Date.now().toString(),
      imageUri,
      name: "My Outfit",
      items: idsArray,
      createdAt: Date.now(),
      notes,
    });
    // Log to Supabase wear_logs
    if (idsArray.length > 0) {
      logWears(idsArray);
    }
    await analytics().logEvent("outfit_created");
    Alert.alert("Saved", "Outfit saved to your wardrobe.");
  };

  const handleShare = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(imageUri);
    } else {
      Alert.alert("Error", "Sharing is not available on this device");
    }
  };

  const handleSaveToGallery = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      try {
        await MediaLibrary.saveToLibraryAsync(imageUri);
        Alert.alert("Success", "Image saved to gallery!");
      } catch (e) {
        Alert.alert("Error", "Failed to save image.");
      }
    } else {
      Alert.alert("Permission required", "Need permission to access gallery.");
    }
  };

  const handleDelete = () => {
    Alert.alert("Discard Outfit?", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <IconArrowLeft size={24} color="#1D1A27" />
        </Pressable>
        <Text style={styles.headerTitle}>Publish Outfit</Text>
        <TouchableOpacity 
          onPress={() => setIsModalVisible(true)}
          style={styles.headerIconBtn}
        >
          <IconCalendarEvent size={24} color="#1D1A27" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Preview */}
        <View style={[styles.previewContainer, { aspectRatio: ratio === "1:1" ? 1 : 3/4 }]}>
          <ExpoImage
            source={{ uri: imageUri }}
            style={styles.previewImage}
            contentFit="contain"
          />
        </View>

        {/* Publish & Save Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Publish & Save Options</Text>
          <View style={styles.actionGrid}>
            <Pressable
              style={[
                styles.actionCard,
                { backgroundColor: "#EFF6FF", borderColor: "#93C5FD" },
              ]}
              onPress={() => {}}
            >
              <IconWorld size={28} color="#3B82F6" style={styles.cardIcon} />
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>Share to Explore</Text>
                <Text style={styles.cardSubtitle}>
                  Publish to the community feed
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.actionCard,
                { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
              ]}
              onPress={handleSaveToWardrobe}
            >
              <IconHanger size={28} color="#22C55E" style={styles.cardIcon} />
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>Save to Wardrobe</Text>
                <Text style={styles.cardSubtitle}>
                  Organize in your collection
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.actionCard,
                { backgroundColor: "#FFF7ED", borderColor: "#FDBA74" },
              ]}
              onPress={handleShare}
            >
              <IconShare size={28} color="#F97316" style={styles.cardIcon} />
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>Share</Text>
                <Text style={styles.cardSubtitle}>
                  Post to social or message
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.actionCard,
                { backgroundColor: "#FAF5FF", borderColor: "#D8B4FE" },
              ]}
              onPress={handleSaveToGallery}
            >
              <IconPhoto size={28} color="#A855F7" style={styles.cardIcon} />
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>Save to Gallery</Text>
                <Text style={styles.cardSubtitle}>Download to phone photos</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Plan Future Outfit</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={{ padding: 4 }}>
              <IconX size={24} color="#1D1A27" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.calendarWrapper}>
              <Calendar
                onDayPress={(day: any) => setSelectedDate(day.dateString)}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: "#1D1A27",
                  },
                }}
                theme={{
                  todayTextColor: "#3B82F6",
                  arrowColor: "#1D1A27",
                  textDayFontWeight: "500",
                  textMonthFontWeight: "700",
                  textDayHeaderFontWeight: "500",
                }}
              />
            </View>

            <View style={styles.timeSection}>
              <Text style={styles.sectionTitle}>Time (Optional)</Text>
              <TouchableOpacity 
                style={styles.timeSelector}
                onPress={() => setShowTimePicker(true)}
              >
                <IconClock size={20} color="#6B7280" />
                <Text style={selectedTime ? styles.timeText : styles.timeTextPlaceholder}>
                  {selectedTime ? selectedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Add time"}
                </Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={(event, date) => {
                    setShowTimePicker(false);
                    if (date) setSelectedTime(date);
                  }}
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Write some details... (e.g. For Friday's party)"
                placeholderTextColor="#999"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              style={styles.planButton}
              onPress={handleSaveToCalendar}
            >
              <Text style={styles.planButtonText}>+ Plan Future Outfit</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1A27",
  },
  scrollContent: {
    padding: 16,
  },
  previewContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    padding: 16,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  actionCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cardIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D1A27",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    lineHeight: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1A27",
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    fontSize: 16,
    color: "#1D1A27",
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  headerIconBtn: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1A27",
  },
  modalScroll: {
    padding: 20,
  },
  timeSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  timeText: {
    fontSize: 16,
    color: "#1D1A27",
    fontWeight: "500",
  },
  timeTextPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  modalFooter: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  planButton: {
    backgroundColor: "#1D1A27",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  planButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
