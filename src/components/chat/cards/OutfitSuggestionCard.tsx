// OutfitSuggestionCard — rich outfit suggestion with reasoning + Save.
//
// Visual design (premium lookbook feel):
//   ┌─────────────────────────────────────┐
//   │  [hero image — 1:1 square]          │   The "focal piece" — usually
//   │                                     │   the first item. Soft rounded
//   │                                     │   corners, no harsh border.
//   │  ●  ●  ●  ●      (thumbnails)       │   Remaining items as small dots
//   │                                     │   so the user knows the rest.
//   │                                     │
//   │  CASUAL COLLEGE LOOK                │   Small uppercase eyebrow label
//   │                                     │
//   │  Gray hoodie + blue jeans + white   │   Italic "why" in muted ink
//   │  tee — relaxed but put-together    │
//   │                                     │
//   │  Comfy for classes.                 │   "style_note" — small caption
//   │                                     │
//   │  ┌─ pill ────────────────────┐      │
//   │  │  ♡  Save to my looks      │      │   Pill save button with heart
//   │  └───────────────────────────┘      │
//   │  ✓ Saved to your looks              │   Confirmed state
//   └─────────────────────────────────────┘
//
// Data shape (consumed from the resolve-outfit endpoint):
//   {
//     occasion: string,
//     outfits: Array<{
//       label, items[{id, name, category, image_url?}],
//       style_note, why?, score?
//     }>,
//     note?, wardrobe_size?
//   }

import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  IconBookmark,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react-native";

export interface OutfitSuggestionItem {
  id?: string;
  name: string;
  category: string;
  image_url?: string;
}

export interface OutfitSuggestionOutfit {
  label: string;
  items: OutfitSuggestionItem[];
  style_note: string;
  why?: string;
  score?: number;
}

export interface OutfitSuggestionData {
  occasion: string;
  outfits: OutfitSuggestionOutfit[];
  /** Optional top-level message (e.g. "Could not load items"). */
  note?: string;
  /** Total number of items in the user's wardrobe. */
  wardrobe_size?: number;
}

export interface OutfitSuggestionCardProps {
  data: OutfitSuggestionData;
  /** Called when the user taps Save on an outfit. */
  onSave?: (outfit: OutfitSuggestionOutfit) => Promise<void> | void;
}

const CARD_WIDTH = 296;
const HERO_SIZE = CARD_WIDTH - 32; // paddingHorizontal 16 on each side
const THUMB_SIZE = 44;
const THUMB_GAP = 8;

function Thumb({ item }: { item: OutfitSuggestionItem }) {
  return (
    <View style={styles.thumb}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.thumbImage} />
      ) : (
        <View style={[styles.thumbImage, styles.thumbFallback]}>
          <Text style={styles.thumbFallbackEmoji}>👕</Text>
        </View>
      )}
    </View>
  );
}

