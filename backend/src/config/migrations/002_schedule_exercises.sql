-- Schedule day exercises - stores exercises assigned to each day of the week
CREATE TABLE IF NOT EXISTS schedule_day_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES weekly_schedule(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER NOT NULL DEFAULT 3,
    reps INTEGER NOT NULL DEFAULT 10,
    weight DECIMAL(6,2), -- in kg, nullable for bodyweight exercises
    notes TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_day_exercises_schedule ON schedule_day_exercises(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_day_exercises_exercise ON schedule_day_exercises(exercise_id);
