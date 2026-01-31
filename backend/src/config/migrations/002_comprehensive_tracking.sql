-- Migration: Comprehensive Fitness Tracking
-- Date: 2025-01-31
-- Features: Workout templates, Routines, Cardio protocols, Nutrition tracking, Supplements

-- ============================================
-- 1. WORKOUT TEMPLATES (Weekly Training Plan)
-- ============================================

CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_name VARCHAR(100) NOT NULL,
    section VARCHAR(50), -- e.g., 'WARM-UP', main workout
    exercise VARCHAR(200) NOT NULL,
    sets_reps VARCHAR(100),
    intensity VARCHAR(100),
    rest_seconds VARCHAR(50),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workout_templates_day ON workout_templates(day_of_week);

-- ============================================
-- 2. ROUTINES (Morning/Evening)
-- ============================================

CREATE TABLE IF NOT EXISTS routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('morning', 'evening')),
    description TEXT,
    total_duration_minutes INTEGER,
    items JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routine_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    items_completed JSONB DEFAULT '[]',
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_routine_completions_user ON routine_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_completions_date ON routine_completions(user_id, completed_at);

-- ============================================
-- 3. CARDIO/VO2 PROTOCOLS
-- ============================================

CREATE TABLE IF NOT EXISTS cardio_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    modality VARCHAR(200),
    description TEXT,
    total_minutes INTEGER,
    frequency VARCHAR(100),
    hr_zone_target VARCHAR(200),
    instructions TEXT,
    science_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cardio_protocol_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    protocol_id UUID NOT NULL REFERENCES cardio_protocols(id) ON DELETE CASCADE,
    duration_minutes INTEGER,
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    calories_burned INTEGER,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cardio_protocol_logs_user ON cardio_protocol_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cardio_protocol_logs_date ON cardio_protocol_logs(user_id, completed_at);

-- ============================================
-- 4. NUTRITION TRACKING (Enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(30) NOT NULL CHECK (meal_type IN ('breakfast', 'pre_workout', 'lunch', 'post_workout', 'snack', 'dinner')),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_calories INTEGER DEFAULT 0,
    protein_g DECIMAL(6,2) DEFAULT 0,
    carbs_g DECIMAL(6,2) DEFAULT 0,
    fat_g DECIMAL(6,2) DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient VARCHAR(200) NOT NULL,
    amount VARCHAR(100),
    protein_g DECIMAL(6,2) DEFAULT 0,
    carbs_g DECIMAL(6,2) DEFAULT 0,
    fat_g DECIMAL(6,2) DEFAULT 0,
    calories INTEGER DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS nutrition_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    daily_calories INTEGER DEFAULT 3200,
    protein_g INTEGER DEFAULT 180,
    carbs_g INTEGER DEFAULT 350,
    fat_g INTEGER DEFAULT 80,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_meals_user ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON meal_items(meal_id);

-- ============================================
-- 5. SUPPLEMENT/MEDICATION TRACKER (Enhanced)
-- ============================================

-- Drop old constraints if they exist and recreate table with user_id
DROP TABLE IF EXISTS supplement_logs CASCADE;
DROP TABLE IF EXISTS supplements CASCADE;

CREATE TABLE IF NOT EXISTS supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    timing_notes TEXT,
    description TEXT,
    is_global BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_supplements_user ON supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_logs_user ON supplement_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_logs_date ON supplement_logs(user_id, taken_at);

-- ============================================
-- 6. WEEKLY SCHEDULE ENHANCEMENT
-- ============================================

-- Add location and training_type to weekly_schedule
ALTER TABLE weekly_schedule ADD COLUMN IF NOT EXISTS location VARCHAR(50) DEFAULT 'gym';
ALTER TABLE weekly_schedule ADD COLUMN IF NOT EXISTS training_type VARCHAR(100);
ALTER TABLE weekly_schedule ADD COLUMN IF NOT EXISTS primary_focus TEXT;
