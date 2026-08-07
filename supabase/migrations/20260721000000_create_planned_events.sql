CREATE TABLE IF NOT EXISTS public.planned_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL, -- Assuming Clerk ID is text, else change to UUID if using Supabase auth
  event_date date NOT NULL,
  event_time time without time zone,
  occasion_label text NOT NULL,
  location text,
  weather_snapshot jsonb,
  suggested_outfit_id text, -- ID of the outfit from Zustand store or backend
  status text DEFAULT 'tentative'::text CHECK (status IN ('tentative', 'confirmed')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planned_events ENABLE ROW LEVEL SECURITY;

-- Policies for planned_events
CREATE POLICY "Users can view their own planned events"
  ON public.planned_events FOR SELECT
  USING (user_id = auth.jwt()->>'sub' OR user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own planned events"
  ON public.planned_events FOR INSERT
  WITH CHECK (user_id = auth.jwt()->>'sub' OR user_id = auth.uid()::text);

CREATE POLICY "Users can update their own planned events"
  ON public.planned_events FOR UPDATE
  USING (user_id = auth.jwt()->>'sub' OR user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own planned events"
  ON public.planned_events FOR DELETE
  USING (user_id = auth.jwt()->>'sub' OR user_id = auth.uid()::text);
