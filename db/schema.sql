-- ══════════════════════════════════════════════════════════════
-- PPF Member OS — Database Schema
-- Supabase / PostgreSQL — First-pass schema for wearable
-- integrations, readiness engine, notifications, and coaching.
-- ══════════════════════════════════════════════════════════════

-- 1. Profiles
create table profiles (
  id uuid primary key,
  email text unique,
  full_name text,
  role text check (role in ('member','coach','admin','family','agent')),
  created_at timestamptz default now()
);

-- 2. Member Connections (Apple Health, WHOOP, Google Health)
create table member_connections (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  provider text not null check (provider in ('apple_health','whoop','google_health')),
  status text not null check (status in ('not_connected','pending','connected','error','revoked')),
  oauth_type text,
  provider_user_id text,
  scopes text[],
  last_sync_at timestamptz,
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Provider Tokens (encrypted, server-side only)
create table provider_tokens (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references member_connections(id) on delete cascade,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Connection Permissions (per-metric grants)
create table connection_permissions (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references member_connections(id) on delete cascade,
  metric_key text,
  granted boolean default false,
  created_at timestamptz default now()
);

-- 5. Raw Health Events (ingested payloads)
create table raw_health_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  provider text not null,
  external_event_id text,
  metric_type text,
  payload jsonb not null,
  observed_at timestamptz,
  ingested_at timestamptz default now()
);

-- 6. Daily Readiness Snapshots (PPF normalized scores)
create table daily_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  snapshot_date date not null,
  sleep_score numeric(5,2),
  recovery_score numeric(5,2),
  load_score numeric(5,2),
  trend_score numeric(5,2),
  body_status_score numeric(5,2),
  ppf_status text check (ppf_status in ('green','yellow','red')),
  session_modification text check (session_modification in ('full_go','quality_control','recovery_day')),
  explanation jsonb,
  source_mix jsonb,
  created_at timestamptz default now(),
  unique(member_id, snapshot_date)
);

-- 7. Sleep Sessions
create table sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  provider text not null,
  external_id text,
  start_at timestamptz,
  end_at timestamptz,
  duration_minutes integer,
  efficiency numeric(5,2),
  performance_score numeric(5,2),
  sleep_stages jsonb,
  created_at timestamptz default now()
);

-- 8. Recovery Metrics
create table recovery_metrics (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  provider text not null,
  metric_date date not null,
  hrv numeric(8,2),
  resting_hr numeric(8,2),
  spo2 numeric(8,2),
  respiratory_rate numeric(8,2),
  skin_temp_delta numeric(8,2),
  strain numeric(8,2),
  recovery_vendor_score numeric(8,2),
  created_at timestamptz default now()
);

-- 9. Athlete Check-ins (manual body status)
create table athlete_checkins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  checkin_date date not null,
  soreness_level integer,
  fatigue_level integer,
  mood_level integer,
  hydration_level integer,
  notes text,
  created_at timestamptz default now(),
  unique(member_id, checkin_date)
);

-- 10. Notification Preferences
create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  readiness_alerts boolean default true,
  session_adjustment_alerts boolean default true,
  coach_note_alerts boolean default true,
  hydration_reminders boolean default true,
  sleep_target_reminders boolean default true,
  milestone_alerts boolean default true,
  family_share_alerts boolean default false,
  agent_share_alerts boolean default false,
  quiet_hours_start time,
  quiet_hours_end time,
  delivery_channels text[] default array['in_app'],
  created_at timestamptz default now()
);

-- 11. Coach Alerts
create table coach_alerts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  snapshot_id uuid references daily_readiness_snapshots(id) on delete set null,
  alert_type text,
  severity text check (severity in ('info','watch','urgent')),
  title text,
  body text,
  status text default 'open' check (status in ('open','acknowledged','resolved')),
  created_at timestamptz default now()
);

-- 12. Notification Events (delivery log)
create table notification_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  category text,
  trigger_key text,
  title text,
  body text,
  channel text,
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz default now()
);

-- 13. Visibility Access (family / agent / coach sharing)
create table visibility_access (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  viewer_profile_id uuid references profiles(id) on delete cascade,
  access_type text check (access_type in ('family','agent','coach')),
  metric_scope text[],
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 14. Webhook Events (WHOOP, Google Health inbound)
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text,
  external_event_id text,
  signature_valid boolean,
  payload jsonb not null,
  received_at timestamptz default now(),
  processed_at timestamptz,
  status text default 'pending'
);
