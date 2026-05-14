-- Migration: 0002_extended_fields.sql
-- Add new columns for extended facility data from MultiSport API

-- Card types accepted (JSON array of card objects)
ALTER TABLE facilities ADD COLUMN active_cards TEXT DEFAULT '[]';

-- Kids activities support
ALTER TABLE facilities ADD COLUMN kids_activities INTEGER DEFAULT 0;

-- Gallery images (JSON array of image URLs)
ALTER TABLE facilities ADD COLUMN gallery_images TEXT DEFAULT '[]';

-- Additional payment description
ALTER TABLE facilities ADD COLUMN additional_payment_desc TEXT;

-- Contact email
ALTER TABLE facilities ADD COLUMN email TEXT;

-- Parking info: "Yes", "No", "Unknown"
ALTER TABLE facilities ADD COLUMN parking TEXT DEFAULT 'Unknown';

-- Only virtual card accepted
ALTER TABLE facilities ADD COLUMN only_virtual_card INTEGER DEFAULT 0;

-- Activity summary (formatted string from API)
ALTER TABLE facilities ADD COLUMN activity_summary TEXT;

-- Self-service access
ALTER TABLE facilities ADD COLUMN self_service INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN self_service_times TEXT;

-- Unlimited opening hours (24/7)
ALTER TABLE facilities ADD COLUMN unlimited_oh INTEGER DEFAULT 0;

-- Social media
ALTER TABLE facilities ADD COLUMN facebook_url TEXT;
ALTER TABLE facilities ADD COLUMN instagram_url TEXT;

-- Index for kids activities filter
CREATE INDEX IF NOT EXISTS idx_facilities_kids ON facilities(kids_activities);
CREATE INDEX IF NOT EXISTS idx_facilities_only_virtual ON facilities(only_virtual_card);
