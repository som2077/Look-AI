import { useAuth, useUser } from "@clerk/clerk-expo";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  IconBell,
  IconChevronRight,
  IconLogout,
  IconMail,
  IconNotes,
  IconSettings,
  IconShield,
  IconSparkles,
  IconSpeakerphone,
  IconUser,
  IconUserMinus,
} from "@tabler/icons-react-native";
import { SwipeTabWrapper } from "../../../components/navigation/SwipeTabWrapper";
import { AppGradientBackground } from "../../../components/ui/AppGradientBackground";
import { useScrollToHideTabBar } from "../../../hooks/useScrollToHideTabBar";

// ─── Shared Components ───────────────────────────────────────────────────────

const SectionTitle = ({ title }: { title: string }) => (
  <Text
    style={{
      fontSize: 16,
      fontWeight: "500",
      color: "#1D1D1D",
      marginBottom: 12,
      marginTop: 24,
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
        borderWidth: 1,
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
          backgroundColor: "#E5E7EB",
          marginHorizontal: 16,
        }}
      />
    )}
  </>
);

// ─── Explore Style Sub-Components ─────────────────────────────────────────────

const ExploreSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View>
    <Text style={{ fontSize: 13, fontWeight: "700", color: "#6B7280", letterSpacing: 1.2, marginBottom: 12, marginLeft: 8 }}>{title}</Text>
    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 8, gap: 4 }}>
      {children}
    </View>
  </View>
);

const ExploreListItem = ({ icon, iconBg, title, rightElement, onPress, titleColor = "#1D1A27" }: any) => (
  <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 16 }}>
    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: iconBg, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
      {icon}
    </View>
    <Text style={{ flex: 1, fontSize: 16, fontWeight: "600", color: titleColor }}>{title}</Text>
    {rightElement || <IconChevronRight size={20} color="#9CA3AF" />}
  </Pressable>
);

// ─── Classic Profile UI ───────────────────────────────────────────────────────

