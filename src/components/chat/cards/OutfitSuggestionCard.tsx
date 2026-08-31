// OutfitSuggestionCard — rich outfit suggestion with reasoning + Save.
//
// Visual design (atelier mood-board feel):
//   ┌─────────────────────────────────────┐
//   │  CASUAL COLLEGE LOOK                │   Italic small-caps eyebrow in
//   │                                     │   deep clay — feels like a
//   │  [hero image — 4:5 portrait]         │   curatorial label, not a UI tag.
//   │                                     │
//   │  ●  ●  ●  ●   (filmstrip thumbs)    │   Remaining items as a horizontal
//   │                                     │   strip below the hero.
//   │  Gray hoodie · Blue jeans · Tee     │   Item names joined by middots.
//   │                                     │
//   │  ╭ Why this works ────────────╮     │   Italic "why" in clay wash
//   │  │ Comfy for classes.         │     │
//   │  ╰────────────────────────────╯     │
//   │                                     │
//   │  ┌─ pill ────────────────────┐      │
//   │  │  ♡  Save to my looks      │      │
//   │  └───────────────────────────┘      │
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
import { colors, FONT_FAMILY, font, radii, space } from "@/components/ai-elements";

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
const CARD_PADDING = 14;
const HERO_W = CARD_WIDTH - CARD_PADDING * 2;
const HERO_H = Math.round(HERO_W * 1.2); // 4:5 portrait
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
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {`Here's what you can wear for ${occasion}:`}
        </Text>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <IconSparkles size={20} color={colors.brand} strokeWidth={1.6} />
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
              <IconSparkles size={20} color={colors.brand} strokeWidth={1.6} />
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
          <IconSparkles size={13} color={colors.brand} strokeWidth={1.8} />
          <Text style={styles.hintText}>
            For more variety, scan 2-3 more pieces — your wardrobe
            currently has only {wardrobe_size}.
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
      {/* Italic small-caps eyebrow label in clay — the curatorial
          headline that tells the user what kind of look this is. */}
      <Text style={styles.labelEyebrow}>{outfit.label}</Text>

      {/* Hero image — 4:5 portrait, less dominant than a square.
          Falls back to a soft warm surface + emoji if no photo. */}
      {hasItems ? (
        <View style={styles.heroWrap}>
          {hero?.image_url ? (
            <Image source={{ uri: hero.image_url }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroFallback]}>
              <Text style={styles.heroFallbackEmoji}>👕</Text>
            </View>
          )}
          {/* Category pill — quiet, sits on a clay-tinted wash so it
              doesn't shout over the hero. */}
          {hero?.category ? (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{hero.category}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Item names — a single italic line of the pieces joined by
          middots, just under the hero. Reads as a caption, not a list. */}
      {hasItems ? (
        <Text style={styles.itemNames} numberOfLines={2}>
          {outfit.items.map((it) => it.name).join(" · ")}
        </Text>
      ) : null}

      {/* Filmstrip of remaining items as small thumbnails. */}
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

      {/* "Why this works" reasoning — italic on a clay wash. */}
      {outfit.why ? (
        <View style={styles.whyBlock}>
          <IconSparkles size={13} color={colors.brand} strokeWidth={1.8} />
          <Text style={styles.whyText}>{outfit.why}</Text>
        </View>
      ) : null}

      {/* Style note — quiet italic caption. */}
      {outfit.style_note ? (
        <Text style={styles.note}>{outfit.style_note}</Text>
      ) : null}

      {/* Save / Saved pill — clay-tinted idle, ink-tinted active,
          moss-tinted confirmed. States are visually distinct. */}
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
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : saved ? (
            <>
              <IconCheck size={15} color={colors.textInverse} strokeWidth={2.4} />
              <Text style={styles.saveBtnTextDone}>Saved to your looks</Text>
            </>
          ) : (
            <>
              <IconBookmark size={15} color={colors.brand} strokeWidth={2} />
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
  container: { paddingLeft: space.lg, marginBottom: space.md },
  title: {
    fontSize: font.h2,
    fontWeight: '600',
    marginBottom: 14,
    color: colors.text,
    letterSpacing: -0.3,
    fontFamily: FONT_FAMILY['600'],
  },
  scroll: { gap: 12, paddingRight: space.lg },
  // Card — soft warm surface, hairline border, no harsh shadow.
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: CARD_PADDING,
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  // Eyebrow label — italic small-caps in clay. Reads as a curatorial
  // caption, not a UI tag. 1.4px tracking and uppercase spacing keep
  // it tight against the hero image below.
  labelEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    color: colors.brand,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    fontFamily: FONT_FAMILY['600'],
    marginBottom: 10,
  },
  // Hero image — 4:5 portrait, smaller than the previous 1:1 square.
  heroWrap: {
    width: HERO_W,
    height: HERO_H,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
    marginBottom: 12,
  },
  hero: { width: '100%', height: '100%' },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  heroFallbackEmoji: { fontSize: 56 },
  // Category pill over the hero — clay-tinted wash, never bright white.
  heroBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(247,233,218,0.94)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: FONT_FAMILY['700'],
  },
  // Item names — italic, soft ink. A caption, not a list.
  itemNames: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
    fontFamily: FONT_FAMILY['400'],
    marginBottom: 12,
  },
  // Thumbnails — a small filmstrip below the hero.
  thumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: THUMB_GAP,
    marginBottom: 14,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbFallbackEmoji: { fontSize: 18 },
  thumbOverflow: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  thumbOverflowText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  // "Why this works" — italic on clay wash, ink accent.
  whyBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
    backgroundColor: colors.brandBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  whyText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    fontStyle: 'italic',
    fontFamily: FONT_FAMILY['400'],
  },
  // Style note (small caption).
  note: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 6,
    fontFamily: FONT_FAMILY['400'],
  },
  // Save button — clay-tinted idle, ink active, moss confirmed.
  saveBtn: {
    marginTop: 12,
    backgroundColor: colors.brandBg,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  saveBtnSaving: { backgroundColor: colors.textMuted, borderColor: colors.textMuted },
  saveBtnDone: { backgroundColor: colors.success, borderColor: colors.success },
  saveBtnText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    fontFamily: FONT_FAMILY['600'],
  },
  saveBtnTextDone: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    fontFamily: FONT_FAMILY['600'],
  },
  // Empty card.
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 22,
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
    alignItems: 'flex-start',
  },
  emptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    fontFamily: FONT_FAMILY['600'],
  },
  emptyBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    fontFamily: FONT_FAMILY['400'],
  },
  emptyOutfitBody: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  emptyOutfitText: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  // Low-wardrobe hint.
  hint: {
    marginTop: 12,
    marginRight: space.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.brandBg,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
    fontFamily: FONT_FAMILY['400'],
  },
});
