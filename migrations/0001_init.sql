-- Migration: 0001_init.sql
-- Create facilities table for MultiSport partner data

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Praha',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  activities TEXT DEFAULT '[]',  -- JSON array of activity names
  image_url TEXT,
  website_url TEXT,
  phone TEXT,
  description TEXT,
  is_new INTEGER DEFAULT 0,
  recommended INTEGER DEFAULT 0,
  additional_payment INTEGER DEFAULT 0,
  raw_data TEXT,  -- Original JSON from MultiSport API
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities(category);
CREATE INDEX IF NOT EXISTS idx_facilities_city ON facilities(city);
CREATE INDEX IF NOT EXISTS idx_facilities_lat_lng ON facilities(lat, lng);
CREATE INDEX IF NOT EXISTS idx_facilities_additional_payment ON facilities(additional_payment);

-- Favorites table (for future user support)
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
  UNIQUE(facility_id, user_id)
);
