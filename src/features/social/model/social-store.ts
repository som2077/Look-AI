import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  namespacedAsyncStorage,
  registerStoreRehydration,
  registerStoreReset,
} from "@/shared/storage/namespacedStorage";

export interface Group {
  id: string;
  name: string;
  members: number;
  description: string;
  avatars: string[];
  image: string;
  color: string;
}

export interface Post {
  id: string;
  username: string;
  avatar: string;
  timeAgo: string;
  content: string;
  replyCount: number;
  reactions: Record<string, number>;
  myReaction: string | null;
}

const INITIAL_GROUPS: Group[] = [
  {
    id: "1",
    name: "Minimalist Style",
    members: 3200,
    description: "Clean looks, timeless pieces & effortless fashion.",
    avatars: [
      "https://i.pravatar.cc/40?img=10",
      "https://i.pravatar.cc/40?img=11",
      "https://i.pravatar.cc/40?img=12",
    ],
    image: "https://i.pravatar.cc/80?img=10",
    color: "#E8E4F3",
  },
  {
    id: "2",
    name: "Trending Fashion",
    members: 5100,
    description: "Explore the latest styles loved by the community.",
    avatars: [
      "https://i.pravatar.cc/40?img=20",
      "https://i.pravatar.cc/40?img=21",
      "https://i.pravatar.cc/40?img=22",
    ],
    image: "https://i.pravatar.cc/80?img=20",
    color: "#F3E8E8",
  },
  {
    id: "3",
    name: "Streetwear & Urban",
    members: 8700,
    description: "Urban fits, sneakers & modern street fashion.",
    avatars: [
      "https://i.pravatar.cc/40?img=30",
      "https://i.pravatar.cc/40?img=31",
      "https://i.pravatar.cc/40?img=32",
    ],
    image: "https://i.pravatar.cc/80?img=30",
    color: "#E8F3E8",
  },
  {
    id: "4",
    name: "Y2K Revival",
    members: 4200,
    description: "Bringing back the early 2000s aesthetic.",
    avatars: [
      "https://i.pravatar.cc/40?img=40",
      "https://i.pravatar.cc/40?img=41",
      "https://i.pravatar.cc/40?img=42",
    ],
    image: "https://i.pravatar.cc/80?img=40",
    color: "#F3EBE8",
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "1",
    username: "sarah_k",
    avatar: "https://i.pravatar.cc/80?img=1",
    timeAgo: "3d",
    content:
      "Find looks for every occasion. Browse community style ideas. Save outfits you love. Create your next perfect fit.",
    replyCount: 0,
    reactions: {},
    myReaction: null,
  },
  {
    id: "2",
    username: "james_m",
    avatar: "https://i.pravatar.cc/80?img=2",
    timeAgo: "1d",
    content:
      "Loving the oversized tees trend right now. So comfortable and pairs well with almost any bottom.",
    replyCount: 2,
    reactions: { "😂": 2 },
    myReaction: null,
  },
  {
    id: "3",
    username: "priya_v",
    avatar: "https://i.pravatar.cc/80?img=3",
    timeAgo: "2h",
    content:
      "What are your thoughts on pairing sneakers with a formal suit? Is it a hit or miss?",
    replyCount: 5,
    reactions: { "👍": 3, "❤️": 1 },
    myReaction: null,
  },
  {
    id: "4",
    username: "alex_t",
    avatar: "https://i.pravatar.cc/80?img=4",
    timeAgo: "30m",
    content:
      "Loving this community! The style ideas here are truly amazing and inspiring every day.",
    replyCount: 0,
    reactions: {},
    myReaction: null,
  },
];

interface SocialState {
  groups: Group[];
  joinedGroupIds: string[];
  postsByGroup: Record<string, Post[]>;

  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  addPost: (
    groupId: string,
    content: string,
    username: string,
    avatar: string,
  ) => void;
  toggleReaction: (groupId: string, postId: string, emoji: string) => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      groups: INITIAL_GROUPS,
      joinedGroupIds: [],
      // Initialize mock posts for all initial groups so they aren't empty
      postsByGroup: INITIAL_GROUPS.reduce(
        (acc, group) => {
          acc[group.id] = [...INITIAL_POSTS].map((p) => ({
            ...p,
            id: `${group.id}-${p.id}`,
          }));
          return acc;
        },
        {} as Record<string, Post[]>,
      ),

      joinGroup: (groupId) =>
        set((state) => {
          if (state.joinedGroupIds.includes(groupId)) return state;
          return { joinedGroupIds: [...state.joinedGroupIds, groupId] };
        }),

      leaveGroup: (groupId) =>
        set((state) => ({
          joinedGroupIds: state.joinedGroupIds.filter((id) => id !== groupId),
        })),

      addPost: (groupId, content, username, avatar) =>
        set((state) => {
          const newPost: Post = {
            id: Date.now().toString(),
            username,
            avatar,
            timeAgo: "just now",
            content,
            replyCount: 0,
            reactions: {},
            myReaction: null,
          };
          const currentPosts = state.postsByGroup[groupId] || [];
          return {
            postsByGroup: {
              ...state.postsByGroup,
              [groupId]: [newPost, ...currentPosts],
            },
          };
        }),

      toggleReaction: (groupId, postId, emoji) =>
        set((state) => {
          const currentPosts = state.postsByGroup[groupId] || [];
          const postIndex = currentPosts.findIndex((p) => p.id === postId);
          if (postIndex === -1) return state;

          const newPosts = [...currentPosts];
          const post = { ...newPosts[postIndex] };
          const newReactions = { ...post.reactions };

          // If reacting with the same emoji, remove it
          if (post.myReaction === emoji) {
            newReactions[emoji] = Math.max(0, (newReactions[emoji] || 1) - 1);
            if (newReactions[emoji] === 0) delete newReactions[emoji];
            post.myReaction = null;
          } else {
            // Remove old reaction if exists
            if (post.myReaction) {
              newReactions[post.myReaction] = Math.max(
                0,
                (newReactions[post.myReaction] || 1) - 1,
              );
              if (newReactions[post.myReaction] === 0)
                delete newReactions[post.myReaction];
            }
            // Add new reaction
            newReactions[emoji] = (newReactions[emoji] || 0) + 1;
            post.myReaction = emoji;
          }

          post.reactions = newReactions;
          newPosts[postIndex] = post;

          return {
            postsByGroup: {
              ...state.postsByGroup,
              [groupId]: newPosts,
            },
          };
        }),
    }),
    {
      name: "look-ai-social-storage",
      storage: createJSONStorage(() => namespacedAsyncStorage),
    },
  ),
);

registerStoreRehydration(() => useSocialStore.persist.rehydrate());
registerStoreReset(() =>
  useSocialStore.setState({ joinedGroupIds: [], postsByGroup: {} })
);
