create table public.calendar_plans (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  date date not null,
  time text,
  title text not null,
  occasion text,
  outfit_items jsonb default '[]'::jsonb,
  ai_note text,
  created_via text default 'style_chat',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.calendar_plans enable row level security;

-- Policy to allow users to view their own plans
create policy "Users can view their own calendar plans"
  on public.calendar_plans for select
  using (user_id = auth.jwt()->>'sub' or user_id = auth.uid()::text);

-- Policy to allow users to insert their own plans
create policy "Users can insert their own calendar plans"
  on public.calendar_plans for insert
  with check (user_id = auth.jwt()->>'sub' or user_id = auth.uid()::text);

-- Policy to allow users to update their own plans
create policy "Users can update their own calendar plans"
  on public.calendar_plans for update
  using (user_id = auth.jwt()->>'sub' or user_id = auth.uid()::text);

-- Policy to allow users to delete their own plans
create policy "Users can delete their own calendar plans"
  on public.calendar_plans for delete
  using (user_id = auth.jwt()->>'sub' or user_id = auth.uid()::text);
