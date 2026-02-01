-- Migration: Comprehensive Exercise Library
-- Date: 2026-02-01
-- Source: Israel's Strength Longevity VO2 Program spreadsheet
-- Adds all exercises needed for the complete training program

-- ============================================
-- WARM-UP / MOBILITY EXERCISES
-- ============================================

INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
-- General Warm-up
('Stationary Bike (Warm-up)', 'Cardio', 'Full Body', '5-7 min moderate intensity to elevate HR and warm muscles', true, true),
('Rowing Machine (Warm-up)', 'Cardio', 'Full Body', '5-10 min easy to elevate core temp and warm back/hips', true, true),
('Light Jog', 'Cardio', 'Full Body', '5-7 min moderate intensity warm-up', true, true),
('Jumping Jacks', 'Cardio', 'Full Body', 'Dynamic warm-up to elevate heart rate', true, true),
('Shadowboxing', 'Cardio', 'Full Body', 'Light intensity boxing movements for CNS activation', true, true),

-- Hip Mobility
('Hip Mobility Flow', 'Mobility', 'Hips', 'Hip circles, leg swings (all directions), inchworms, glute bridges activation', false, true),
('Leg Swings (Front-to-Back)', 'Mobility', 'Hips', 'Dynamic hip mobility, 10-15 swings each leg', false, true),
('Leg Swings (Side-to-Side)', 'Mobility', 'Hips', 'Lateral leg swings for hip adductors/abductors', false, true),
('Hip Circles', 'Mobility', 'Hips', 'Standing hip circles for joint mobility', false, true),
('Dynamic Hip Openers', 'Mobility', 'Hips', 'Hip circles, leg swings, cat-cow, arm swings', false, true),
('Inchworms', 'Mobility', 'Full Body', 'Walk hands out to plank, walk feet to hands', false, true),
('Cat-Cow Flow', 'Mobility', 'Spine', 'Alternating spinal flexion and extension', false, true),

-- Shoulder/Upper Body Mobility  
('Arm Circles', 'Mobility', 'Shoulders', 'Forward and backward arm circles for shoulder mobility', false, true),
('Shoulder Mobility + Arm Circles', 'Mobility', 'Shoulders', 'Band pull-aparts, arm circles, cross-body stretches', false, true),
('Shoulder Dislocates', 'Mobility', 'Shoulders', 'Band or stick shoulder pass-throughs', false, true),
('Band Pull-Aparts', 'Mobility', 'Back', 'Chest-height band pulls for rear delts and scapulae', false, true),
('Scapular Activation', 'Mobility', 'Back', 'Band pull-aparts, dead hangs, shoulder dislocates', false, true),

