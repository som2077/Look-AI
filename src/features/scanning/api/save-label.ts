import { SupabaseClient } from "@supabase/supabase-js";
import { uploadToCloudinary } from "@/shared/cloudinary/client";
import { LabelAnalysis } from "./ai-scan";
import { captureFeatureError, addAppBreadcrumb } from "@/shared/telemetry/sentry";

export interface SaveLabelParams {
  supabase: SupabaseClient;
  userId: string;
  photoUri: string;
  analysis: LabelAnalysis;
}

export const saveLabelToDatabase = async ({
  supabase,
  userId,
  photoUri,
  analysis,
}: SaveLabelParams): Promise<boolean> => {
  addAppBreadcrumb('cloth_label', 'Started saving cloth label to database');
  
  if (analysis.is_valid_apparel === false) {
    console.warn("Attempted to save an invalid label. Aborting save.");
    return false;
  }
  
  try {
    // 1. Upload image to Cloudinary
    // We upload to a specific folder 'wardrobe_labels' to keep it organized
    const cloudinaryUrl = await uploadToCloudinary(photoUri, "wardrobe_labels");

    if (!cloudinaryUrl) {
      throw new Error("Failed to upload image to Cloudinary");
    }

    // 2. Save to Supabase 'saved_labels' table
    const { error } = await supabase.from("saved_labels").insert({
      user_id: userId,
      image_url: cloudinaryUrl,
      care_symbols: analysis.care_symbols,
      translated_text: analysis.instructions, // Saving instructions here to avoid DB migration
      label_standard_guess: analysis.label_standard_guess,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error("Failed to save label data to database");
    }

    return true;
  } catch (error) {
    captureFeatureError(error, 'cloth_label', 'save_to_database', 'network_error');
    console.error("Error saving label:", error);
    return false;
  }
};
