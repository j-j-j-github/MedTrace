-- Add health metrics and preferences to profiles table
ALTER TABLE profiles
ADD COLUMN dob DATE,
ADD COLUMN gender TEXT,
ADD COLUMN height NUMERIC,
ADD COLUMN weight NUMERIC,
ADD COLUMN preferred_unit TEXT DEFAULT 'metric';
