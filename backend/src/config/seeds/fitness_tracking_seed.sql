-- Seed Data: Comprehensive Fitness Tracking
-- Based on Guy's Fitness Spreadsheet

-- ============================================
-- 1. WORKOUT TEMPLATES (Weekly Training Plan)
-- ============================================

-- Day mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

-- Saturday: Recovery (day_of_week = 6)
INSERT INTO workout_templates (day_of_week, day_name, section, exercise, sets_reps, intensity, rest_seconds, notes, order_index) VALUES
(6, 'Saturday: Recovery', NULL, 'Yoga Flow', '15 min', 'Low intensity', 'N/A', 'Sun Salutations + hip openers + gentle stretches. Focus on mobility.', 1),
(6, 'Saturday: Recovery', NULL, 'Nasal Breathing Practice', '5 min', 'N/A', 'N/A', '4 sec inhale through nose, 7 sec hold, 8 sec exhale. Sitting upright, parasympathetic focus.', 2),
(6, 'Saturday: Recovery', NULL, 'Light Swim or Walk', '20 min', 'Zone 1 (<60% max HR)', 'N/A', 'Very easy pace, conversational, nasal breathing if possible. Capillary work, no accumulation.', 3),
(6, 'Saturday: Recovery', NULL, 'Foam Rolling (mobility)', '10 min', 'Bodyweight', 'N/A', 'Target: quads (90 sec), hip flexors (90 sec), back (90 sec), chest (90 sec). Slow, deliberate rolling.', 4);

-- Sunday: Lower Power (day_of_week = 0)
INSERT INTO workout_templates (day_of_week, day_name, section, exercise, sets_reps, intensity, rest_seconds, notes, order_index) VALUES
(0, 'Sunday: Lower Power', 'WARM-UP', '5-7 min moderate intensity bike/row/jog', 'N/A', '70-75% max HR', 'N/A', 'Warm quads/hamstrings/glutes, elevate HR, prepare for power work', 1),
(0, 'Sunday: Lower Power', 'WARM-UP', 'Hip mobility flow + leg swings', '2x8 each', 'Bodyweight', 'N/A', 'Hip circles, leg swings (all directions), inchworms, glute bridges activation', 2),
(0, 'Sunday: Lower Power', 'WARM-UP', 'Bodyweight Squats (tempo)', '3x10', 'Bodyweight', '60', '2 sec down, 1 sec pause, explosive up, high reps to prime power', 3),
(0, 'Sunday: Lower Power', 'WARM-UP', 'Banded Glute Bridge (activation)', '2x8', 'Light resistance band', '90', 'Full range, 1 sec pause at top, glute activation for lockout strength', 4),
(0, 'Sunday: Lower Power', 'WARM-UP', 'Bar-only Back Squat (form focus)', '2x5', 'Empty bar (45 lbs)', '90', 'Perfect depth, full ROM, explosive drive, shoulders packed', 5),
(0, 'Sunday: Lower Power', 'WARM-UP', 'Ramp to working weight', '1x4, 1x2, 1x1', 'Build to 85%+ of today''s working load', '120-180', 'Explosive squat drive, prepare CNS for heavy power sets', 6),
(0, 'Sunday: Lower Power', NULL, 'Barbell Back Squat (explosive)', '4x3-5', 'Heavy (85-90%)', '180-240', 'Full depth, drive explosively on concentric', 7),
(0, 'Sunday: Lower Power', NULL, 'Bulgarian Split Squats (Dumbbell)', '3x8/side', 'Moderate-Heavy (75-80%)', '120', 'Back foot elevated on bench', 8),
(0, 'Sunday: Lower Power', NULL, 'Leg Press Machine', '3x8-10', 'Moderate-Heavy (75-85%)', '120', 'Full range, control negative', 9),
(0, 'Sunday: Lower Power', NULL, 'Nordic Curls', '3x6', 'High (eccentric focus)', '180', 'Lower slowly over 3-4 seconds', 10),
(0, 'Sunday: Lower Power', NULL, 'Farmer''s Walk (Heavy Dumbbells)', '3x30m', 'Moderate', '120', 'Grip/core endurance, maintain posture', 11),
(0, 'Sunday: Lower Power', NULL, 'Planks', '3x45sec', 'Bodyweight', '90', 'Stay rigid, breathe steadily', 12),
(0, 'Sunday: Lower Power', 'FINISHER', 'Zone 2 Walk or Bike (Finisher)', '15-20 min', '60-70% max HR', 'N/A', 'Conversational pace, nasal breathing', 13);

