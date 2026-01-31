-- Add cardio fields to schedule_day_exercises
ALTER TABLE schedule_day_exercises ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE schedule_day_exercises ADD COLUMN IF NOT EXISTS intervals INTEGER;
ALTER TABLE schedule_day_exercises ADD COLUMN IF NOT EXISTS rest_seconds INTEGER;

-- Exercise progress tracking table - stores historical performance
CREATE TABLE IF NOT EXISTS exercise_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    -- For weight exercises
    weight DECIMAL(6,2),
    sets INTEGER,
    reps INTEGER,
    -- For cardio exercises
    duration_seconds INTEGER,
    distance_meters DECIMAL(10,2),
    intervals INTEGER,
    -- Common
    notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exercise_progress_user ON exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_exercise ON exercise_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_date ON exercise_progress(user_id, exercise_id, logged_at);
