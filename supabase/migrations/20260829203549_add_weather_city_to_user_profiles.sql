-- Persist the user's home city for the AI to default to when calling show_weather.
-- Populated by the client after a successful location permission grant; falls back
-- gracefully to null if the user never grants permission or moves cities.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS weather_city TEXT;
