import { ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react-native";
import { IconArrowLeft, IconSend } from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// We build a custom Thread UI wrapping assistant-ui's primitive components
export const StylistThread = () => {
  const router = useRouter();

  return (
    <ThreadPrimitive.Root>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Look AI Stylist</Text>
            <Text style={styles.headerSubtitle}>Powered by assistant-ui</Text>
          </View>
        </View>

        {/* MESSAGES */}
        <ThreadPrimitive.Messages
          components={{
            UserMessage: () => (
              <View style={styles.userBubbleWrap}>
                <View style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>
                    <MessagePrimitive.Content />
                  </Text>
                </View>
              </View>
            ),
            AssistantMessage: () => (
              <View style={styles.aiBubbleWrap}>
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>✨</Text>
                </View>
                <View style={styles.aiContentContainer}>
                  <View style={styles.aiBubble}>
                    <Text style={styles.aiBubbleText}>
                      <MessagePrimitive.Content />
                    </Text>
                  </View>
                </View>
              </View>
            ),
          }}
        />

        {/* COMPOSER */}
        <ComposerPrimitive.Root>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <ComposerPrimitive.Input
                render={({ value, onChangeText, onFocus, onBlur, ...rest }: any) => (
                  <TextInput
                    {...rest}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder="Ask about outfits..."
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    multiline
                  />
                )}
              />
              <ComposerPrimitive.Send asChild>
                 <TouchableOpacity style={styles.sendButton}>
                   <IconSend size={20} color="#FFFFFF" />
                 </TouchableOpacity>
              </ComposerPrimitive.Send>
            </View>
          </View>
        </ComposerPrimitive.Root>

      </View>
    </ThreadPrimitive.Root>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#0D9488', fontWeight: '500' },
  
  userBubbleWrap: { alignItems: 'flex-end', marginBottom: 16, paddingHorizontal: 20, marginTop: 10 },
  userBubble: { backgroundColor: '#111827', padding: 14, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: '80%' },
  userBubbleText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
  
  aiBubbleWrap: { flexDirection: 'row', marginBottom: 16, paddingHorizontal: 20 },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#D1FAE5' },
  aiAvatarText: { fontSize: 16 },
  aiContentContainer: { flex: 1 },
  aiBubble: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 20, borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB', alignSelf: 'flex-start' },
  aiBubbleText: { color: '#111827', fontSize: 15, lineHeight: 24 },

  inputContainer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 24, paddingLeft: 16, paddingRight: 8, paddingVertical: 8 },
  input: { flex: 1, fontSize: 15, color: '#111827', maxHeight: 100, minHeight: 40 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
});
