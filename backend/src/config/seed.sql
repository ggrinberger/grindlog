-- Seed data for GrindLog

-- Default exercises - Chest
INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Bench Press', 'Strength', 'Chest', 'Barbell bench press on flat bench', false, true),
('Incline Bench Press', 'Strength', 'Chest', 'Barbell bench press on incline bench', false, true),
('Decline Bench Press', 'Strength', 'Chest', 'Barbell bench press on decline bench', false, true),
('Dumbbell Flyes', 'Strength', 'Chest', 'Dumbbell flyes on flat bench', false, true),
('Cable Crossover', 'Strength', 'Chest', 'Cable crossover for chest', false, true),
('Push-ups', 'Bodyweight', 'Chest', 'Standard push-ups', false, true),
('Dips', 'Bodyweight', 'Chest', 'Parallel bar dips', false, true);

-- Default exercises - Back
INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Deadlift', 'Strength', 'Back', 'Conventional barbell deadlift', false, true),
('Bent Over Row', 'Strength', 'Back', 'Barbell bent over row', false, true),
('Lat Pulldown', 'Strength', 'Back', 'Cable lat pulldown', false, true),
('Pull-ups', 'Bodyweight', 'Back', 'Standard pull-ups', false, true),
('Chin-ups', 'Bodyweight', 'Back', 'Underhand grip pull-ups', false, true),
('Seated Cable Row', 'Strength', 'Back', 'Seated cable row', false, true),
('T-Bar Row', 'Strength', 'Back', 'T-bar row', false, true),
('Face Pulls', 'Strength', 'Back', 'Cable face pulls for rear delts', false, true);

-- Default exercises - Legs
INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Squat', 'Strength', 'Legs', 'Barbell back squat', false, true),
('Front Squat', 'Strength', 'Legs', 'Barbell front squat', false, true),
('Leg Press', 'Strength', 'Legs', 'Machine leg press', false, true),
('Romanian Deadlift', 'Strength', 'Legs', 'Romanian deadlift for hamstrings', false, true),
('Leg Curl', 'Strength', 'Legs', 'Machine leg curl', false, true),
('Leg Extension', 'Strength', 'Legs', 'Machine leg extension', false, true),
('Calf Raises', 'Strength', 'Legs', 'Standing calf raises', false, true),
('Lunges', 'Strength', 'Legs', 'Walking or stationary lunges', false, true),
('Bulgarian Split Squat', 'Strength', 'Legs', 'Single leg split squat', false, true),
('Hip Thrust', 'Strength', 'Legs', 'Barbell hip thrust for glutes', false, true);

-- Default exercises - Shoulders
INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Overhead Press', 'Strength', 'Shoulders', 'Standing barbell overhead press', false, true),
('Dumbbell Shoulder Press', 'Strength', 'Shoulders', 'Seated dumbbell shoulder press', false, true),
('Lateral Raises', 'Strength', 'Shoulders', 'Dumbbell lateral raises', false, true),
('Front Raises', 'Strength', 'Shoulders', 'Dumbbell front raises', false, true),
('Reverse Flyes', 'Strength', 'Shoulders', 'Dumbbell reverse flyes for rear delts', false, true),
('Arnold Press', 'Strength', 'Shoulders', 'Arnold dumbbell press', false, true),
('Upright Row', 'Strength', 'Shoulders', 'Barbell upright row', false, true);

-- Default exercises - Arms
INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Barbell Curl', 'Strength', 'Arms', 'Standing barbell bicep curl', false, true),
('Dumbbell Curl', 'Strength', 'Arms', 'Standing dumbbell bicep curl', false, true),
('Hammer Curl', 'Strength', 'Arms', 'Dumbbell hammer curl', false, true),
('Preacher Curl', 'Strength', 'Arms', 'Preacher bench bicep curl', false, true),
('Tricep Pushdown', 'Strength', 'Arms', 'Cable tricep pushdown', false, true),
('Skull Crushers', 'Strength', 'Arms', 'Lying tricep extension', false, true),
('Close Grip Bench Press', 'Strength', 'Arms', 'Close grip bench for triceps', false, true),
('Overhead Tricep Extension', 'Strength', 'Arms', 'Dumbbell overhead tricep extension', false, true);

-- Default exercises - Core
INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Plank', 'Bodyweight', 'Core', 'Standard plank hold', false, true),
('Crunches', 'Bodyweight', 'Core', 'Standard crunches', false, true),
('Hanging Leg Raises', 'Bodyweight', 'Core', 'Hanging leg raises', false, true),
('Russian Twist', 'Bodyweight', 'Core', 'Seated russian twist', false, true),
('Ab Wheel Rollout', 'Bodyweight', 'Core', 'Ab wheel rollout', false, true),
('Cable Woodchop', 'Strength', 'Core', 'Cable woodchop', false, true),
('Dead Bug', 'Bodyweight', 'Core', 'Dead bug exercise', false, true);

-- Default exercises - Cardio
INSERT INTO exercises (name, category, muscle_group, description, is_cardio, is_public) VALUES
('Running', 'Cardio', 'Full Body', 'Outdoor or treadmill running', true, true),
('Cycling', 'Cardio', 'Legs', 'Stationary bike or outdoor cycling', true, true),
('Rowing', 'Cardio', 'Full Body', 'Rowing machine', true, true),
('Elliptical', 'Cardio', 'Full Body', 'Elliptical machine', true, true),
('Swimming', 'Cardio', 'Full Body', 'Swimming laps', true, true),
('Jump Rope', 'Cardio', 'Full Body', 'Jump rope / skipping', true, true),
('Stair Climber', 'Cardio', 'Legs', 'Stair climber machine', true, true),
('Walking', 'Cardio', 'Legs', 'Walking or hiking', true, true),
('HIIT', 'Cardio', 'Full Body', 'High intensity interval training', true, true),
('Burpees', 'Cardio', 'Full Body', 'Burpees', true, true);

-- Default supplements
INSERT INTO supplements (name, description) VALUES
('Whey Protein', 'Whey protein powder'),
('Creatine', 'Creatine monohydrate'),
('Pre-Workout', 'Pre-workout supplement'),
('BCAA', 'Branched-chain amino acids'),
('Fish Oil', 'Omega-3 fish oil'),
('Vitamin D', 'Vitamin D3 supplement'),
('Multivitamin', 'Daily multivitamin'),
('Caffeine', 'Caffeine pills or coffee'),
('ZMA', 'Zinc, Magnesium, Vitamin B6'),
('Beta-Alanine', 'Beta-alanine supplement');
