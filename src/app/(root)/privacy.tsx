import { IconArrowLeft } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text as RNText, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

const Text = (props: any) => {
  const { style, ...rest } = props;
  const flatStyle = StyleSheet.flatten(style || {});
  let fontFamily = flatStyle.fontFamily || "BricolageGrotesque_400Regular";
  
  if (flatStyle.fontWeight === "500") fontFamily = "BricolageGrotesque_500Medium";
  else if (flatStyle.fontWeight === "600") fontFamily = "BricolageGrotesque_600SemiBold";
  else if (flatStyle.fontWeight === "700" || flatStyle.fontWeight === "bold") fontFamily = "BricolageGrotesque_700Bold";
  else if (flatStyle.fontWeight === "800") fontFamily = "BricolageGrotesque_800ExtraBold";

  const { fontWeight, ...cleanStyle } = flatStyle;
  return <RNText style={[cleanStyle, { fontFamily }]} {...rest} />;
};

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
              body: { fontFamily: "BricolageGrotesque_400Regular", fontSize: 15, color: "#4B5563", lineHeight: 24 },
              heading1: { fontFamily: "BricolageGrotesque_700Bold",
                fontSize: 22,
                fontWeight: "bold",
                color: "#1D1D1D",
                // marginTop: 16,
                marginBottom: 8,
              },
              heading2: { fontFamily: "BricolageGrotesque_700Bold",
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
    paddingVertical: 10,
    // marginVertical: 20,
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
