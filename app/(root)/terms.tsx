import React from "react";
import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { IconArrowLeft } from "@tabler/icons-react-native";

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconArrowLeft size={24} color="#1D1D1D" />
          </Pressable>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.dateText}>Effective Date: June 21, 2026</Text>

          <Text style={styles.paragraph}>
            Welcome to <Text style={styles.bold}>Look AI</Text> ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our mobile application and related services (collectively, the "App").
          </Text>

          <Text style={styles.heading}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By downloading, installing, accessing, or using the App, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use the App.
          </Text>

          <Text style={styles.heading}>2. User Accounts</Text>
          <Text style={styles.paragraph}>
            To access certain features of the App, such as the digital wardrobe and social community, you must register for an account.{"\n"}
            • You are responsible for maintaining the confidentiality of your account credentials.{"\n"}
            • You agree to provide accurate, current, and complete information during the registration process.{"\n"}
            • You are solely responsible for all activities that occur under your account.
          </Text>

          <Text style={styles.heading}>3. User Responsibilities and Community Guidelines</Text>
          <Text style={styles.paragraph}>
            Look AI provides a social platform to share outfits and fashion inspiration. You agree to use the App in a respectful and lawful manner. You agree not to:{"\n"}
            • Post content that is unlawful, harmful, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.{"\n"}
            • Impersonate any person or entity or falsely state your affiliation with a person or entity.{"\n"}
            • Upload viruses, malicious code, or engage in any activity that disrupts the functionality of the App.{"\n"}
            • Scrape, collect, or harvest data from the App without our explicit permission.
          </Text>

          <Text style={styles.heading}>4. User Generated Content</Text>
          <Text style={styles.paragraph}>
            You retain ownership of any content you upload, including photos, videos, posts, comments, and wardrobe data ("User Content").{"\n"}
            • By uploading User Content, you grant us a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, distribute, prepare derivative works of, and display that content in connection with providing and promoting the App.{"\n"}
            • You represent and warrant that you have the rights to grant this license and that your User Content does not infringe on the intellectual property rights of others.
          </Text>

          <Text style={styles.heading}>5. AI Recommendation Disclaimer</Text>
          <Text style={styles.paragraph}>
            Our AI outfit analysis, style scoring, and weather-based recommendations are provided for informational and entertainment purposes only.{"\n"}
            • Fashion is subjective, and we do not guarantee the accuracy, suitability, or reliability of any AI-generated advice.{"\n"}
            • You are solely responsible for your wardrobe choices.
          </Text>

          <Text style={styles.heading}>6. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All intellectual property rights in the App (excluding User Content), including but not limited to software, AI algorithms, design, text, graphics, and logos, are owned by us or our licensors. You may not copy, modify, distribute, or create derivative works based on our intellectual property without our prior written consent.
          </Text>

          <Text style={styles.heading}>7. Subscription and Payments</Text>
          <Text style={styles.paragraph}>
            Look AI may offer premium features through optional subscription plans.{"\n"}
            • Billing: If you choose to subscribe, you agree to pay the applicable fees. Subscriptions are billed on a recurring basis via the respective App Store.{"\n"}
            • Cancellation: You may cancel your subscription at any time through your App Store account settings. Cancellations will take effect at the end of the current billing cycle. No refunds will be provided for partial subscription periods.
          </Text>

          <Text style={styles.heading}>8. Account Suspension and Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your account and access to the App at our sole discretion, without notice or liability, for any reason, including but not limited to a breach of these Terms.
          </Text>

          <Text style={styles.heading}>9. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by applicable law, in no event shall Look AI, its affiliates, directors, employees, or agents be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data, or other intangible losses, arising out of or relating to the use of, or inability to use, the App.
          </Text>

          <Text style={styles.heading}>10. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which Look AI is established, without regard to its conflict of law provisions.
          </Text>

          <Text style={styles.heading}>11. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of significant changes through the App or via email. By continuing to access or use our App after those revisions become effective, you agree to be bound by the revised terms.
          </Text>

          <Text style={styles.heading}>12. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us at:{"\n"}
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
