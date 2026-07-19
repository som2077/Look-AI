-- Migration to add push notification columns to user_profiles

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS fcm_token TEXT;
