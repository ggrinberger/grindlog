-- Migration: User-specific Workout Templates
-- Date: 2026-02-01
-- Description: Make workout templates user-specific so new users set their own workouts
--              instead of inheriting a default one

-- Add user_id column to workout_templates
ALTER TABLE workout_templates 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_day ON workout_templates(user_id, day_of_week);

-- Remove the global default workout templates (they will no longer be used)
-- Users will create their own templates during onboarding or from the weekly plan page
DELETE FROM workout_templates WHERE user_id IS NULL;
