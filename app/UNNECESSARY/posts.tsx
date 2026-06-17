import React, { memo, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { useSupabase } from "@/backend/hooks/useSupabase";
import { useSupabaseQuery } from "@/backend/hooks/useSupabaseQuery";

type Post = {
  id: string;
  user_id: string;
  content: string | null;
  created_at: string;
};

const CONTENT_CONTAINER_STYLE = { paddingTop: 16, gap: 12 };

const PostItem = memo(function PostItem({ item }: { item: Post }) {
  return (
    <View className="rounded-md border border-gray-200 p-3">
      <Text className="text-xs text-gray-500">{item.user_id}</Text>
      <Text className="mt-1 text-base">{item.content ?? "(empty)"}</Text>
      <Text className="mt-1 text-xs text-gray-400">
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );
});

const keyExtractor = (item: Post) => item.id;
const renderItem = ({ item }: { item: Post }) => <PostItem item={item} />;

export default function PostsScreen() {
  const { user } = useUser();
  const { supabase, isInitializing } = useSupabase();
  const {
    data: posts,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Post>("posts", {
    apply: (query) => query.order("created_at", { ascending: false }),
    enabled: !!user,
  });

  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onCreatePost = useCallback(async () => {
    if (!user) {
      setSaveError("You must be signed in.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: user.id,
      content,
    });

    if (insertError) {
      setSaveError(insertError.message);
      setIsSaving(false);
      return;
    }

    setContent("");
    setIsSaving(false);
    await refetch();
  }, [user, supabase, content, refetch]);

  if (isInitializing || loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-4">
      <Text className="mb-2 text-2xl font-bold">Posts</Text>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Write something..."
        className="mb-3 rounded-md border border-gray-300 px-3 py-2"
      />
      <Button
        title={isSaving ? "Saving..." : "Create post"}
        onPress={onCreatePost}
        disabled={isSaving}
      />

      {(error || saveError) && (
        <Text className="mt-3 text-red-500">{saveError ?? error?.message}</Text>
      )}

      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        contentContainerStyle={CONTENT_CONTAINER_STYLE}
        renderItem={renderItem}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
      />
    </SafeAreaView>
  );
}