-- Torso Mobility
('T-Spine Rotations', 'Mobility', 'Spine', 'Thoracic spine rotation stretches', false, true),
('Torso Twists', 'Mobility', 'Core', 'Standing torso rotation for spine mobility', false, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- ACTIVATION / PREP EXERCISES  
-- ============================================

INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
-- Lower Body Activation
('Bodyweight Squats (Tempo)', 'Bodyweight', 'Legs', '2 sec down, 1 sec pause, explosive up - prime for power work', false, true),
('Banded Glute Bridge', 'Bodyweight', 'Glutes', 'Full range, 1 sec pause at top, glute activation for lockout strength', false, true),
('Glute Bridges', 'Bodyweight', 'Glutes', 'Squeeze at top, control tempo for lower body activation', false, true),
('Glute Kickbacks', 'Bodyweight', 'Glutes', '3x15/side, squeeze at top for lower body activation', false, true),
('Bodyweight Romanian Deadlifts', 'Bodyweight', 'Hamstrings', 'Hinge at hips, keep back neutral, feel hamstring/glute stretch', false, true),

-- Upper Body Activation
('Push-ups (Scapular)', 'Bodyweight', 'Chest', 'Full ROM, 1 sec pause at bottom, engage chest/shoulders, prime muscles', false, true),
('Controlled Push-ups', 'Bodyweight', 'Chest', 'Tempo: 2 sec down, 1 sec pause, 1 sec up for upper body prep', false, true),
('Negative Pull-ups', 'Bodyweight', 'Back', 'Slow controlled descent to activate lats/back', false, true),
('Assisted Pull-ups', 'Bodyweight', 'Back', 'Full ROM, control descent, activate lats/back, prime pull pattern', false, true),

-- Core Activation
('Dead Bugs', 'Bodyweight', 'Core', 'Opposite arm/leg extend with exhale - core stability', false, true),
('Dead Bugs with Breathing', 'Bodyweight', 'Core', 'Opposite arm/leg extend, controlled, exhale on extension', false, true),
('Mountain Pose + Deep Breathing', 'Breathing', 'Core', 'Stand tall, exhale completely, hold 5 sec, inhale slowly - vagal tone', false, true),

-- Barbell Prep
('Bar-only Back Squat', 'Strength', 'Legs', 'Empty bar squats for form focus - perfect depth, full ROM, explosive drive', false, true),
('Bar-only Bench Press', 'Strength', 'Chest', 'Empty bar press for technique - strict form, full ROM, pause at chest', false, true),
('Bar-only Deadlift', 'Strength', 'Back', 'Empty bar deadlift for form - explosive hip drive, neutral spine, full lockout', false, true),
('Bar-only Row', 'Strength', 'Back', 'Empty bar row for form - explosive pull to chest, full extension', false, true),
('Ramp Sets (Weight Build-up)', 'Strength', 'Full Body', 'Progressive weight build to 85%+ of working load - prepare CNS', false, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- MAIN STRENGTH EXERCISES
-- ============================================

INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
-- Lower Body Strength
('Barbell Back Squat (Explosive)', 'Strength', 'Legs', 'Full depth, drive explosively on concentric - 4x3-5 Heavy', false, true),
('Bulgarian Split Squats (Dumbbell)', 'Strength', 'Legs', 'Back foot elevated on bench - 3x8/side', false, true),
('Leg Press Machine', 'Strength', 'Legs', 'Full range, control negative - 3x8-10', false, true),
('Nordic Curls', 'Strength', 'Hamstrings', 'Eccentric focus - lower slowly over 3-4 seconds', false, true),
('Goblet Squats (Tempo)', 'Strength', 'Legs', '2 sec down, 1 sec pause, explosive up - 4x12-15', false, true),
('Walking Lunges (Dumbbell)', 'Strength', 'Legs', 'Full step, back knee nearly touches floor - 3x10/leg', false, true),
('Leg Curl Machine', 'Strength', 'Hamstrings', 'Full range, 1 sec squeeze at top, control eccentric', false, true),
('Leg Extension (Light)', 'Strength', 'Quads', 'High reps, full ROM, focus on quad burn - 3x15-20', false, true),
('Calf Raises (Heavy)', 'Strength', 'Calves', 'Full range, pause 1 sec at top, continuous reps', false, true),
('Goblet Squat (Heavy)', 'Strength', 'Legs', 'Explosive up, controlled down - 4x6-8 for home power day', false, true),
('Jump Squats', 'Plyometric', 'Legs', 'Explosive power, soft landing - 3x10', false, true),

-- Upper Push
('Barbell Bench Press (Strict)', 'Strength', 'Chest', 'Pause 1 sec at chest, full ROM - 4x4-6 Heavy', false, true),
('Incline Dumbbell Press', 'Strength', 'Chest', '30-degree incline, controlled descent - 3x8-10', false, true),
('Machine Chest Press', 'Strength', 'Chest', 'Full range, 1 sec pause at top - 3x10-12', false, true),
('Dips (Weighted)', 'Strength', 'Chest', 'Full depth, upright torso - 3x8-10', false, true),
('Dumbbell Push Press', 'Strength', 'Shoulders', 'Leg drive into explosive press - 4x5-6 Heavy', false, true),

-- Upper Pull
('Deadlifts (Conventional)', 'Strength', 'Back', 'Explosive hip drive, neutral spine - 4x3-5 Heavy', false, true),
('Weighted Pull-ups', 'Strength', 'Back', 'Full range, add weight if needed, explosive upward - 4x5-8', false, true),
('Barbell Rows (Strict)', 'Strength', 'Back', 'Explosive pull to mid-chest, full extension - 4x4-6 Heavy', false, true),
('Seal Rows', 'Strength', 'Back', 'Chest-to-bar, elbows tucked, controlled eccentric - 3x8-10', false, true),
('T-Bar Rows', 'Strength', 'Back', 'Chest-to-bar, elbows tucked, controlled eccentric', false, true),
('Face Pulls (Rope)', 'Strength', 'Shoulders', 'Rear delt focus, high reps, light weight - 3x15', false, true),
('Machine Rows', 'Strength', 'Back', 'Controlled, chest-to-pad, 1 sec squeeze - 3x10-12', false, true),
('Lat Pulldown', 'Strength', 'Back', 'Chest-to-bar, elbows behind shoulders - 3x12-15', false, true),
('Dumbbell Rows (Single Arm)', 'Strength', 'Back', 'Unilateral, neutral grip, explosive pull - 3x10/side', false, true),
('Renegade Rows', 'Strength', 'Back', 'Anti-rotation core work + row - 3x8/side', false, true),
('Shrugs (Heavy Dumbbell)', 'Strength', 'Traps', 'Heavy weight, pause 1 sec at top - 3x12-15', false, true),

-- Arms
('Lateral Raises (Dumbbell)', 'Strength', 'Shoulders', 'Strict form, slight knee bend, shoulder isolation - 3x12-15', false, true),
('Tricep Rope Pushdown', 'Strength', 'Arms', 'Full extension, no momentum - 3x12-15', false, true),
('Bicep Curls (Barbell)', 'Strength', 'Arms', 'Strict form, no leg drive, full ROM - 3x10-12', false, true),
('Rear Delt Flys (Machine)', 'Strength', 'Shoulders', 'Focus on rear delt contraction, light weight - 3x12-15', false, true),
('Barbell Curls (Strict)', 'Strength', 'Arms', 'Strict form, no momentum, full ROM - 3x8-10', false, true),
('Hammer Curls', 'Strength', 'Arms', 'Neutral grip, strict form, full ROM - 3x10-12', false, true),
('Overhead Tricep Extensions', 'Strength', 'Arms', 'Elbows forward, lower behind head - 3x12-15', false, true),
('Reverse Pec Deck', 'Strength', 'Shoulders', 'Rear delt focus, squeeze at peak - 3x12-15', false, true),
('Reverse Curls', 'Strength', 'Arms', 'Forearm focus - 3x12-15', false, true),
('Preacher Curls', 'Strength', 'Arms', 'Bicep peak isolation - 3x12-15', false, true),

-- Core
('Planks (Hold)', 'Bodyweight', 'Core', 'Stay rigid, breathe steadily - 3x45sec', false, true),
('Cable Crunches', 'Strength', 'Core', 'Focus on crunch, squeeze abs, neck relaxed - 3x12-15', false, true),
('Ab Wheel Rollout', 'Strength', 'Core', 'Full extension, slow controlled return, brace core - 3x10', false, true),
('Hanging Leg Raises', 'Bodyweight', 'Core', 'Full range, lower with control, engage core - 3x8-12', false, true),
('Plank to Push-up', 'Bodyweight', 'Core', 'Core stability, controlled transitions - 3x10', false, true),
('Mountain Climbers', 'Cardio', 'Core', 'Fast pace, core engaged - 3x30sec', false, true),

-- Grip/Carry
('Farmer''s Walk (Heavy)', 'Strength', 'Full Body', 'Grip/core endurance, maintain posture - 3x30m', false, true),

-- Power/Explosive
('Dumbbell Power Clean', 'Strength', 'Full Body', 'Explosive hip drive, catch in front rack - 5x3-5 Heavy', false, true),
('Walking Lunges with Overhead Reach', 'Mobility', 'Full Body', 'Full range, controlled descent - preps hips and shoulders', false, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- RECOVERY / YOGA / BREATHING
-- ============================================

INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Yoga Flow', 'Mobility', 'Full Body', 'Sun Salutations + hip openers + gentle stretches - 15 min', false, true),
('Nasal Breathing Practice', 'Breathing', 'Core', '4 sec inhale through nose, 7 sec hold, 8 sec exhale - parasympathetic focus', false, true),
('Light Swim', 'Cardio', 'Full Body', 'Very easy pace, conversational, nasal breathing - Zone 1', true, true),
('Foam Rolling (Mobility)', 'Recovery', 'Full Body', 'Target quads, hip flexors, back, chest - 90 sec per group', false, true),
('Cool-Down Walk', 'Cardio', 'Full Body', 'Easy zone 1 pace, nasal breathing - facilitate lactate clearance', true, true),
('Box Breathing', 'Breathing', 'Core', '4 sec inhale / 4 sec hold / 4 sec exhale / 4 sec hold - reduce cortisol', false, true),
('4-7-8 Breathing', 'Breathing', 'Core', '4 sec inhale, 7 sec hold, 8 sec exhale - sleep preparation', false, true),
('Body Scan Meditation', 'Recovery', 'Full Body', 'Slow breathing with body scan - parasympathetic activation', false, true),
('Cold Exposure', 'Recovery', 'Full Body', 'Cold shower/face splash OR ice bath - stress adaptation', false, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- CARDIO / VO2 / CONDITIONING
-- ============================================

INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Zone 2 Walk', 'Cardio', 'Full Body', 'Conversational pace, nasal breathing - 60-70% max HR', true, true),
('Zone 2 Bike', 'Cardio', 'Legs', 'Low resistance, 70-80 RPM, easy spin - 60-70% max HR', true, true),
('Stationary Bike (4x4 Protocol)', 'Cardio', 'Legs', '4 min max effort + 4 min easy recovery x4 - VO2 Max gold standard', true, true),
('Rowing (6x2 Protocol)', 'Cardio', 'Full Body', '2 min hard + 1 min easy x6 - time-efficient VO2', true, true),
('Rower (3 Min Intervals)', 'Cardio', 'Full Body', '3 min hard + 2 min easy x5 - VO2 Max + lactate threshold', true, true),
('Lactate Threshold Bike', 'Cardio', 'Legs', '2x10 min threshold effort + 2 min easy - 82-85% max HR', true, true),
('Tabata (Bike)', 'Cardio', 'Legs', '20 sec max effort + 10 sec rest x8 - advanced protocol', true, true),
('Hill Repeats', 'Cardio', 'Legs', '30-90 sec maximal uphill + 2-3 min walking recovery x4-8', true, true),
('Treadmill Sprints', 'Cardio', 'Legs', 'High incline intervals - power + VO2 Max', true, true),
('Ski Erg', 'Cardio', 'Full Body', 'Upper body focused cardio machine', true, true),
('Kettlebell Swings', 'Cardio', 'Full Body', 'Explosive hip hinge - conditioning circuit staple', true, true),
('Battle Ropes', 'Cardio', 'Full Body', 'Upper body conditioning with continuous waves', true, true),
('Box Jumps', 'Plyometric', 'Legs', 'Explosive jump onto box - power development', true, true),
('Conditioning Circuit', 'Cardio', 'Full Body', 'Rowing 1 min + KB Swings 1 min + Mountain Climbers 1 min x5', true, true),
('Lactate Threshold Circuit', 'Cardio', 'Full Body', '10 min sustained threshold effort x2 with 2 min rest', true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- MORNING ROUTINE SPECIFIC
-- ============================================

INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Minoxidil Application', 'Recovery', 'Other', '1ml (10 sprays) massage dry scalp - wait 4h before shower/sweat', false, true),
('Dynamic Stretching Flow', 'Mobility', 'Full Body', 'Arm circles → leg swings → cat-cow flow → inchworms - 5 min', false, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Add intensity column to exercises for program specificity
-- ============================================

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS default_intensity VARCHAR(100);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS default_rest_seconds VARCHAR(50);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS default_sets_reps VARCHAR(50);

-- Update some key exercises with defaults
UPDATE exercises SET default_sets_reps = '4x3-5', default_intensity = 'Heavy (85-90%)', default_rest_seconds = '180-240' WHERE name = 'Barbell Back Squat (Explosive)';
UPDATE exercises SET default_sets_reps = '4x4-6', default_intensity = 'Heavy (85-90%)', default_rest_seconds = '240-300' WHERE name = 'Barbell Bench Press (Strict)';
UPDATE exercises SET default_sets_reps = '4x3-5', default_intensity = 'Heavy (85-90%)', default_rest_seconds = '240-300' WHERE name = 'Deadlifts (Conventional)';
UPDATE exercises SET default_sets_reps = '4x5-8', default_intensity = 'Heavy (80-85%)', default_rest_seconds = '180-240' WHERE name = 'Weighted Pull-ups';
UPDATE exercises SET default_sets_reps = '4x4-6', default_intensity = 'Heavy (85-90%)', default_rest_seconds = '240-300' WHERE name = 'Barbell Rows (Strict)';

-- ============================================
-- Add section hints for exercises
-- ============================================

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS typical_section VARCHAR(20) DEFAULT 'exercise';

UPDATE exercises SET typical_section = 'warm-up' WHERE category = 'Mobility' OR category = 'Breathing';
UPDATE exercises SET typical_section = 'warm-up' WHERE name LIKE '%Warm-up%' OR name LIKE 'Bar-only%' OR name LIKE 'Ramp%' OR name LIKE '%Activation%';
UPDATE exercises SET typical_section = 'finisher' WHERE name LIKE 'Zone 2%' OR name LIKE '%Protocol%' OR name LIKE '%Threshold%' OR name LIKE 'Conditioning%';

COMMIT;
