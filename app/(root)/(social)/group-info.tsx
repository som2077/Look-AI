import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Share, Modal, StyleSheet, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MoreVertical, Share2, MessageSquare, Copy } from "lucide-react-native";
import { useGroups } from "../../../backend/hooks/useGroups";
import * as Clipboard from "expo-clipboard";

const { width } = Dimensions.get("window");

export default function GroupInfoScreen() {
  const { id: groupId, name, image } = useLocalSearchParams<{ id: string; name: string; image: string }>();
  const router = useRouter();
  
  const { groups, leaveGroup } = useGroups();
  const group = groups.find((g) => g.id === groupId);
  const membersCount = group?.members_count || 0;

  const [menuVisible, setMenuVisible] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);

  const groupLink = `https://www.calai.app/groups/${groupId}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(groupLink);
    // You could show a toast here if you have one
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join our group on Look AI: ${groupLink}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeaveConfirm = async () => {
    setLeaveModalVisible(false);
    await leaveGroup(groupId);
    // Pop back to explore or home
    router.dismissAll();
    router.replace("/(root)/(tabs)/explore");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={24} color="#1D1A27" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.iconButton}>
            <MoreVertical size={24} color="#1D1A27" />
          </TouchableOpacity>
        </View>

        {/* 3-Dots Menu Popover */}
        {menuVisible && (
          <View style={styles.menuPopover}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                setLeaveModalVisible(true);
              }}
            >
              <Text style={styles.menuItemText}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Group Details */}
        <View style={styles.content}>
          <Image source={{ uri: image as string }} style={styles.groupImage} />
          <Text style={styles.groupName}>{name}</Text>
          <Text style={styles.membersCount}>{membersCount} members</Text>

          <Text style={styles.inviteLabel}>Invite your friends to the group</Text>
          
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="tail">
              {groupLink}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <View style={styles.actionItem}>
              <TouchableOpacity style={styles.actionCircle} onPress={handleShare}>
                <Share2 size={24} color="#1D1A27" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Share</Text>
            </View>

            <View style={styles.actionItem}>
              <TouchableOpacity style={[styles.actionCircle, { backgroundColor: "#34C759" }]} onPress={() => router.back()}>
                <MessageSquare size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Messages</Text>
            </View>

            <View style={styles.actionItem}>
              <TouchableOpacity style={styles.actionCircle} onPress={handleCopy}>
                <Copy size={24} color="#1D1A27" />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Copy</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Leave Group Modal */}
      <Modal
        visible={leaveModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLeaveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Leave Group?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to leave this group?
            </Text>
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]} 
                onPress={() => setLeaveModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonLeave]} 
                onPress={handleLeaveConfirm}
              >
                <Text style={styles.modalButtonTextLeave}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  iconButton: {
    padding: 8,
  },
  menuPopover: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 70,
    right: 16,
    backgroundColor: "#F3F0F8",
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    color: "#1D1A27",
    fontWeight: "500",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 20,
  },
  groupImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1D1A27",
    marginBottom: 6,
    textAlign: "center",
  },
  membersCount: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 40,
  },
  inviteLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D1A27",
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  linkBox: {
    backgroundColor: "#F0F0F0",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: "100%",
    marginBottom: 30,
  },
  linkText: {
    fontSize: 15,
    color: "#6B7280",
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    gap: 30,
  },
  actionItem: {
    alignItems: "center",
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    color: "#1D1A27",
    fontWeight: "500",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D1A27",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtonsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  modalButtonLeave: {
    backgroundColor: "#E4625E",
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1A27",
  },
  modalButtonTextLeave: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
