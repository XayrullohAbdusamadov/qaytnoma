-- Run this SQL in your Supabase SQL Editor to update your table structure
-- Bu SQL kodni Supabase SQL Editor-da ishga tushiring

ALTER TABLE shared_items ADD COLUMN IF NOT EXISTS short_id VARCHAR(10) UNIQUE;

-- Populate existing rows with a random 6-character short_id
-- Mavjud qatorlarni tasodifiy 6-belgili short_id bilan to'ldirish
UPDATE shared_items 
SET short_id = substring(md5(random()::text) from 1 for 6) 
WHERE short_id IS NULL;
