import { useUserProfile } from "@/features/profile/api/useProfile";
import { useDeleteAccount } from "@/features/profile/api/useDeleteAccount";
import { getFCMToken, requestUserPermission } from "@/shared/notifications/firebase-service";
import { useSupabase } from "@/shared/supabase/use-supabase";
import { AppGradientBackground } from "@/shared/ui/AppGradientBackground";
import { SwipeTabWrapper } from "@/shared/ui/navigation/SwipeTabWrapper";
import { useScrollToHideTabBar } from "@/shared/ui/useScrollToHideTabBar";
import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  IconBell,
  IconChevronRight,
  IconLogout,
  IconMail,
  IconNotes,
  IconShield,
  IconSpeakerphone,
  IconUser,
  IconUserMinus,
} from "@tabler/icons-react-native";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Shared Components ───────────────────────────────────────────────────────

const SectionTitle = ({ title }: { title: string }) => (
  <Text
    style={{
      fontSize: 16,
      fontWeight: "500",
      color: "#1D1D1D",
      marginBottom: 9,
      marginTop: 24,
      marginLeft: 10,
    }}
  >
    {title}
  </Text>
);

const CardContainer = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => (
  <View
    style={[
      {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
        borderColor: "#E5E7EB",
        borderWidth: 0.4,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        // elevation: 2,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const ListItem = ({
  icon,
  title,
  onPress,
  hasBorder = true,
  rightElement,
}: {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
  hasBorder?: boolean;
  rightElement?: React.ReactNode;
}) => (
  <>
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
    >
      <View style={{ marginRight: 12 }}>{icon}</View>
      <Text
        style={{ flex: 1, fontSize: 14, color: "#1D1D1D", fontWeight: "400" }}
      >
        {title}
      </Text>
      {rightElement || <IconChevronRight size={18} color="#1D1D1D" />}
    </Pressable>
    {hasBorder && (
      <View
        style={{
          height: 1,
          backgroundColor: "#E5E7EB60",
          marginHorizontal: 16,
        }}
      />
    )}
  </>
);

const CustomSwitch = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: value ? "#1D1A27" : "#D1D5DB",
        justifyContent: "center",
        paddingHorizontal: 2,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#FFFFFF",
          alignSelf: value ? "flex-end" : "flex-start",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          // elevation: 2,
        }}
      />
    </Pressable>
  );
};

const DeleteAccountModal = ({
  visible,
  onClose,
  onConfirm,
  isDeleting,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          backgroundColor: "#fffFFF",
          borderRadius: 24,
          padding: 23,
          width: "100%",
          maxWidth: 450,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: "#1D1A27",
            marginBottom: 12,
          }}
        >
          Delete Account?
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#4B5563",
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          Are you sure you want to delete your account and data permanently?
          {"\n\n"}
          This action cannot be undone. Your profile, wardrobe, saved outfits,
          preferences, and all associated data will be permanently removed.
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={onClose}
            disabled={isDeleting}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#4B5563" }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={isDeleting}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: "#EF4444",
              alignItems: "center",
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            {isDeleting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}
              >
                Delete
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const LogoutModal = ({
  visible,
  onClose,
  onConfirm,
  isLoggingOut,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut: boolean;
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 24,
          padding: 23,
          width: "100%",
          maxWidth: 450,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: "#1D1A27",
            marginBottom: 12,
          }}
        >
          Logout?
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#4B5563",
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          Are you sure you want to log out of your account? You will need to log
          back in to access your saved outfits and preferences.
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={onClose}
            disabled={isLoggingOut}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#4B5563" }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={isLoggingOut}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: "#1D1A27",
              alignItems: "center",
              opacity: isLoggingOut ? 0.7 : 1,
            }}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}
              >
                Logout
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Profile Screen UI ─────────────────────────────────────────────────────────

