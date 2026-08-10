import { SupabaseClient } from "@supabase/supabase-js";

// Session flag: user_profiles row only needs to be ensured ONCE per user.
// Previously every scan-save did a redundant upsert (write amplification).
let profileEnsuredFor: string | null = null;

export interface ClothAnalysisResult {
  success: boolean;
  original_url?: string;
  bg_removed_url?: string;
  form_fields?: {
    season?: string;
    occasion?: string;
    category?: string;
    color?: string;
    careInstructions?: string;
    brand?: string;
    notes?: string;
    clothType?: string;
    pattern?: string;
    material?: string;
    fit?: string;
    sleeveType?: string;
    neckType?: string;
    style?: string;
  };
  raw_gemini_vision?: any;
  raw_gemini_flash?: any;
  error?: string;
}

export type ScanSource = "camera" | "gallery" | "barcode" | "label_scan" | "manual";

export async function saveClothToWardrobe(
  supabase: SupabaseClient,
  analysisResult: ClothAnalysisResult,
  scanSource: ScanSource,
  currentUserId: string
) {
  if (!analysisResult.success || !analysisResult.form_fields) {
    return { success: false, error: analysisResult.error || "Analysis failed" };
  }

  const fields = analysisResult.form_fields;

  // Transform comma separated string to array if needed, or wrap in array
  const seasonArray = fields.season
    ? Array.isArray(fields.season)
      ? fields.season
      : fields.season.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const occasionArray = fields.occasion
    ? Array.isArray(fields.occasion)
      ? fields.occasion
      : fields.occasion.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const styleArray = fields.style
    ? Array.isArray(fields.style)
      ? fields.style
      : [fields.style]
    : analysisResult.raw_gemini_vision?.style
      ? [analysisResult.raw_gemini_vision.style]
      : [];

  const imageUrl =
    analysisResult.bg_removed_url ||
    analysisResult.original_url ||
    "";

  // Ensure user profile exists to satisfy foreign key constraint fk_wardrobe_items_user
  // (once per session — see profileEnsuredFor flag at top of file)
  if (profileEnsuredFor !== currentUserId) {
    await supabase
      .from("user_profiles")
      .upsert({ user_id: currentUserId }, { onConflict: "user_id" });
    profileEnsuredFor = currentUserId;
  }

  const { data, error } = await supabase
    .from("wardrobe_items")
    .insert([
      {
        user_id: currentUserId,
        custom_name:
          fields.notes
            ? `${fields.color ? fields.color + " " : ""}${fields.category || "Item"}`
            : fields.brand
              ? `${fields.brand} ${fields.category || "Item"}`
              : fields.category || "Item",
        brand: fields.brand || null,
        category: fields.category || "Top",
        sub_category:
          fields.clothType ||
          analysisResult.raw_gemini_vision?.clothType ||
          null,
        primary_color: fields.color || null,
        secondary_colors: [],
        pattern:
          fields.pattern ||
          analysisResult.raw_gemini_vision?.pattern ||
          null,
        fabric_guess:
          fields.material ||
          analysisResult.raw_gemini_vision?.material ||
          null,
        fit:
          fields.fit ||
          analysisResult.raw_gemini_vision?.fit ||
          null,
        sleeve_type:
          fields.sleeveType ||
          analysisResult.raw_gemini_vision?.sleeve_type ||
          null,
        neck_type:
          fields.neckType ||
          analysisResult.raw_gemini_vision?.neckline ||
          null,
        style: styleArray,
        season: seasonArray,
        occasion: occasionArray,
        formality_score: 3,
        versatility_tags: [],
        rating: 5,
        care_instructions: fields.careInstructions || null,
        notes: fields.notes || null,
        image_url: imageUrl,
        original_image_url: analysisResult.original_url || imageUrl,
        annotations: {
          vision: analysisResult.raw_gemini_vision || {},
          flash: analysisResult.raw_gemini_flash || {},
        },
        confidence: 0.95,
        source: scanSource || "camera",
        is_favorite: false,
        wear_count: 0,
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("Error saving cloth to wardrobe:", error);
    return { success: false, error: error.message };
  }

  return { success: true, itemId: data.id };
}