export function OutfitSuggestionCard({ data, onSave }: OutfitSuggestionCardProps) {
  const { occasion, outfits, note, wardrobe_size } = data;
  const showVarietyHint =
    typeof wardrobe_size === "number" &&
    wardrobe_size > 0 &&
    wardrobe_size < 5 &&
    outfits.length > 0;

  if (note && outfits.length === 0) {
    // Empty-state: only the note is shown, no carousel.
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <IconSparkles size={22} color="#7C3AED" strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptyBody}>{note}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {note ? note : `Here's what you can wear for ${occasion}:`}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {outfits.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <IconSparkles size={22} color="#7C3AED" strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyBody}>
              I couldn&apos;t match any of the items in your wardrobe. Try
              adding a few more pieces, or ask me again with a different
              occasion.
            </Text>
          </View>
        ) : (
          outfits.map((outfit, i) => (
            <OutfitColumn key={i} outfit={outfit} onSave={onSave} />
          ))
        )}
      </ScrollView>
      {showVarietyHint ? (
        <View style={styles.hint}>
          <IconSparkles size={14} color="#9A3412" strokeWidth={1.8} />
          <Text style={styles.hintText}>
            Aur variety ke liye 2-3 items aur scan karo — abhi wardrobe
            mein sirf {wardrobe_size} hain.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function OutfitColumn({
  outfit,
  onSave,
}: {
  outfit: OutfitSuggestionOutfit;
  onSave?: OutfitSuggestionCardProps['onSave'];
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!onSave || saving || saved) return;
    setSaving(true);
    try {
      await onSave(outfit);
      setSaved(true);
    } catch (err) {
      console.warn('[OutfitSuggestionCard] save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const hasItems = outfit.items.length > 0;
  const [hero, ...rest] = outfit.items;
  const restItems = rest.slice(0, 4);
  const overflow = Math.max(0, outfit.items.length - (1 + restItems.length));

  return (
    <View style={styles.card}>
      {/* Hero image — the first item in the outfit. Falls back to a soft
          gradient + emoji if the item has no photo. */}
      {hasItems ? (
        <View style={styles.heroWrap}>
          {hero?.image_url ? (
            <Image source={{ uri: hero.image_url }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroFallback]}>
              <Text style={styles.heroFallbackEmoji}>👕</Text>
            </View>
          )}
          {/* Hero's category pill — small, top-left. */}
          {hero?.category ? (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{hero.category}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Rest of the items as small thumbnails. */}
      {hasItems && restItems.length > 0 ? (
        <View style={styles.thumbsRow}>
          {restItems.map((it, j) => (
            <Thumb key={j} item={it} />
          ))}
          {overflow > 0 ? (
            <View style={[styles.thumb, styles.thumbOverflow]}>
              <Text style={styles.thumbOverflowText}>+{overflow}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Label (eyebrow style) + the full names of every item. */}
      <View style={styles.labelBlock}>
        <Text style={styles.labelEyebrow}>{outfit.label}</Text>
        {hasItems ? (
          <Text style={styles.itemNames} numberOfLines={2}>
            {outfit.items.map((it) => it.name).join(" · ")}
          </Text>
        ) : null}
      </View>

      {/* "Why this works" reasoning. */}
      {outfit.why ? (
        <View style={styles.whyBlock}>
          <IconSparkles size={13} color="#7C3AED" strokeWidth={1.8} />
          <Text style={styles.whyText}>{outfit.why}</Text>
        </View>
      ) : null}

      {/* Style note (one-line caption). */}
      {outfit.style_note ? (
        <Text style={styles.note}>{outfit.style_note}</Text>
      ) : null}

      {/* Save / Saved pill. */}
      {onSave ? (
        <TouchableOpacity
          style={[
            styles.saveBtn,
            saved ? styles.saveBtnDone : null,
            saving ? styles.saveBtnSaving : null,
          ]}
          onPress={handleSave}
          disabled={saving || saved}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : saved ? (
            <>
              <IconCheck size={15} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.saveBtnTextDone}>Saved to your looks</Text>
            </>
          ) : (
            <>
              <IconBookmark
                size={15}
                color="#FFFFFF"
                strokeWidth={2}
              />
              <Text style={styles.saveBtnText}>Save to my looks</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      {!hasItems ? (
        <View style={styles.emptyOutfitBody}>
          <Text style={styles.emptyOutfitText}>
            None of the items I tried could be found in your wardrobe.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingLeft: 16, marginBottom: 12 },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 14,
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  scroll: { gap: 14, paddingRight: 16 },
  // Card — soft, premium feel matching WeatherCard's 24px radius.
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F1F4',
  },
  // Hero image — square, fills the card width minus padding.
  heroWrap: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  hero: { width: '100%', height: '100%' },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  heroFallbackEmoji: { fontSize: 56 },
  // Category pill that sits over the hero image (top-left).
  heroBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  // Thumbnails of the remaining items in a row.
  thumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: THUMB_GAP,
    marginTop: 12,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#F1F1F4',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbFallbackEmoji: { fontSize: 18 },
  thumbOverflow: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  thumbOverflowText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  // Label + item names block.
  labelBlock: { marginTop: 14 },
  labelEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemNames: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  // "Why this works" — light purple wash, sparkle icon prefix.
  whyBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
    marginTop: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  whyText: {
    flex: 1,
    fontSize: 13,
    color: '#4C1D95',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // Style note (small caption below the why).
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    lineHeight: 17,
  },
  // Pill-shaped save button.
  saveBtn: {
    marginTop: 14,
    backgroundColor: '#1D1A27',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  saveBtnSaving: { backgroundColor: '#4B5563' },
  saveBtnDone: { backgroundColor: '#10B981' },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  saveBtnTextDone: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  // Empty card.
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: '#F1F1F4',
    borderStyle: 'dashed',
    alignItems: 'flex-start',
  },
  emptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  emptyOutfitBody: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  emptyOutfitText: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  // Low-wardrobe hint shown under the cards.
  hint: {
    marginTop: 10,
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 17,
  },
});
