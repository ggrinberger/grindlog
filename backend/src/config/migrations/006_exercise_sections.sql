-- Migration: Add section field to schedule_day_exercises
-- Allows categorizing exercises as warm-up, exercise (main), or finisher
-- Date: 2026-02-01

-- Add section column with default 'exercise' (main workout)
ALTER TABLE schedule_day_exercises 
ADD COLUMN IF NOT EXISTS section VARCHAR(20) DEFAULT 'exercise' 
CHECK (section IN ('warm-up', 'exercise', 'finisher'));

-- Update any existing exercises to have 'exercise' as their section
UPDATE schedule_day_exercises SET section = 'exercise' WHERE section IS NULL;
