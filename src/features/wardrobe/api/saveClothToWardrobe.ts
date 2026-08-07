import { SupabaseClient } from "@supabase/supabase-js";

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
  };
  raw_gemini_vision?: any;
  raw_gemini_flash?: any;
  error?: string;
}

export type ScanSource = "camera" | "gallery";

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
  const seasonArray = fields.season ? fields.season.split(",").map(s => s.trim()) : [];
  const occasionArray = fields.occasion ? fields.occasion.split(",").map(s => s.trim()) : [];

  const { data, error } = await supabase
    .from("wardrobe_items")
    .insert([
      {
        user_id: currentUserId,
        original_image_url: analysisResult.original_url,
        bg_removed_image_url: analysisResult.bg_removed_url,
        image_url: analysisResult.bg_removed_url, // fallback for app display
        raw_ai_data: {
          vision: analysisResult.raw_gemini_vision,
          flash: analysisResult.raw_gemini_flash,
        },
        season: seasonArray,
        occasion: occasionArray,
        category: fields.category || "Unknown",
        cloth_color: fields.color,
        primary_color: fields.color, // For backward compatibility
        care_instructions: fields.careInstructions,
        brand: fields.brand,
        notes: fields.notes,
        scan_source: scanSource,
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("Error saving cloth to wardrobe:", error);
    return { success: false, error: error.message };
  }

  // Optional: Emit event/notification for wardrobe update (for store refresh)
  // e.g., DeviceEventEmitter.emit("WARDROBE_UPDATED");

  return { success: true, itemId: data.id };
}