const ClassicProfileUI = ({ user, router, notificationsEnabled, setNotificationsEnabled, handleDeleteAccount, isLoggingOut, onLogoutPress }: any) => (
  <View style={{ paddingHorizontal: 24, paddingBottom: 116 }}>
    {/* Profile Info Card */}
    <CardContainer>
      <Pressable
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          backgroundColor: "#FFFFFF",
          borderColor: "#E5E7EB",
          borderWidth: 1,
          borderRadius: 20,
        }}
      >
        <View style={{ width: 48, height: 48, borderRadius: 25, backgroundColor: "#D1D5DB", marginRight: 16 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "500", color: "#1D1D1D" }}>
            {user?.fullName || "Melody Mark"}
          </Text>
          <Text style={{ fontSize: 12, color: "#4B5563", marginTop: 2 }}>
            25 Years old
          </Text>
        </View>
        <IconChevronRight size={18} color="#1D1D1D" />
      </Pressable>
    </CardContainer>

    {/* Unlock Pro Card */}
    <CardContainer style={{ marginTop: 10 }}>
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
        <IconSparkles size={18} color="#1D1D1D" />
        <Text style={{ fontSize: 15, fontWeight: "500", color: "#1D1D1D", marginLeft: 8 }}>
          Unlock Pro
        </Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          }}
          style={{ height: 120, borderRadius: 20, overflow: "hidden", justifyContent: "center", padding: 16 }}
          imageStyle={{ borderRadius: 12 }}
        >
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" }} />
          <Text style={{ color: "white", fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
            Advanced outfit analysis.
          </Text>
          <Pressable
            onPress={() => router.push("/(root)/subscription" as never)}
            style={{ backgroundColor: "white", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, alignSelf: "flex-start", marginTop: "auto" }}
          >
            <Text style={{ color: "#1D1D1D", fontSize: 12, fontWeight: "600" }}>Upgrade Now</Text>
          </Pressable>
        </ImageBackground>
      </View>
    </CardContainer>

    {/* Account Section */}
    <SectionTitle title="Account" />
    <CardContainer>
      <ListItem icon={<IconUser size={18} color="#1D1D1D" />} title="Personal details" />
      <ListItem icon={<IconSettings size={18} color="#1D1D1D" />} title="Preferences" />
      <ListItem
        icon={<IconBell size={18} color="#1D1D1D" />}
        title="Notification"
        hasBorder={false}
        rightElement={
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#D1D5DB", true: "#1D1D1D" }}
            thumbColor={"#FFFFFF"}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        }
      />
    </CardContainer>

    {/* Support & Legal Section */}
    <SectionTitle title="Support & Legal" />
    <CardContainer>
      <ListItem icon={<IconSpeakerphone size={18} color="#1D1D1D" />} title="Request a feature" />
      <ListItem icon={<IconMail size={18} color="#1D1D1D" />} title="Support Email" />
      <ListItem icon={<IconNotes size={18} color="#1D1D1D" />} title="Terms and Conditions" />
      <ListItem icon={<IconShield size={18} color="#1D1D1D" />} title="Privacy policy" hasBorder={false} />
    </CardContainer>

    {/* Account Action Section */}
    <SectionTitle title="Account Action" />
    <CardContainer>
      <ListItem icon={<IconUserMinus size={18} color="#1D1D1D" />} title="Delete account" onPress={handleDeleteAccount} />
      <ListItem
        icon={isLoggingOut ? <ActivityIndicator size="small" color="#1D1D1D" /> : <IconLogout size={18} color="#1D1D1D" />}
        title="Logout"
        onPress={onLogoutPress}
        hasBorder={false}
      />
    </CardContainer>
  </View>
);

// ─── Explore Style Profile UI ─────────────────────────────────────────────────

const ExploreStyleProfileUI = ({ user, router }: any) => (
  <View style={{ paddingHorizontal: 16, paddingBottom: 116, gap: 24 }}>
    {/* Visual Header (Cover Photo & Avatar) */}
    <View style={{ position: "relative", marginBottom: 60, alignItems: "center" }}>
      {/* Cover Photo */}
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" }}
        style={{ width: "100%", height: 160, borderRadius: 24, overflow: "hidden" }}
      />
      {/* Avatar */}
      <View style={{
        position: "absolute", bottom: -45,
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: "#D1D5DB",
        borderWidth: 4, borderColor: "#F8F7FC",
        alignItems: "center", justifyContent: "center"
      }} />
    </View>

    {/* Identity & Bio */}
    <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#1D1A27" }}>
        {user?.fullName || "Melody Mark"}
      </Text>
      <Text style={{ fontSize: 15, color: "#6B7280", fontWeight: "600", marginTop: 2 }}>
        @melodymark
      </Text>
      <Text style={{ fontSize: 14, color: "#4B5563", marginTop: 12, textAlign: "center", lineHeight: 20 }}>
        Fashion enthusiast ✨ | Sharing daily looks & outfit inspiration
      </Text>
    </View>

    {/* Quick Stats (Social Style) */}
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 40, marginTop: 10 }}>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1D1A27" }}>245</Text>
        <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: 4 }}>Posts</Text>
      </View>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1D1A27" }}>12.4k</Text>
        <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: 4 }}>Followers</Text>
      </View>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#1D1A27" }}>1,042</Text>
        <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: 4 }}>Following</Text>
      </View>
    </View>

    {/* Action Buttons */}
    <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 10, marginTop: 10 }}>
      <Pressable style={{ flex: 1, backgroundColor: "#1D1A27", paddingVertical: 12, borderRadius: 20, alignItems: "center" }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Edit Profile</Text>
      </Pressable>
      <Pressable style={{ flex: 1, backgroundColor: "#E5E7EB", paddingVertical: 12, borderRadius: 20, alignItems: "center" }}>
        <Text style={{ color: "#1D1A27", fontWeight: "700", fontSize: 15 }}>Share Profile</Text>
      </Pressable>
    </View>

    {/* Unlock Pro Banner (Explore Style) */}
    <Pressable
      onPress={() => router.push("/(root)/subscription" as never)}
      style={{ width: "100%", height: 160, borderRadius: 24, overflow: "hidden", position: "relative", marginTop: 10 }}
    >
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=1170&auto=format&fit=crop" }}
        style={{ width: "100%", height: "100%" }}
      />
      <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", padding: 20 }}>
         <View style={{ backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" }}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.8 }}>PRO FEATURE</Text>
         </View>
         <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 4 }}>Advanced Analysis</Text>
         <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500", marginBottom: 12 }}>Unlock unlimited outfit combinations.</Text>
         <Pressable
            onPress={() => router.push("/(root)/subscription" as never)}
            style={{ backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, alignSelf: "flex-start" }}
         >
           <Text style={{ color: "#1D1A27", fontWeight: "700", fontSize: 14 }}>Upgrade Now</Text>
         </Pressable>
      </View>
    </Pressable>
  </View>
);

// ─── Main Profile Screen ───────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { onScroll } = useScrollToHideTabBar();
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isExploreStyle, setIsExploreStyle] = useState(true); // Toggle State

  const onLogoutPress = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            Alert.alert("Account Deleted", "Your account has been deleted."),
        },
      ],
    );
  };

  return (
    <SwipeTabWrapper tabIndex={3}>
      <AppGradientBackground>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header Toggle */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 10, paddingBottom: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#1D1A27" }}>
              {isExploreStyle ? "My Profile" : "Profile"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B7280" }}>NEW UI</Text>
              <Switch
                value={isExploreStyle}
                onValueChange={setIsExploreStyle}
                trackColor={{ false: "#D1D5DB", true: "#1D1A27" }}
                thumbColor={"#FFFFFF"}
              />
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {isExploreStyle ? (
              <ExploreStyleProfileUI
                user={user}
                router={router}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={setNotificationsEnabled}
                handleDeleteAccount={handleDeleteAccount}
                isLoggingOut={isLoggingOut}
                onLogoutPress={onLogoutPress}
              />
            ) : (
              <ClassicProfileUI
                user={user}
                router={router}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={setNotificationsEnabled}
                handleDeleteAccount={handleDeleteAccount}
                isLoggingOut={isLoggingOut}
                onLogoutPress={onLogoutPress}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