const ProfileScreenUI = ({
  user,
  router,
  notificationsEnabled,
  setNotificationsEnabled,
  handleDeleteAccount,
  isLoggingOut,
  isDeletingAccount,
  onLogoutPress,
}: any) => {
  const { data: userProfile, isLoading } = useUserProfile();

  const displayName = userProfile?.nickname || user?.fullName || "Your Name";
  const displayUsername = userProfile?.username || user?.username || "";
  const displayAvatar = userProfile?.avatar_url || user?.imageUrl;
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 116 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: "#1D1A27",
          marginBottom: 10,
          marginLeft: 9,
        }}
      >
        Profile
      </Text>

      {/* User Info Card */}
      <CardContainer
        style={{
          padding: 16,
          marginBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 24,
        }}
      >
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 46,
            borderWidth: 2,
            borderColor: "#D1D5DB",
            backgroundColor: "#F8F7FC",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
            overflow: "hidden",
          }}
        >
          {displayAvatar ? (
            <Image
              source={{ uri: displayAvatar }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1D1A27" }}>
              {displayInitial}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, justifyContent: "center", marginBottom: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1D1A27" }}>
            {displayName}
          </Text>
          {displayUsername ? (
            <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>
              @{displayUsername}
            </Text>
          ) : null}
        </View>
      </CardContainer>

      {/* Unlock Pro Card */}
      <CardContainer>
        <Pressable
          onPress={() => router.push("/(root)/subscription" as never)}
          style={{
            width: "100%",
            height: 150,
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
            // marginBottom: 10,
          }}
        >
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=1170&auto=format&fit=crop",
            }}
            style={{ width: "100%", height: "100%" }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 24,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Advanced Analysis
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 14,
                fontWeight: "500",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Unlock unlimited outfit combinations.
            </Text>

            <View
              style={{
                backgroundColor: "#fff",
                paddingHorizontal: 24,
                paddingVertical: 11,
                borderRadius: 24,
              }}
            >
              <Text
                style={{ color: "#1D1A27", fontSize: 14, fontWeight: "700" }}
              >
                Upgrade Now
              </Text>
            </View>
          </View>
        </Pressable>
      </CardContainer>

      <View>
        {/* Account Section */}
        <SectionTitle title="Account" />
        <CardContainer>
          <ListItem
            icon={<IconUser size={18} color="#00000090" />}
            title="Personal details"
            onPress={() => router.push("/(root)/personal-details" as never)}
          />

          <ListItem
            icon={<IconBell size={18} color="#00000090" />}
            title="Notification"
            hasBorder={false}
            rightElement={
              <CustomSwitch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            }
          />
        </CardContainer>

        {/* Support & Legal Section */}
        <SectionTitle title="Support & Legal" />
        <CardContainer>
          <ListItem
            icon={<IconSpeakerphone size={18} color="#00000090" />}
            title="Request a feature"
            onPress={() => Linking.openURL("https://tally.so/r/9qx7e1")}
          />
          <ListItem
            icon={<IconMail size={18} color="#00000090" />}
            title="Support Email"
            onPress={() =>
              Linking.openURL(
                "mailto:somgoutam0@gmail.com?subject=Look AI Support&body=Hi Look AI Team,",
              )
            }
          />
          <ListItem
            icon={<IconNotes size={18} color="#00000090" />}
            title="Terms and Conditions"
            onPress={() => router.push("/(root)/terms" as never)}
          />
          <ListItem
            icon={<IconShield size={18} color="#00000090" />}
            title="Privacy policy"
            onPress={() => router.push("/(root)/privacy" as never)}
            hasBorder={false}
          />
        </CardContainer>

        {/* Account Action Section */}
        <SectionTitle title="Account Action" />
        <CardContainer>
          <ListItem
            icon={
              isDeletingAccount ? (
                <ActivityIndicator size="small" color="#1D1D1D" />
              ) : (
                <IconUserMinus size={18} color="#00000090" />
              )
            }
            title="Delete account"
            onPress={isDeletingAccount ? undefined : handleDeleteAccount}
          />
          <ListItem
            icon={
              isLoggingOut ? (
                <ActivityIndicator size="small" color="#1D1D1D" />
              ) : (
                <IconLogout size={18} color="#00000090" />
              )
            }
            title="Logout"
            onPress={onLogoutPress}
            hasBorder={false}
          />
        </CardContainer>

        {/* Version Display */}
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "400",
              color: "#00000080",
              letterSpacing: 0.2,
            }}
          >
            Version {Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? "4.2.9"}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Profile Screen ───────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { onScroll } = useScrollToHideTabBar();
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { supabase } = useSupabase();
  const { deleteAccount, isDeleting: isDeletingAccount } = useDeleteAccount();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadSettings() {
      if (!user) return;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("notifications_enabled")
        .eq("user_id", user.id)
        .single();

      // We check undefined because the column might not exist yet
      if (data && data.notifications_enabled !== undefined && data.notifications_enabled !== null) {
        setNotificationsEnabled(data.notifications_enabled);
      }
    }
    loadSettings();
  }, [user, supabase]);

  const handleToggleNotifications = async (val: boolean) => {
    setNotificationsEnabled(val); // optimistic update
    if (!user) return;

    try {
      let fcm_token = null;
      if (val) {
        const hasPermission = await requestUserPermission();
        if (hasPermission) {
          fcm_token = await getFCMToken();
        } else {
          Alert.alert("Permission Required", "Please enable notifications in your phone settings.");
          setNotificationsEnabled(false); // revert
          return;
        }
      }

      const updates: any = { notifications_enabled: val };
      if (fcm_token) updates.fcm_token = fcm_token;

      if (!user) return;
      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to update notification settings", error);
        // If the column doesn't exist yet, we can catch it or ignore.
        // Alert.alert("Error", "Failed to save settings.");
      }
    } catch (e) {
      console.error(e);
      setNotificationsEnabled(!val);
    }
  };

  const onLogoutPress = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleDeleteAccount = () => setShowDeleteModal(true);

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount();
      setShowDeleteModal(false);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to delete account");
    }
  };

  return (
    <SwipeTabWrapper tabIndex={3}>
      <AppGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            <ProfileScreenUI
              user={user}
              router={router}
              notificationsEnabled={notificationsEnabled}
              setNotificationsEnabled={handleToggleNotifications}
              handleDeleteAccount={handleDeleteAccount}
              isLoggingOut={isLoggingOut}
              isDeletingAccount={isDeletingAccount}
              onLogoutPress={onLogoutPress}
            />
          </ScrollView>
          <DeleteAccountModal
            visible={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDeleteAccount}
            isDeleting={isDeletingAccount}
          />
          <LogoutModal
            visible={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={confirmLogout}
            isLoggingOut={isLoggingOut}
          />
        </SafeAreaView>
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