-- Monday: Upper Push + Arms (day_of_week = 1)
INSERT INTO workout_templates (day_of_week, day_name, section, exercise, sets_reps, intensity, rest_seconds, notes, order_index) VALUES
(1, 'Monday: Upper Push + Arms', 'WARM-UP', '5 min easy stationary bike or rowing', 'N/A', '60-70% max HR', 'N/A', 'Elevate HR, warm shoulders/chest/triceps, get blood flowing', 1),
(1, 'Monday: Upper Push + Arms', 'WARM-UP', 'Shoulder mobility + arm circles', '2x10 each', 'Bodyweight', 'N/A', 'Band pull-aparts (10), arm circles (forward/backward), cross-body shoulder stretch', 2),
(1, 'Monday: Upper Push + Arms', 'WARM-UP', 'Push-ups + Scapular work', '3x8', 'Bodyweight', '60', 'Full ROM, 1 sec pause at bottom, engage chest/shoulders, prime muscles', 3),
(1, 'Monday: Upper Push + Arms', 'WARM-UP', 'Bar-only Bench Press (technique)', '2x5', 'Empty bar (45 lbs)', '90', 'Strict form, full ROM, pause at chest, shoulders packed', 4),
(1, 'Monday: Upper Push + Arms', 'WARM-UP', 'Ramp to working weight', '1x4, 1x2, 1x1', 'Build to 85%+ of today''s working load', '120', 'Explosive pressing, prepare for heavy sets', 5),
(1, 'Monday: Upper Push + Arms', NULL, 'Barbell Bench Press (strict)', '4x4-6', 'Heavy (85-90%)', '240-300', 'Pause 1 sec at chest, full ROM', 6),
(1, 'Monday: Upper Push + Arms', NULL, 'Incline Dumbbell Press', '3x8-10', 'Moderate-Heavy (75-80%)', '120', '30-degree incline, controlled descent', 7),
(1, 'Monday: Upper Push + Arms', NULL, 'Machine Chest Press', '3x10-12', 'Moderate (70-75%)', '90', 'Full range, 1 sec pause at top', 8),
(1, 'Monday: Upper Push + Arms', NULL, 'Dips (bodyweight or weighted)', '3x8-10', 'Moderate-Heavy (75-80%)', '120', 'Full depth, upright torso', 9),
(1, 'Monday: Upper Push + Arms', NULL, 'Lateral Raises (Dumbbell)', '3x12-15', 'Light-Moderate (50-60%)', '60', 'Strict form, slight knee bend, shoulder isolation', 10),
(1, 'Monday: Upper Push + Arms', NULL, 'Tricep Rope Pushdown', '3x12-15', 'Light-Moderate (60-70%)', '60', 'Full extension, no momentum', 11),
(1, 'Monday: Upper Push + Arms', NULL, 'Bicep Curls (Barbell)', '3x10-12', 'Moderate (70-75%)', '90', 'Strict form, no leg drive, full ROM', 12),
(1, 'Monday: Upper Push + Arms', NULL, 'Rear Delt Flys (Machine or Dumbbell)', '3x12-15', 'Light-Moderate (60-70%)', '60', 'Focus on rear delt contraction, light weight', 13),
(1, 'Monday: Upper Push + Arms', 'VO2', 'VO2 Max Protocol: Stationary Bike 4x4', '4 rounds', '95%+ max HR (hard) / 70% (easy)', '240 easy', '4 min max effort (legs burning), 4 min easy recovery. Total: 32 min', 14);

