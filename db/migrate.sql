CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  admin_pin_hash TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  evening_start_time TEXT NOT NULL DEFAULT '19:30',
  morning_start_time TEXT NOT NULL DEFAULT '06:30',
  minutes_per_turn INTEGER NOT NULL DEFAULT 15,
  school_days_only BOOLEAN NOT NULL DEFAULT TRUE,
  day_offset INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  share_token TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON push_subscriptions (endpoint);

CREATE TABLE IF NOT EXISTS day_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  evening_first_kid_id UUID,
  evening_order_kid_ids JSONB NOT NULL,
  morning_order_kid_ids JSONB NOT NULL,
  evening_turn_index INTEGER NOT NULL DEFAULT 0,
  morning_turn_index INTEGER NOT NULL DEFAULT 0,
  evening_started BOOLEAN NOT NULL DEFAULT FALSE,
  morning_started BOOLEAN NOT NULL DEFAULT FALSE,
  evening_last_notified_at TIMESTAMPTZ,
  morning_last_notified_at TIMESTAMPTZ,
  evening_last_notified_index INTEGER NOT NULL DEFAULT -1,
  morning_last_notified_index INTEGER NOT NULL DEFAULT -1
);

CREATE UNIQUE INDEX IF NOT EXISTS day_states_household_date_idx ON day_states (household_id, date);
