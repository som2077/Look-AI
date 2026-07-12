import { useOnboardingState } from "@/features/onboarding/model/onboarding-store";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "@/features/scanning/api/cloudinary-upload";
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
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
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
        borderWidth: 0.9,
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
          backgroundColor: "#E5E7EB90",
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
  const { nickname, username } = useOnboardingState();
  const displayName = nickname || user?.fullName || "Your Name";
  const displayUsername = username || user?.username || "";
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
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
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
      "Delete Account?",
      "Are you sure you want to delete your account and data permanently? This action cannot be undone. If you have any active subscription, please cancel it first. You need to login again to compete this process.\n\nNote: Deleting account will not reset your credits, we give only 3 free credits per device. See credit packs if you need more credits",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              setIsDeletingAccount(true);

              // 1. Collect all Cloudinary URLs from database
              const cloudinaryUrls: string[] = [];
              const { data: outfits } = await supabase
                .from("outfits")
                .select("image_url")
                .eq("user_id", user.id);
              const { data: posts } = await supabase
                .from("community_posts")
                .select("image_url")
                .eq("user_id", user.id);

              if (outfits)
                outfits.forEach(
                  (o: any) => o.image_url && cloudinaryUrls.push(o.image_url),
                );
              if (posts)
                posts.forEach(
                  (p: any) => p.image_url && cloudinaryUrls.push(p.image_url),
                );

              // 2. Delete from Cloudinary
              for (const url of cloudinaryUrls) {
                const publicId = extractPublicIdFromUrl(url);
                if (publicId) await deleteFromCloudinary(publicId);
              }

              // 3. Delete Supabase Storage bucket files (full-length-pics)
              const { data: files } = await supabase.storage
                .from("full-length-pics")
                .list(user.id);
              if (files && files.length > 0) {
                const filePaths = files.map(
                  (file: any) => `${user.id}/${file.name}`,
                );
                await supabase.storage
                  .from("full-length-pics")
                  .remove(filePaths);
              }

              // 4. Delete user data from Supabase (user_profiles etc)
              await supabase
                .from("user_profiles")
                .delete()
                .eq("user_id", user.id);

              // 5. Delete user from Clerk
              await user.delete();

              // Clerk will automatically handle the session termination and redirect
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete account");
            } finally {
              setIsDeletingAccount(false);
            }
          },
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
            <ProfileScreenUI
              user={user}
              router={router}
              notificationsEnabled={notificationsEnabled}
              setNotificationsEnabled={setNotificationsEnabled}
              handleDeleteAccount={handleDeleteAccount}
              isLoggingOut={isLoggingOut}
              isDeletingAccount={isDeletingAccount}
              onLogoutPress={onLogoutPress}
            />
          </ScrollView>
        </SafeAreaView>
      </AppGradientBackground>
    </SwipeTabWrapper>
  );
}
