import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  IconBell,
  IconChevronRight,
  IconLink,
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
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingState } from "../../../backend/store/onboarding-store";
import { SwipeTabWrapper } from "../../../components/navigation/SwipeTabWrapper";
import { AppGradientBackground } from "../../../components/ui/AppGradientBackground";
import { GradientButton } from "../../../components/ui/GradientButton";
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

const ExploreSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View>
    <Text
      style={{
        fontSize: 13,
        fontWeight: "700",
        color: "#6B7280",
        letterSpacing: 1.2,
        marginBottom: 12,
        marginLeft: 8,
      }}
    >
      {title}
    </Text>
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 8,
        gap: 4,
      }}
    >
      {children}
    </View>
  </View>
);

const ExploreListItem = ({
  icon,
  iconBg,
  title,
  rightElement,
  onPress,
  titleColor = "#1D1A27",
}: any) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 16,
    }}
  >
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: iconBg,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
      }}
    >
      {icon}
    </View>
    <Text
      style={{ flex: 1, fontSize: 16, fontWeight: "600", color: titleColor }}
    >
      {title}
    </Text>
    {rightElement || <IconChevronRight size={20} color="#9CA3AF" />}
  </Pressable>
);

// ─── Classic Profile UI ───────────────────────────────────────────────────────

const ClassicProfileUI = ({
  user,
  router,
  notificationsEnabled,
  setNotificationsEnabled,
  handleDeleteAccount,
  isLoggingOut,
  onLogoutPress,
}: any) => (
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
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 25,
            backgroundColor: "#D1D5DB",
            marginRight: 16,
          }}
        />
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
        <Text
          style={{
            fontSize: 15,
            fontWeight: "500",
            color: "#1D1D1D",
            marginLeft: 8,
          }}
        >
          Unlock Pro
        </Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          }}
          style={{
            height: 120,
            borderRadius: 20,
            overflow: "hidden",
            justifyContent: "center",
            padding: 16,
          }}
          imageStyle={{ borderRadius: 12 }}
        >
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          />
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "700",
              marginBottom: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            Advanced outfit analysis.
          </Text>
          <Pressable
            onPress={() => router.push("/(root)/subscription" as never)}
            style={{
              backgroundColor: "#FFFFFF",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 16,
              alignSelf: "flex-start",
              marginTop: "auto",
            }}
          >
            <Text style={{ color: "#1D1D1D", fontSize: 12, fontWeight: "600" }}>
              Upgrade Now
            </Text>
          </Pressable>
        </ImageBackground>
      </View>
    </CardContainer>

    {/* Account Section */}
    <SectionTitle title="Account" />
    <CardContainer>
      <ListItem
        icon={<IconUser size={18} color="#1D1D1D" />}
        title="Personal details"
        onPress={() => router.push("/(root)/personal-details" as never)}
      />
      <ListItem
        icon={<IconSettings size={18} color="#1D1D1D" />}
        title="Preferences"
      />
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
      <ListItem
        icon={<IconSpeakerphone size={18} color="#1D1D1D" />}
        title="Request a feature"
        onPress={() => Linking.openURL("https://tally.so/r/9qx7e1")}
      />
      <ListItem
        icon={<IconMail size={18} color="#1D1D1D" />}
        title="Support Email"
        onPress={() =>
          Linking.openURL(
            "mailto:somgoutam0@gmail.com?subject=Look AI Support&body=Hi Look AI Team,",
          )
        }
      />
      <ListItem
        icon={<IconNotes size={18} color="#1D1D1D" />}
        title="Terms and Conditions"
        onPress={() => router.push("/(root)/terms" as never)}
      />
      <ListItem
        icon={<IconShield size={18} color="#1D1D1D" />}
        title="Privacy policy"
        onPress={() => router.push("/(root)/privacy" as never)}
        hasBorder={false}
      />
    </CardContainer>

    {/* Account Action Section */}
    <SectionTitle title="Account Action" />
    <CardContainer>
      <ListItem
        icon={<IconUserMinus size={18} color="#1D1D1D" />}
        title="Delete account"
        onPress={handleDeleteAccount}
      />
      <ListItem
        icon={
          isLoggingOut ? (
            <ActivityIndicator size="small" color="#1D1D1D" />
          ) : (
            <IconLogout size={18} color="#1D1D1D" />
          )
        }
        title="Logout"
        onPress={onLogoutPress}
        hasBorder={false}
      />
    </CardContainer>
  </View>
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
          elevation: 2,
        }}
      />
    </Pressable>
  );
};

