-- Migration: Remove bio and about columns from user_profiles table

ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS about;
