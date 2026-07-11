import { IconArrowLeft } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  const router = useRouter();
  const [content, setContent] = useState("Loading privacy policy...");

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/som2077/docs-privacy-policy.md/refs/heads/main/README.md",
    )
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => {
        console.error(err);
        setContent("Failed to load privacy policy.");
      });
  }, []);

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
          <Markdown
            style={{
              body: { fontSize: 15, color: "#4B5563", lineHeight: 24 },
              heading1: {
                fontSize: 22,
                fontWeight: "bold",
                color: "#1D1D1D",
                marginTop: 16,
                marginBottom: 8,
              },
              heading2: {
                fontSize: 18,
                fontWeight: "bold",
                color: "#1D1D1D",
                marginTop: 16,
                marginBottom: 8,
              },
              strong: { fontWeight: "bold", color: "#1D1D1D" },
              listItem: { marginVertical: 4 },
            }}
          >
            {content}
          </Markdown>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
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
  dateText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    fontWeight: "500",
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: { fontSize: 15, lineHeight: 24, color: "#374151" },
  bold: { fontWeight: "bold" },
});