-- Tuesday: Pull + VO2 (day_of_week = 2)
INSERT INTO workout_templates (day_of_week, day_name, section, exercise, sets_reps, intensity, rest_seconds, notes, order_index) VALUES
(2, 'Tuesday: Pull + VO2', 'WARM-UP', '5-10 min easy bike/row/walk', 'N/A', '60-70% max HR', 'N/A', 'Elevate core temp, warm lower back/hips, nasal breathing', 1),
(2, 'Tuesday: Pull + VO2', 'WARM-UP', 'Dynamic hip openers + leg swings', '2x10 each', 'Bodyweight', 'N/A', 'Hip circles, leg swings (all directions), cat-cow, arm swings', 2),
(2, 'Tuesday: Pull + VO2', 'WARM-UP', 'Bodyweight Romanian Deadlifts (RDL)', '3x8', 'Bodyweight', '60', 'Hinge at hips, keep back neutral, feel hamstring/glute stretch', 3),
(2, 'Tuesday: Pull + VO2', 'WARM-UP', 'Bar-only Deadlift (form focus)', '2x5', 'Empty bar (45 lbs)', '90', 'Explosive hip drive, neutral spine, full lockout, chest up', 4),
(2, 'Tuesday: Pull + VO2', 'WARM-UP', 'Ramp to working weight', '1x3, 1x2, 1x1', 'Build to 85%+ of today''s working load', '120-180', 'Explosive hip drive, prepare CNS for heavy pulls', 5),
(2, 'Tuesday: Pull + VO2', NULL, 'Deadlifts (conventional)', '4x3-5', 'Heavy (85-90%)', '240-300', 'Explosive hip drive, neutral spine', 6),
(2, 'Tuesday: Pull + VO2', NULL, 'Weighted Pull-ups', '4x5-8', 'Heavy (80-85%)', '180-240', 'Full range, add weight if needed, explosive upward', 7),
(2, 'Tuesday: Pull + VO2', NULL, 'Seal Rows or T-Bar Rows', '3x8-10', 'Moderate-Heavy (75-80%)', '120', 'Chest-to-bar, elbows tucked, controlled eccentric', 8),
(2, 'Tuesday: Pull + VO2', NULL, 'Face Pulls (rope attachment)', '3x15', 'Light-Moderate (50-60%)', '60', 'Rear delt focus, high reps, light weight', 9),
(2, 'Tuesday: Pull + VO2', NULL, 'Barbell Curls', '3x8-10', 'Moderate (70-75%)', '90', 'Strict form, no momentum, full ROM', 10),
(2, 'Tuesday: Pull + VO2', NULL, 'Dead Bugs (core)', '3x12/side', 'Bodyweight', '60', 'Opposite arm/leg extend, controlled, exhale on extension', 11),
(2, 'Tuesday: Pull + VO2', NULL, 'Hanging Leg Raises', '3x8-12', 'Bodyweight or weighted', '90', 'Full range, lower with control, engage core', 12),
(2, 'Tuesday: Pull + VO2', 'VO2', 'VO2 Max Protocol: Rower 6x2 Minutes', '6 rounds', '90-95% max HR (hard) / 70% (easy)', '60 easy', '2 min max effort (hard breathing), 1 min easy row. Total: 18 min. Adjust resistance for 2 min sustainability.', 13);

-- Wednesday: Hypertrophy (day_of_week = 3)
INSERT INTO workout_templates (day_of_week, day_name, section, exercise, sets_reps, intensity, rest_seconds, notes, order_index) VALUES
(3, 'Wednesday: Hypertrophy', 'WARM-UP', '5-7 min moderate intensity bike/row/jog', 'N/A', '70-75% max HR', 'N/A', 'Warm quads/hamstrings/glutes, elevate HR, prepare for hypertrophy volume', 1),
(3, 'Wednesday: Hypertrophy', NULL, 'Goblet Squats', '4x12-15', 'Moderate (65-70%)', '90', 'Full depth, controlled tempo', 2),
(3, 'Wednesday: Hypertrophy', NULL, 'Romanian Deadlifts', '3x10-12', 'Moderate (70-75%)', '90', 'Feel hamstring stretch, control eccentric', 3),
(3, 'Wednesday: Hypertrophy', NULL, 'Leg Extensions', '3x15-20', 'Light-Moderate (60-65%)', '60', 'Quad isolation, squeeze at top', 4),
(3, 'Wednesday: Hypertrophy', NULL, 'Leg Curls', '3x12-15', 'Moderate (65-70%)', '60', 'Hamstring focus, control negative', 5),
(3, 'Wednesday: Hypertrophy', NULL, 'Calf Raises', '4x15-20', 'Moderate (70-75%)', '60', 'Full ROM, pause at top and bottom', 6),
(3, 'Wednesday: Hypertrophy', NULL, 'Cable Crunches', '3x15-20', 'Moderate', '60', 'Core focus, controlled movement', 7),
(3, 'Wednesday: Hypertrophy', 'CONDITIONING', 'Conditioning Circuit', '15 min', 'Moderate-High', 'Minimal', 'Kettlebell swings, battle ropes, box jumps - rotate through', 8);

