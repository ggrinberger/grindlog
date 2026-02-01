-- GrindLog Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Groups/Circles table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group memberships
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Exercise library
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    muscle_group VARCHAR(50),
    description TEXT,
    is_cardio BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout plans/templates
CREATE TABLE IF NOT EXISTS workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout plan exercises (template)
CREATE TABLE IF NOT EXISTS workout_plan_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER,
    reps VARCHAR(20),
    duration_minutes INTEGER,
    notes TEXT,
    order_index INTEGER DEFAULT 0
);

-- Workout sessions (actual workouts logged)
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    name VARCHAR(100),
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercise logs (sets/reps for a workout session)
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight DECIMAL(6,2),
    duration_seconds INTEGER,
    distance_meters DECIMAL(10,2),
    notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cardio sessions
CREATE TABLE IF NOT EXISTS cardio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    distance_km DECIMAL(6,2),
    calories_burned INTEGER,
    avg_heart_rate INTEGER,
    notes TEXT,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Food items library
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    serving_size VARCHAR(50),
    calories INTEGER,
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fat DECIMAL(6,2),
    fiber DECIMAL(6,2),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Diet logs
CREATE TABLE IF NOT EXISTS diet_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
    custom_name VARCHAR(100),
    servings DECIMAL(4,2) DEFAULT 1,
    meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    calories INTEGER,
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fat DECIMAL(6,2),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supplements
CREATE TABLE IF NOT EXISTS supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supplement logs
CREATE TABLE IF NOT EXISTS supplement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
    dosage VARCHAR(50),
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Body measurements/progress
CREATE TABLE IF NOT EXISTS body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    muscle_mass DECIMAL(5,2),
    chest DECIMAL(5,2),
    waist DECIMAL(5,2),
    hips DECIMAL(5,2),
    biceps DECIMAL(5,2),
    thighs DECIMAL(5,2),
    notes TEXT,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User goals
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    unit VARCHAR(20),
    deadline DATE,
    achieved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sharing settings (what users share with their groups)
CREATE TABLE IF NOT EXISTS sharing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    share_workouts BOOLEAN DEFAULT true,
    share_diet BOOLEAN DEFAULT false,
    share_progress BOOLEAN DEFAULT true,
    share_plans BOOLEAN DEFAULT false,
    UNIQUE(user_id, group_id)
);

-- User profile fields for onboarding
ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS workouts_setup BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS menu_setup BOOLEAN DEFAULT false;

-- Weekly workout schedule
CREATE TABLE IF NOT EXISTS weekly_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    name VARCHAR(100) NOT NULL,
    plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    is_rest_day BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, day_of_week)
);

