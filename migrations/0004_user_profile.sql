-- Migration: 0004_user_profile.sql
-- Persistent user profile for booking (shared across devices)

CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  card_number TEXT NOT NULL DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default empty profile
INSERT OR IGNORE INTO user_profile (id, full_name, email, phone, card_number) VALUES (1, '', '', '', '');
