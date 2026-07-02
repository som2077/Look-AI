import React from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { IconArrowLeft } from "@tabler/icons-react-native";

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconArrowLeft size={24} color="#1D1D1D" />
          </Pressable>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.dateText}>Effective Date: June 21, 2026</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Look AI</Text> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services (collectively, the &quot;App&quot;). By using the App, you agree to the collection and use of information in accordance with this Privacy Policy.
          </Text>

          <Text style={styles.heading}>1. Information Collection</Text>
          <Text style={styles.paragraph}>
            We collect information to provide, maintain, and improve our App. The types of information we may collect include:{"\n"}
            • Personal Information: Information that identifies you, such as your name, email address, and account credentials.{"\n"}
            • Profile Data: Information you provide to personalize your experience, such as fashion preferences, sizing, and gender.{"\n"}
            • Device Information: Information about your mobile device, including OS, device identifiers, and network.{"\n"}
            • Usage Data: Information on how you interact with the App.
          </Text>

          <Text style={styles.heading}>2. User Content, Camera Access, and Photo Uploads</Text>
          <Text style={styles.paragraph}>
            To provide core features such as the digital wardrobe and outfit analysis, our App requires access to your device&apos;s camera and photo gallery.{"\n"}
            • Images and Photos: When you scan an outfit or upload clothing items, we collect these images to provide AI analysis, background removal, and style scoring.{"\n"}
            • User Content: Outfits, posts, comments, likes, and reels you share on our social feed are collected and stored. By posting on the community feed, you understand that your content may be visible to other users.
          </Text>

          <Text style={styles.heading}>3. Location Data</Text>
          <Text style={styles.paragraph}>
            We may request access to your device&apos;s location services to provide weather-based outfit recommendations. You can enable or disable location services at any time through your device settings.
          </Text>

          <Text style={styles.heading}>4. Calendar Access</Text>
          <Text style={styles.paragraph}>
            To enable calendar-based outfit planning, we may request permission to access your device&apos;s calendar. We only access calendar events to suggest suitable outfits and do not store sensitive event details beyond what is required.
          </Text>

          <Text style={styles.heading}>5. AI Processing</Text>
          <Text style={styles.paragraph}>
            Our AI outfit analysis utilizes advanced algorithms. The images and fashion data you upload are processed to generate recommendations. We may use anonymized, aggregated data to train and improve our AI models.
          </Text>

          <Text style={styles.heading}>6. Data Storage and Security</Text>
          <Text style={styles.paragraph}>
            We use industry-standard security measures to protect your personal information and cloud-stored wardrobe images. However, no method of transmission over the internet or electronic storage is 100% secure.
          </Text>

          <Text style={styles.heading}>7. Third-Party Services</Text>
          <Text style={styles.paragraph}>
            We may employ third-party companies and services (such as cloud storage, analytics, and payment processors). These third parties have access to your Personal Information only to perform these tasks on our behalf.
          </Text>

          <Text style={styles.heading}>8. User Rights and Account Deletion</Text>
          <Text style={styles.paragraph}>
            You have the right to access, update, or delete your personal information. You can delete your account and associated data directly within the App&apos;s settings. Upon deletion, your data will be permanently removed from our active servers.
          </Text>

          <Text style={styles.heading}>9. Children&apos;s Privacy</Text>
          <Text style={styles.paragraph}>
            Our App is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children.
          </Text>

          <Text style={styles.heading}>10. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us:{"\n"}
            Email: support@lookai.com{"\n"}
            Website: www.lookai.com
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1D1D1D" },
  scrollContent: { padding: 20 },
  dateText: { fontSize: 14, color: "#6B7280", marginBottom: 20, fontWeight: "500" },
  heading: { fontSize: 18, fontWeight: "700", color: "#111827", marginTop: 24, marginBottom: 8 },
  paragraph: { fontSize: 15, lineHeight: 24, color: "#374151" },
  bold: { fontWeight: "bold" },
});