-- Schedule day exercises - stores exercises assigned to each day
CREATE TABLE IF NOT EXISTS schedule_day_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES weekly_schedule(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER NOT NULL DEFAULT 3,
    reps INTEGER NOT NULL DEFAULT 10,
    weight DECIMAL(6,2),
    duration_seconds INTEGER,
    intervals INTEGER,
    rest_seconds INTEGER,
    notes TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    section VARCHAR(20) DEFAULT 'exercise' CHECK (section IN ('warm-up', 'exercise', 'finisher')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercise progress tracking
CREATE TABLE IF NOT EXISTS exercise_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    weight DECIMAL(6,2),
    sets INTEGER,
    reps INTEGER,
    duration_seconds INTEGER,
    distance_meters DECIMAL(10,2),
    intervals INTEGER,
    notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI recommendation requests
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('workout', 'diet', 'review')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    request_data JSONB,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session ON exercise_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_diet_logs_user_date ON diet_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_cardio_sessions_user_date ON cardio_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_user ON weekly_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_day_exercises_schedule ON schedule_day_exercises(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_day_exercises_exercise ON schedule_day_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_user ON exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_exercise ON exercise_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_date ON exercise_progress(user_id, exercise_id, logged_at);
-- Migration: Comprehensive Fitness Tracking
-- Date: 2025-01-31
-- Features: Workout templates, Routines, Cardio protocols, Nutrition tracking, Supplements

-- ============================================
-- 1. WORKOUT TEMPLATES (Weekly Training Plan)
-- User-specific: Each user creates their own workout templates
-- ============================================

CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_day ON workout_templates(user_id, day_of_week);

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
-- Seed Data: Comprehensive Fitness Tracking
-- Based on Guy's Fitness Spreadsheet

-- ============================================
-- 1. WORKOUT TEMPLATES (Weekly Training Plan)
-- NOTE: Workout templates are now user-specific.
-- New users create their own workouts - no default templates are seeded.
-- ============================================

-- ============================================
-- 2. ROUTINES (Morning/Evening)
-- ============================================

-- Morning Routine
INSERT INTO routines (name, type, description, total_duration_minutes, items) VALUES
('Morning Activation Routine', 'morning', 'Complete morning routine for nervous system activation and workout prep', 35, 
'[
  {"activity": "Minoxidil 5% Application", "duration": "1 min", "reps": "1ml (10 sprays)", "details": "Massage dry scalp thinning areas gently", "focus": "Hair Health"},
  {"activity": "Nasal Breathing", "duration": "3-5 min", "reps": "Continuous", "details": "Slow inhales (4 sec) through nose, exhales (6 sec). Sit upright.", "focus": "Nervous System"},
  {"activity": "Dynamic Stretching", "duration": "5 min", "reps": "8-10 rounds", "details": "Arm circles → leg swings → cat-cow flow → inchworms", "focus": "Mobility"},
  {"activity": "Jump Rope or Shadowboxing", "duration": "3-5 min", "reps": "Continuous", "details": "Light intensity, focus on rhythm and breathing", "focus": "CNS Activation"},
  {"activity": "Push-ups (Controlled)", "duration": "2 min", "reps": "3x 10-15", "details": "Tempo: 2 sec down, 1 sec pause, 1 sec up", "focus": "Upper Body Prep"},
  {"activity": "Glute Bridges or Glute Kickbacks", "duration": "2 min", "reps": "3x 15/side", "details": "Squeeze at top, control tempo", "focus": "Lower Body Activation"},
  {"activity": "Dead Bugs with Breathing", "duration": "3 min", "reps": "3x 12/side", "details": "Opposite arm/leg extend with exhale", "focus": "Core Stability"},
  {"activity": "Band Pull-Aparts (Medium)", "duration": "2 min", "reps": "3x 15", "details": "Chest-height band, deliberate pulling", "focus": "Posterior Chain"},
  {"activity": "Mountain Pose + Deep Breathing", "duration": "3 min", "reps": "Continuous", "details": "Stand tall, exhale completely, hold 5 sec, inhale slowly", "focus": "Vagal Tone"},
  {"activity": "Walking Lunges with Overhead Reach", "duration": "2 min", "reps": "3x 10/leg", "details": "Full range, controlled descent", "focus": "Dynamic Mobility"},
  {"activity": "Cold Exposure (Optional)", "duration": "1-2 min", "reps": "1 exposure", "details": "Cold shower/face splash OR ice bath", "focus": "Stress Adaptation"}
]');

-- Evening Routine  
INSERT INTO routines (name, type, description, total_duration_minutes, items) VALUES
('Evening Recovery Routine', 'evening', 'Post-workout recovery and sleep preparation routine', 120,
'[
  {"activity": "Post-Workout Nutrition", "duration": "30 min", "timing": "Immediately after training", "details": "30-50g carbs + 30-40g protein shake", "focus": "Recovery"},
  {"activity": "Cool-Down Walk", "duration": "5-10 min", "timing": "Post-workout", "details": "Easy zone 1 pace, nasal breathing if possible", "focus": "Active Recovery"},
  {"activity": "Foam Rolling", "duration": "10-15 min", "timing": "30 min post-workout", "details": "Target: quads, hip flexors, back, shoulders. 90 sec per group", "focus": "Mobility/Recovery"},
  {"activity": "Minoxidil 5% Application", "duration": "1 min", "timing": "8-12 hours from morning (e.g., 8 PM)", "details": "Massage dry scalp thinning areas gently", "focus": "Hair Health"},
  {"activity": "Stress Management Breathwork", "duration": "5 min", "timing": "Before dinner or wind-down", "details": "Box breathing: 4 sec inhale / 4 sec hold / 4 sec exhale / 4 sec hold", "focus": "Parasympathetic"},
  {"activity": "Dinner + Hydration", "duration": "45 min", "timing": "2-3 hours post-workout", "details": "Full meal with carbs/protein/fats + 500ml water with electrolytes if heavy sweat", "focus": "Nutrition Timing"},
  {"activity": "Magnesium Supplement", "duration": "N/A", "timing": "30-60 min before bed", "details": "300-400mg (glycinate or threonate)", "focus": "Sleep Quality"},
  {"activity": "Screen-Free Wind-Down", "duration": "30-60 min", "timing": "60+ min before bed", "details": "Read, light stretching, journaling, or meditation", "focus": "Sleep Hygiene"},
  {"activity": "Nasal Breathing + Meditation", "duration": "5-10 min", "timing": "In bed before sleep", "details": "Slow 4-6-8 breathing pattern, body scan meditation", "focus": "Parasympathetic Activation"},
  {"activity": "Sleep Target", "duration": "8 hours", "timing": "Consistent bedtime ±30 min", "details": "Dark, cool (65-68°F), no screens, blackout curtains", "focus": "Sleep Quality/Longevity"}
]');

-- ============================================
-- 3. CARDIO/VO2 PROTOCOLS
-- ============================================

INSERT INTO cardio_protocols (name, modality, description, total_minutes, frequency, hr_zone_target, instructions, science_notes) VALUES
('4x4 Protocol (Attia)', 
 'Stationary Bike OR Rowing Machine OR Treadmill Run',
 'WARM-UP: 5 min easy. MAIN: 4 rounds of (4 min MAX EFFORT + 4 min EASY RECOVERY). COOL-DOWN: 5 min easy. Bike: high resistance, 90-100 RPM. Rower: hard pulls, 30+ strokes/min. Run: 5K-10K pace for 4 min.',
 42, '1x per week (Monday or Tuesday)',
 'Work: 95%+ max HR (legs burning, hard breathing). Recovery: 70% max HR (conversational pace)',
 'Set timer for 4 min. Go maximum sustainable effort (not all-out sprinting). During 4 min easy, control breathing and let HR drop to ~110-120 bpm. Repeat 4-6 times. This is THE gold standard protocol.',
 'Sustained VO2 Max stimulus drives adaptations in aerobic enzymes. 4 min duration optimal for VO2 Peak.'),

('6x2 Min Hard',
 'Stationary Bike OR Rowing Machine (Ski Erg for variety)',
 'WARM-UP: 5 min easy. MAIN: 6 rounds of (2 min HARD + 1 min EASY). COOL-DOWN: 5 min easy. Bike: high resistance, maintain 90+ RPM. Rower: hard, fast pulls, 32+ strokes/min.',
 28, '1-2x per week (alt Tuesday/Thursday)',
 'Work: 90-95% max HR (hard breathing, leg fatigue). Recovery: 70% max HR (easy pedal/row)',
 'Shorter intervals = faster recovery between rounds. 2 min is long enough to build VO2 stimulus but short enough to repeat 6x. Rest fully during 1 min easy.',
 'Time-efficient, proven effective for VO2 gains. Shorter work intervals allow higher total volume.'),

('3 Min Hard Intervals',
 'Stationary Bike OR Outdoor Running (on relatively flat terrain) OR Rower',
 'WARM-UP: 5 min easy. MAIN: 5 rounds of (3 min HARD + 2 min EASY). COOL-DOWN: 5 min easy. Bike: moderate-high resistance, 85-95 RPM. Run: 4-5K pace (hard but sustainable 3 min). Rower: fast, consistent pulls.',
 35, '1x per week (Thursday)',
 'Work: 85-90% max HR (sustained hard). Recovery: 70-75% max HR (easier pace)',
 '3 min is sweet spot between VO2 work and lactate threshold. Pace should be hard but sustainable (not maximal). Let HR drop during 2 min recovery.',
 'Builds both VO2 Max and lactate threshold. Sustainable pace is key.'),

('Lactate Threshold',
 'Stationary Bike OR Rowing Machine OR Treadmill Run (outdoor flat path)',
 'WARM-UP: 5 min easy. MAIN: 2 sets of (10 min THRESHOLD EFFORT + 2 min EASY between). COOL-DOWN: 5 min easy. Bike: find resistance where you can maintain 10 min hard (threshold pace). Rower: steady, hard effort. Run: half-marathon pace.',
 34, '1x per week (Friday)',
 'Work: 82-85% max HR (hard but sustainable, conversational if pushing). Recovery: 70% max HR (easy)',
 'This is NOT max effort. Find a pace you can hold 10 min without complete failure. First 10 min, 2 min recovery, second 10 min. Track power/pace and try to match both sets.',
 'Critical for endurance performance. Raises lactate threshold so you can work harder longer.'),

('Zone 2 Aerobic Base',
 'Walking OR Easy Bike OR Swimming (any stroke) OR Running (easy jog) OR Rowing (light resistance)',
 'CONTINUOUS 20-30 min at CONVERSATIONAL PACE. Walk: flat, comfortable pace. Bike: low resistance, 70-80 RPM, easy spin. Swim: any stroke, easy pace, focus on breathing. Run: easy jog (can hold conversation). Row: light resistance, steady rhythm.',
 30, '3-4x per week (embedded in training finishers)',
 '60-70% max HR (MUST be conversational - if you can''t talk, too hard)',
 'This is the foundation of all aerobic work. 80% of training time should be Zone 2. Nasal breathing is ideal here. EASIEST pace - if you feel taxed, slow down more.',
 'Builds capillary density, mitochondrial function, fat oxidation capacity. Most important for longevity.'),

('Tabata (Advanced)',
 'Stationary Bike OR Rowing Machine OR Ski Erg',
 'WARM-UP: 5 min moderate. MAIN: 8 rounds of (20 sec MAX EFFORT + 10 sec REST). COOL-DOWN: 5 min easy. Bike: very high resistance, maximal sprint effort. Rower: explosive, fast pulls at max resistance.',
 14, '1x per week optional (use sparingly)',
 'Work: 90% max HR (near maximal). Rest: allow slight recovery',
 'Set interval timer 20:10 x8. During 20 sec, go MAXIMUM power output. During 10 sec, completely rest (no pedaling). This is brutal - only do if you want acute stimulus.',
 'High-intensity stimulus, very fatiguing. Use sparingly. Only for advanced, not beginner.'),

('Hill Repeats or Sprints',
 'Outdoor Hill (moderate 4-6% grade) OR Treadmill (10-12% incline) OR Bike (very high resistance)',
 'WARM-UP: 5-10 min easy at base. MAIN: 4-8 repeats of (30-90 sec MAXIMAL uphill effort + 2-3 min WALKING/EASY recovery back to start). COOL-DOWN: 5 min easy. Hill: full sprint effort uphill. Treadmill: hold handles lightly, high intensity. Bike: standing, maximal resistance sprint.',
 30, '1x per week (can substitute for VO2)',
 'Work: 95%+ max HR (legs burning, max effort). Recovery: 60-70% max HR (easy walk down or very easy pedal)',
 'Each repeat is a max effort sprint uphill. Time or distance (e.g., 60 sec sprints). Recover by walking slowly back. Builds leg power + VO2 Max simultaneously.',
 'Excellent for combining strength/power with aerobic gains.');

-- ============================================
-- 4. SUPPLEMENTS
-- ============================================
-- Note: No default supplements are inserted.
-- Users should set up their own supplements on first use.
-- The frontend provides goal-based suggestions.