-- Thursday: Upper Pull + Arms (day_of_week = 4)
INSERT INTO workout_templates (day_of_week, day_name, section, exercise, sets_reps, intensity, rest_seconds, notes, order_index) VALUES
(4, 'Thursday: Upper Pull + Arms', 'WARM-UP', '5 min easy rowing or bike', 'N/A', '60-70% max HR', 'N/A', 'Elevate HR, warm back/shoulders', 1),
(4, 'Thursday: Upper Pull + Arms', 'WARM-UP', 'Band pull-aparts + shoulder dislocates', '2x15 each', 'Light band', 'N/A', 'Warm rotator cuff, prepare for pulling', 2),
(4, 'Thursday: Upper Pull + Arms', NULL, 'Barbell Rows', '4x4-6', 'Heavy (80-85%)', '180', 'Explosive pull, controlled lower', 3),
(4, 'Thursday: Upper Pull + Arms', NULL, 'Weighted Pull-ups', '4x5-8', 'Heavy (80-85%)', '180', 'Full range, add weight progressively', 4),
(4, 'Thursday: Upper Pull + Arms', NULL, 'Cable Rows (seated)', '3x10-12', 'Moderate (70-75%)', '90', 'Squeeze shoulder blades, controlled', 5),
(4, 'Thursday: Upper Pull + Arms', NULL, 'Lat Pulldowns', '3x12-15', 'Moderate (65-70%)', '60', 'Full stretch at top, squeeze at bottom', 6),
(4, 'Thursday: Upper Pull + Arms', NULL, 'Hammer Curls', '3x10-12', 'Moderate (70-75%)', '60', 'Brachialis focus, strict form', 7),
(4, 'Thursday: Upper Pull + Arms', NULL, 'Preacher Curls', '3x12-15', 'Light-Moderate (60-70%)', '60', 'Bicep peak isolation', 8),
(4, 'Thursday: Upper Pull + Arms', NULL, 'Reverse Curls', '3x12-15', 'Light (50-60%)', '60', 'Forearm focus', 9),
(4, 'Thursday: Upper Pull + Arms', 'VO2', 'VO2 Max Protocol: 3 Min Intervals', '5 rounds', '85-90% max HR (hard) / 70-75% (easy)', '120 easy', '3 min hard, 2 min easy. Total: 25 min', 10);

-- Friday: Home Full-Body Power (day_of_week = 5)
INSERT INTO workout_templates (day_of_week, day_name, section, exercise, sets_reps, intensity, rest_seconds, notes, order_index) VALUES
(5, 'Friday: Home Full-Body Power', 'WARM-UP', '5 min jump rope or shadowboxing', 'N/A', '60-70% max HR', 'N/A', 'Elevate HR, full body activation', 1),
(5, 'Friday: Home Full-Body Power', 'WARM-UP', 'Dynamic stretching flow', '3 min', 'Bodyweight', 'N/A', 'Arm circles, leg swings, hip openers, torso twists', 2),
(5, 'Friday: Home Full-Body Power', NULL, 'Dumbbell Power Clean', '5x3-5', 'Heavy (85-90%)', '180', 'Explosive hip drive, catch in front rack', 3),
(5, 'Friday: Home Full-Body Power', NULL, 'Goblet Squats', '4x6-8', 'Heavy (80-85%)', '120', 'Explosive up, controlled down', 4),
(5, 'Friday: Home Full-Body Power', NULL, 'Dumbbell Push Press', '4x5-6', 'Heavy (80-85%)', '120', 'Leg drive into explosive press', 5),
(5, 'Friday: Home Full-Body Power', NULL, 'Renegade Rows', '3x8/side', 'Moderate (70-75%)', '90', 'Anti-rotation core work + row', 6),
(5, 'Friday: Home Full-Body Power', NULL, 'Jump Squats', '3x10', 'Bodyweight', '90', 'Explosive power, soft landing', 7),
(5, 'Friday: Home Full-Body Power', NULL, 'Plank to Push-up', '3x10', 'Bodyweight', '60', 'Core stability, controlled transitions', 8),
(5, 'Friday: Home Full-Body Power', NULL, 'Mountain Climbers', '3x30 sec', 'Bodyweight', '60', 'Fast pace, core engaged', 9),
(5, 'Friday: Home Full-Body Power', 'THRESHOLD', 'Lactate Threshold Protocol', '24 min', '82-85% max HR', '120 between sets', '2 sets of 10 min threshold effort + 2 min easy between. Total: 24 min', 10);

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
-- 4. SUPPLEMENTS (Global defaults)
-- ============================================

INSERT INTO supplements (name, dosage, frequency, timing_notes, description, is_global, is_active) VALUES
('Minoxidil 5%', '1ml (10 sprays)', '2x daily', 'Morning: immediately after waking. Evening: 8-12 hours later (e.g., 8 PM). Wait 4h before shower/sweat.', 'Topical hair regrowth treatment. Apply to dry scalp only. Monitor for irritation first 2-4 weeks.', true, true),
('Magnesium', '300-400mg', 'Once daily', 'Take 30-60 min before bed', 'Glycinate or threonate form preferred. Enhances deep sleep, muscle recovery, reduces restlessness.', true, true);