// ─── Explore Style Profile UI ─────────────────────────────────────────────────

const ExploreStyleProfileUI = ({
  user,
  router,
  notificationsEnabled,
  setNotificationsEnabled,
  handleDeleteAccount,
  isLoggingOut,
  onLogoutPress,
}: any) => {
  const { about, nickname, username, bio } = useOnboardingState();
  return (
    <View style={{ paddingHorizontal: 0, paddingBottom: 116 }}>
      {/* Visual Header (Cover Photo & Avatar) */}
      <View
        style={{
          position: "relative",
          marginBottom: 60,
          marginTop: 2,
          paddingHorizontal: 13,
        }}
      >
        {/* Cover Photo */}
        <View
          style={{
            width: "100%",
            height: 200,
            borderRadius: 30,
            backgroundColor: "#0014FF",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 24,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 50,
              fontWeight: "900",
              transform: [{ rotate: "45deg" }],
            }}
          >
            ↑
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: 50,
              fontWeight: "900",
              transform: [{ rotate: "135deg" }],
            }}
          >
            ↑
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: 50,
              fontWeight: "900",
              transform: [{ rotate: "315deg" }],
            }}
          >
            ↑
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: 50,
              fontWeight: "900",
              transform: [{ rotate: "225deg" }],
            }}
          >
            ↑
          </Text>
        </View>

        {/* Link top right below banner */}
        <View
          style={{
            position: "absolute",
            right: 24,
            bottom: -40,
            flexDirection: "row",
            gap: 16,
          }}
        >
          <Pressable
            onPress={async () => {
              try {
                const profileUrl = `https://lookai.app/@${username || "user"}`;
                await Share.share(
                  {
                    title: `${nickname || "My"} Profile on Look AI`,
                    message: `Discover my style and daily outfits on Look AI! ✨\n\nCheck out my profile here: ${profileUrl}`,
                    url: profileUrl,
                  },
                  {
                    dialogTitle: "Share your Look AI Profile",
                    subject: "Check out my style on Look AI!",
                  }
                );
              } catch (error) {
                console.log("Error sharing:", error);
              }
            }}
          >
            <IconLink color="#00000080" size={20} />
          </Pressable>
        </View>

        {/* Avatar */}
        <View
          style={{
            position: "absolute",
            bottom: -50,
            left: 32,
            width: 104,
            height: 104,
            borderRadius: 52,
            backgroundColor: "#E5E7EB",
            borderWidth: 4,
            borderColor: "#FAFAFC",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
            }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 50,
              overflow: "hidden",
            }}
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: 32 }}>
        {/* Name & Title */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#1D1A27" }}>
            {nickname || "Lina Cho"}
          </Text>
          {/* <IconStarFilled size={18} color="#FBBF24"  */}
        </View>
        <Text
          style={{
            fontSize: 14,
            color: "#9263FE",
            fontWeight: "600",
            marginTop: 2,
          }}
        >
          {username ? `@${username}` : "@lina_cho"}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#6B7280",
            fontWeight: "500",
            marginTop: 4,
          }}
        >
          {bio || "Independent Designer | Studio Else"}
        </Text>

        {/* Stats Row */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 24,
            gap: 24,
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() =>
              router.push("/(root)/profile-network?tab=followers" as never)
            }
          >
            <Text
              style={{
                fontSize: 13,
                color: "#9CA3AF",
                fontWeight: "500",
                marginBottom: 4,
              }}
            >
              Followers
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1D1A27" }}>
              678
            </Text>
          </Pressable>
          <View style={{ width: 1, height: 30, backgroundColor: "#E5E7EB" }} />
          <Pressable
            onPress={() =>
              router.push("/(root)/profile-network?tab=following" as never)
            }
          >
            <Text
              style={{
                fontSize: 13,
                color: "#9CA3AF",
                fontWeight: "500",
                marginBottom: 4,
              }}
            >
              Following
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1D1A27" }}>
              312
            </Text>
          </Pressable>
          <View style={{ width: 1, height: 30, backgroundColor: "#E5E7EB" }} />
          <Pressable
            onPress={() =>
              router.push("/(root)/profile-network?tab=posts" as never)
            }
          >
            <Text
              style={{
                fontSize: 13,
                color: "#9CA3AF",
                fontWeight: "500",
                marginBottom: 4,
              }}
            >
              Posts
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1D1A27" }}>
              18
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            width: "100%",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderStyle: "dotted",
            marginTop: 24,
            marginBottom: 24,
            borderRadius: 1,
          }}
        />

        {/* About Section */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: "#1D1A27",
            marginBottom: 12,
          }}
        >
          About
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#6B7280",
            lineHeight: 22,
            marginBottom: 20,
          }}
        >
          {about || "No bio added yet."}
        </Text>

        {/* Unlock Pro Banner (Explore Style) */}
        <Pressable
          onPress={() => router.push("/(root)/subscription" as never)}
          style={{
            width: "100%",
            height: 160,
            borderRadius: 24,
            overflow: "hidden",
            position: "relative",
            // marginTop: 2,
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
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "flex-end",
              padding: 20,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 24,
                fontWeight: "800",
                // marginBottom: 20,
              }}
            >
              Advanced Analysis
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 30,
              }}
            >
              Unlock unlimited outfit combinations.
            </Text>
            <GradientButton
              title="Upgrade Now"
              onPress={() => router.push("/(root)/subscription" as never)}
              style={{ alignSelf: "flex-start" }}
            />
          </View>
        </Pressable>

        {/* Settings Sections from ClassicProfileUI */}
        <View style={{ marginTop: 10 }}>
          {/* Account Section */}
          <SectionTitle title="Account" />
          <CardContainer>
            <ListItem
              icon={<IconUser size={18} color="#1D1D1D" />}
              title="Personal details"
              onPress={() => router.push("/(root)/personal-details" as never)}
            />
            <ListItem
              icon={<IconSettings size={18} color="#1D1D1D" />}
              title="Preferences"
            />
            <ListItem
              icon={<IconBell size={18} color="#1D1D1D" />}
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
              icon={<IconSpeakerphone size={18} color="#1D1D1D" />}
              title="Request a feature"
              onPress={() => Linking.openURL("https://tally.so/r/9qx7e1")}
            />
            <ListItem
              icon={<IconMail size={18} color="#1D1D1D" />}
              title="Support Email"
              onPress={() =>
                Linking.openURL(
                  "mailto:somgoutam0@gmail.com?subject=Look AI Support&body=Hi Look AI Team,",
                )
              }
            />
            <ListItem
              icon={<IconNotes size={18} color="#1D1D1D" />}
              title="Terms and Conditions"
              onPress={() => router.push("/(root)/terms" as never)}
            />
            <ListItem
              icon={<IconShield size={18} color="#1D1D1D" />}
              title="Privacy policy"
              onPress={() => router.push("/(root)/privacy" as never)}
              hasBorder={false}
            />
          </CardContainer>

          {/* Account Action Section */}
          <SectionTitle title="Account Action" />
          <CardContainer>
            <ListItem
              icon={<IconUserMinus size={18} color="#1D1D1D" />}
              title="Delete account"
              onPress={handleDeleteAccount}
            />
            <ListItem
              icon={
                isLoggingOut ? (
                  <ActivityIndicator size="small" color="#1D1D1D" />
                ) : (
                  <IconLogout size={18} color="#1D1D1D" />
                )
              }
              title="Logout"
              onPress={onLogoutPress}
              hasBorder={false}
            />
          </CardContainer>
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
          <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            <ExploreStyleProfileUI
              user={user}
              router={router}
              notificationsEnabled={notificationsEnabled}
              setNotificationsEnabled={setNotificationsEnabled}
              handleDeleteAccount={handleDeleteAccount}
              isLoggingOut={isLoggingOut}
              onLogoutPress={onLogoutPress}
            />
          </ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
