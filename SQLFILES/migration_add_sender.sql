-- Run this SQL in your Supabase SQL Editor to update your table structure
ALTER TABLE qaytnoma_items ADD COLUMN IF NOT EXISTS sender TEXT DEFAULT 'Anonim';
