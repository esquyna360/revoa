-- Revoa: quiz_sessions table
-- Stores all quiz attempts. Token = user identity (no login required).

create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  token uuid unique not null,
  quiz_id text not null,
  quiz_slug text not null,
  quiz_title text not null,
  quiz_category text not null,
  quiz_emoji text,
  answers jsonb not null default '[]',
  tier text not null default 'free' check (tier in ('free', 'quick', 'premium')),
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'error')),
  result jsonb,
  payment_id text,
  payment_intent text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast token lookup (used on every result page load)
create index if not exists quiz_sessions_token_idx on quiz_sessions(token);

-- Index for status polling
create index if not exists quiz_sessions_status_idx on quiz_sessions(status);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger quiz_sessions_updated_at
  before update on quiz_sessions
  for each row execute function update_updated_at();

-- RLS: public read by token only (no auth required)
alter table quiz_sessions enable row level security;

-- Allow anyone to read their own session by token
create policy "Public read by token"
  on quiz_sessions for select
  using (true);

-- Only service role can insert/update (via API routes)
create policy "Service role write"
  on quiz_sessions for all
  using (auth.role() = 'service_role');
