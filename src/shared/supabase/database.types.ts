export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          nickname: string | null;
          username: string | null;
          age: number | null;
          height: number | null;
          gender: string | null;
          body_type: string | null;
          style_preferences: string[];
          referral_sources: string[];
          avatar_url: string | null;
          bio: string | null;
          about: string | null;
          full_length_photos: string[];
          notifications_enabled: boolean;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nickname?: string | null;
          username?: string | null;
          age?: number | null;
          height?: number | null;
          gender?: string | null;
          body_type?: string | null;
          style_preferences?: string[];
          referral_sources?: string[];
          avatar_url?: string | null;
          bio?: string | null;
          about?: string | null;
          full_length_photos?: string[];
          notifications_enabled?: boolean;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nickname?: string | null;
          username?: string | null;
          age?: number | null;
          height?: number | null;
          gender?: string | null;
          body_type?: string | null;
          style_preferences?: string[];
          referral_sources?: string[];
          avatar_url?: string | null;
          bio?: string | null;
          about?: string | null;
          full_length_photos?: string[];
          notifications_enabled?: boolean;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wardrobe_items: {
        Row: {
          id: string;
          user_id: string;
          custom_name: string | null;
          brand: string | null;
          category: string;
          sub_category: string | null;
          primary_color: string | null;
          color_hex: string | null;
          secondary_colors: string[];
          pattern: string | null;
          fabric_guess: string | null;
          fit: string | null;
          sleeve_type: string | null;
          neck_type: string | null;
          style: string[];
          season: string[];
          occasion: string[];
          formality_score: number | null;
          versatility_tags: string[];
          rating: number;
          care_instructions: string | null;
          notes: string | null;
          image_url: string;
          original_image_url: string | null;
          annotations: Json;
          confidence: number | null;
          source: string | null;
          is_favorite: boolean;
          wear_count: number;
          last_worn_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          custom_name?: string | null;
          brand?: string | null;
          category: string;
          sub_category?: string | null;
          primary_color?: string | null;
          color_hex?: string | null;
          secondary_colors?: string[];
          pattern?: string | null;
          fabric_guess?: string | null;
          fit?: string | null;
          sleeve_type?: string | null;
          neck_type?: string | null;
          style?: string[];
          season?: string[];
          occasion?: string[];
          formality_score?: number | null;
          versatility_tags?: string[];
          rating?: number;
          care_instructions?: string | null;
          notes?: string | null;
          image_url: string;
          original_image_url?: string | null;
          annotations?: Json;
          confidence?: number | null;
          source?: string | null;
          is_favorite?: boolean;
          wear_count?: number;
          last_worn_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          custom_name?: string | null;
          brand?: string | null;
          category?: string;
          sub_category?: string | null;
          primary_color?: string | null;
          color_hex?: string | null;
          secondary_colors?: string[];
          pattern?: string | null;
          fabric_guess?: string | null;
          fit?: string | null;
          sleeve_type?: string | null;
          neck_type?: string | null;
          style?: string[];
          season?: string[];
          occasion?: string[];
          formality_score?: number | null;
          versatility_tags?: string[];
          rating?: number;
          care_instructions?: string | null;
          notes?: string | null;
          image_url?: string;
          original_image_url?: string | null;
          annotations?: Json;
          confidence?: number | null;
          source?: string | null;
          is_favorite?: boolean;
          wear_count?: number;
          last_worn_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wear_logs: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          worn_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          worn_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          worn_at?: string;
        };
      };
      logged_outfits: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          title: string;
          worn_time: string;
          item_count: number;
          score: number | null;
          description: string | null;
          occasion: string | null;
          weather_condition: string | null;
          weather_temp: string | null;
          image_url: string | null;
          is_planned: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          title: string;
          worn_time: string;
          item_count?: number;
          score?: number | null;
          description?: string | null;
          occasion?: string | null;
          weather_condition?: string | null;
          weather_temp?: string | null;
          image_url?: string | null;
          is_planned?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          title?: string;
          worn_time?: string;
          item_count?: number;
          score?: number | null;
          description?: string | null;
          occasion?: string | null;
          weather_condition?: string | null;
          weather_temp?: string | null;
          image_url?: string | null;
          is_planned?: boolean;
          created_at?: string;
        };
      };
      outfit_items: {
        Row: {
          id: string;
          outfit_id: string;
          item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          outfit_id: string;
          item_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          outfit_id?: string;
          item_id?: string;
          created_at?: string;
        };
      };
      fit_check_analyses: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          overall_score: number;
          color_harmony_score: number | null;
          proportion_score: number | null;
          formality_tag: string | null;
          style_tags: string[];
          feedback_notes: string | null;
          strengths: string[];
          improvements: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          overall_score: number;
          color_harmony_score?: number | null;
          proportion_score?: number | null;
          formality_tag?: string | null;
          style_tags?: string[];
          feedback_notes?: string | null;
          strengths?: string[];
          improvements?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          overall_score?: number;
          color_harmony_score?: number | null;
          proportion_score?: number | null;
          formality_tag?: string | null;
          style_tags?: string[];
          feedback_notes?: string | null;
          strengths?: string[];
          improvements?: string[];
          created_at?: string;
        };
      };
      virtual_try_on_generations: {
        Row: {
          id: string;
          user_id: string;
          garment_item_id: string | null;
          garment_image_url: string;
          model_image_url: string;
          result_image_url: string | null;
          status: "pending" | "processing" | "completed" | "failed";
          pose_type: string;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          garment_item_id?: string | null;
          garment_image_url: string;
          model_image_url: string;
          result_image_url?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          pose_type?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          garment_item_id?: string | null;
          garment_image_url?: string;
          model_image_url?: string;
          result_image_url?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          pose_type?: string;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      saved_labels: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          brand: string | null;
          size: string | null;
          fabric_composition: Json;
          care_symbols: Json;
          wash_instruction: string | null;
          dry_instruction: string | null;
          iron_instruction: string | null;
          bleach_instruction: string | null;
          dry_clean_instruction: string | null;
          original_text: string | null;
          translated_text: string | null;
          label_standard_guess: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          brand?: string | null;
          size?: string | null;
          fabric_composition?: Json;
          care_symbols?: Json;
          wash_instruction?: string | null;
          dry_instruction?: string | null;
          iron_instruction?: string | null;
          bleach_instruction?: string | null;
          dry_clean_instruction?: string | null;
          original_text?: string | null;
          translated_text?: string | null;
          label_standard_guess?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          brand?: string | null;
          size?: string | null;
          fabric_composition?: Json;
          care_symbols?: Json;
          wash_instruction?: string | null;
          dry_instruction?: string | null;
          iron_instruction?: string | null;
          bleach_instruction?: string | null;
          dry_clean_instruction?: string | null;
          original_text?: string | null;
          translated_text?: string | null;
          label_standard_guess?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_recommendations: {
        Row: {
          id: string;
          user_id: string;
          suggested_date: string;
          occasion: string | null;
          weather_context: Json;
          outfit_score: number | null;
          style_advice: string | null;
          feedback: "liked" | "disliked" | "neutral" | "worn" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          suggested_date?: string;
          occasion?: string | null;
          weather_context?: Json;
          outfit_score?: number | null;
          style_advice?: string | null;
          feedback?: "liked" | "disliked" | "neutral" | "worn" | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          suggested_date?: string;
          occasion?: string | null;
          weather_context?: Json;
          outfit_score?: number | null;
          style_advice?: string | null;
          feedback?: "liked" | "disliked" | "neutral" | "worn" | null;
          created_at?: string;
        };
      };
      ai_recommendation_items: {
        Row: {
          id: string;
          recommendation_id: string;
          item_id: string;
          slot_category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recommendation_id: string;
          item_id: string;
          slot_category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recommendation_id?: string;
          item_id?: string;
          slot_category?: string | null;
          created_at?: string;
        };
      };
      user_gamification: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          streak_freezes_available: number;
          style_score: number;
          last_logged_date: string | null;
          total_outfits_logged: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          streak_freezes_available?: number;
          style_score?: number;
          last_logged_date?: string | null;
          total_outfits_logged?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          streak_freezes_available?: number;
          style_score?: number;
          last_logged_date?: string | null;
          total_outfits_logged?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      streak_logs: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          activity_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_date: string;
          activity_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_date?: string;
          activity_type?: string;
          created_at?: string;
        };
      };
      planned_events: {
        Row: {
          id: string;
          user_id: string;
          event_date: string;
          event_time: string | null;
          occasion_label: string;
          location: string | null;
          weather_snapshot: Json | null;
          suggested_outfit_id: string | null;
          status: "tentative" | "confirmed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_date: string;
          event_time?: string | null;
          occasion_label: string;
          location?: string | null;
          weather_snapshot?: Json | null;
          suggested_outfit_id?: string | null;
          status?: "tentative" | "confirmed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_date?: string;
          event_time?: string | null;
          occasion_label?: string;
          location?: string | null;
          weather_snapshot?: Json | null;
          suggested_outfit_id?: string | null;
          status?: "tentative" | "confirmed";
          created_at?: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          caption: string | null;
          style_tag: string | null;
          occasion: string | null;
          likes_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          caption?: string | null;
          style_tag?: string | null;
          occasion?: string | null;
          likes_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          caption?: string | null;
          style_tag?: string | null;
          occasion?: string | null;
          likes_count?: number;
          created_at?: string;
        };
      };
      post_reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          reaction_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          reaction_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          reaction_type?: string;
          created_at?: string;
        };
      };
      post_saves: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      entitlements: {
        Row: {
          id: string;
          user_id: string;
          tier: "free" | "pro" | "premium";
          plan_id: string | null;
          status: string;
          purchase_token: string | null;
          order_id: string | null;
          expires_at: string | null;
          grace_period_ends_at: string | null;
          is_auto_renewing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier?: "free" | "pro" | "premium";
          plan_id?: string | null;
          status?: string;
          purchase_token?: string | null;
          order_id?: string | null;
          expires_at?: string | null;
          grace_period_ends_at?: string | null;
          is_auto_renewing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: "free" | "pro" | "premium";
          plan_id?: string | null;
          status?: string;
          purchase_token?: string | null;
          order_id?: string | null;
          expires_at?: string | null;
          grace_period_ends_at?: string | null;
          is_auto_renewing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchase_tokens: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          purchase_token: string;
          order_id: string | null;
          verified_at: string;
          gpb_response: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          purchase_token: string;
          order_id?: string | null;
          verified_at?: string;
          gpb_response?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          purchase_token?: string;
          order_id?: string | null;
          verified_at?: string;
          gpb_response?: Json | null;
        };
      };
      billing_events: {
        Row: {
          id: string;
          user_id: string | null;
          notification_type: string;
          purchase_token: string | null;
          product_id: string | null;
          payload: Json | null;
          processed_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          notification_type: string;
          purchase_token?: string | null;
          product_id?: string | null;
          payload?: Json | null;
          processed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          notification_type?: string;
          purchase_token?: string | null;
          product_id?: string | null;
          payload?: Json | null;
          processed_at?: string;
        };
      };
    };
  };
}
