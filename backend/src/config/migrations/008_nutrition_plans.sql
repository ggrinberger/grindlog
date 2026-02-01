-- Migration: Nutrition Plans and Meal Templates
-- Date: 2026-02-01
-- Source: Israel's Strength Longevity VO2 Program - Nutrition & Hydration sheet
-- Daily Target: 3,300-3,600 cal | Protein: 170-200g | Carbs: High on intensity days | Fats: 70-90g

-- ============================================
-- NUTRITION PLANS BY DAY TYPE
-- ============================================

CREATE TABLE IF NOT EXISTS nutrition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    day_type VARCHAR(50) NOT NULL, -- 'high_intensity', 'moderate', 'recovery'
    description TEXT,
    daily_calories INTEGER,
    protein_g INTEGER,
    carbs_g INTEGER,
    fat_g INTEGER,
    meals_count INTEGER DEFAULT 6,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MEAL TEMPLATES (Pre-defined meal options)
-- ============================================

CREATE TABLE IF NOT EXISTS meal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES nutrition_plans(id) ON DELETE CASCADE,
    meal_type VARCHAR(50) NOT NULL, -- breakfast, pre_workout, lunch, post_workout, snack, dinner
    option_name VARCHAR(100), -- e.g., "Option 1", "Alternative"
    total_calories INTEGER,
    protein_g DECIMAL(6,2),
    carbs_g DECIMAL(6,2),
    fat_g DECIMAL(6,2),
    timing_notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MEAL TEMPLATE ITEMS (Ingredients in each meal)
-- ============================================

CREATE TABLE IF NOT EXISTS meal_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES meal_templates(id) ON DELETE CASCADE,
    ingredient VARCHAR(200) NOT NULL,
    amount VARCHAR(100),
    protein_g DECIMAL(6,2) DEFAULT 0,
    carbs_g DECIMAL(6,2) DEFAULT 0,
    fat_g DECIMAL(6,2) DEFAULT 0,
    calories INTEGER DEFAULT 0,
    notes TEXT,
    order_index INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_nutrition_plans_day_type ON nutrition_plans(day_type);
CREATE INDEX IF NOT EXISTS idx_meal_templates_plan ON meal_templates(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_template_items_template ON meal_template_items(template_id);

-- ============================================
-- SEED: HIGH-INTENSITY DAY PLAN
-- Days: Mon, Tue, Wed, Thu, Fri
-- Target: ~3,550 cal, ~195g P / 390g C / 85g F
-- ============================================

INSERT INTO nutrition_plans (name, day_type, description, daily_calories, protein_g, carbs_g, fat_g, meals_count, notes)
VALUES (
    'High-Intensity Training Day',
    'high_intensity',
    'Optimized for gym days with heavy lifting and VO2 work',
    3550,
    195,
    390,
    85,
    6,
    'Split calories across 6 meals. High carbs for performance and recovery.'
);

-- Get the plan ID for high-intensity
DO $$
DECLARE
    high_plan_id UUID;
    breakfast_1_id UUID;
    breakfast_2_id UUID;
    pre_workout_id UUID;
    lunch_id UUID;
    lunch_alt_id UUID;
    post_workout_id UUID;
    post_alt_id UUID;
    snack_id UUID;
    snack_alt_id UUID;
    dinner_id UUID;
    dinner_alt_id UUID;
BEGIN
    SELECT id INTO high_plan_id FROM nutrition_plans WHERE day_type = 'high_intensity' LIMIT 1;
    
    -- BREAKFAST OPTION 1 (~950 cal)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'breakfast', 'Option 1 - Eggs & Oatmeal', 950, 33, 175, 26, 'Full eggs for protein + yolk fat with complex carbs', 1)
    RETURNING id INTO breakfast_1_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (breakfast_1_id, 'Eggs', '4 large', 24, 0, 20, 280, 'Full eggs for protein + yolk fat', 1),
    (breakfast_1_id, 'Oatmeal (dry)', '200g', 8, 130, 6, 600, 'Complex carbs, fiber', 2),
    (breakfast_1_id, 'Banana', '1 medium', 1, 27, 0, 105, 'Quick carbs, potassium', 3),
    (breakfast_1_id, 'Honey', '1 tbsp', 0, 18, 0, 64, 'Simple sugars, taste', 4);
    
    -- BREAKFAST OPTION 2 (~750 cal)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'breakfast', 'Option 2 - Protein Shake', 750, 43, 101, 18, 'Quick liquid breakfast for busy mornings', 2)
    RETURNING id INTO breakfast_2_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (breakfast_2_id, 'Protein Powder', '1 scoop', 25, 5, 2, 130, 'Quality whey isolate', 1),
    (breakfast_2_id, 'Bananas', '2 medium', 2, 54, 0, 210, 'High carbs for energy', 2),
    (breakfast_2_id, 'Whole Milk', '150ml', 8, 12, 8, 150, 'Fat + protein, creamy', 3),
    (breakfast_2_id, 'Granola', '30g', 8, 30, 8, 200, 'Crunchy carbs + fat', 4);
    
    -- PRE-WORKOUT (90 min before)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'pre_workout', 'Banana + Almond Butter', 250, 8, 35, 8, '90 min before training - quick carbs + fat for sustained energy', 3)
    RETURNING id INTO pre_workout_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (pre_workout_id, 'Banana + Almond Butter', '120g + 15g', 8, 35, 8, 250, 'Quick carbs + fat for sustained energy', 1);
    
    -- LUNCH (~1,050 cal)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'lunch', 'Chicken & Rice', 1050, 79, 118, 34, 'Main midday meal with lean protein and high GI carbs', 4)
    RETURNING id INTO lunch_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (lunch_id, 'Chicken Breast', '300g cooked', 66, 0, 7, 330, 'Lean protein, zero carbs', 1),
    (lunch_id, 'White Rice', '350g cooked', 7, 110, 0, 455, 'High GI carbs for recovery', 2),
    (lunch_id, 'Broccoli', '200g raw', 6, 8, 0, 55, 'Micronutrients, fiber', 3),
    (lunch_id, 'Olive Oil', '2 tbsp', 0, 0, 27, 240, 'Fat, absorption of fat-soluble vitamins', 4);
    
    -- LUNCH ALTERNATIVE (~780 cal)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'lunch', 'Beef & Sweet Potato', 780, 62, 78, 12, 'Alternative with higher iron and B12', 5)
    RETURNING id INTO lunch_alt_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (lunch_alt_id, 'Lean Beef', '250g', 56, 0, 12, 340, 'Higher iron, B12', 1),
    (lunch_alt_id, 'Sweet Potato', '300g cooked', 3, 75, 0, 310, 'Slower carbs, micronutrients', 2),
    (lunch_alt_id, 'Spinach Salad', '150g raw', 3, 3, 0, 35, 'Micronutrients, fiber', 3);
    
    -- POST-WORKOUT (~560 cal, within 30 min)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'post_workout', 'Protein Shake Post-Workout', 560, 52.5, 68, 12, 'Within 30 min of training - fast digestion whey + carbs', 6)
    RETURNING id INTO post_workout_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (post_workout_id, 'Protein Powder', '1.5 scoops', 38, 8, 2, 195, 'Fast digestion whey', 1),
    (post_workout_id, 'Whole Milk', '400ml', 13, 19, 10, 270, 'Carbs + fat for absorption', 2),
    (post_workout_id, 'Banana', '150g', 1.5, 41, 0, 133, 'Quick carbs spike insulin', 3);
    
    -- POST-WORKOUT SOLID ALTERNATIVE (~515 cal)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'post_workout', 'Solid Food Post-Workout', 515, 46, 80, 3, 'Solid food alternative for those who prefer real food', 7)
    RETURNING id INTO post_alt_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (post_alt_id, 'Chicken', '150g cooked', 42, 0, 3, 195, 'Solid food alternative', 1),
    (post_alt_id, 'White Rice (cooked)', '150g', 3, 55, 0, 195, 'Fast carbs', 2),
    (post_alt_id, 'Fruit (banana/berries)', '1 serving', 1, 25, 0, 100, 'Simple sugars', 3);
    
    -- SNACK (~380 cal, 2-3h before bed)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'snack', 'Greek Yogurt & Berries', 380, 29, 58, 13, '2-3h before bed - casein + whey blend for overnight recovery', 8)
    RETURNING id INTO snack_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (snack_id, 'Greek Yogurt', '200g', 20, 7, 5, 150, 'Casein + whey blend', 1),
    (snack_id, 'Berries', '150g', 1, 21, 0, 85, 'Antioxidants, fiber', 2),
    (snack_id, 'Granola', '30g', 8, 30, 8, 200, 'Carbs, texture', 3);
    
    -- SNACK ALTERNATIVE (~445 cal)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'snack', 'Cottage Cheese Alternative', 445, 35, 46, 19, 'Higher protein than yogurt option', 9)
    RETURNING id INTO snack_alt_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (snack_alt_id, 'Cottage Cheese', '200g', 28, 5, 5, 180, 'Higher protein than yogurt', 1),
    (snack_alt_id, 'Honey', '2 tbsp', 0, 35, 0, 128, 'Simple sugars, sleep', 2),
    (snack_alt_id, 'Almonds', '20g', 7, 6, 14, 140, 'Magnesium for sleep', 3);
    
    -- DINNER (~720 cal)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'dinner', 'Salmon & Brown Rice', 720, 59, 64, 31, 'Omega-3 rich dinner with low GI carbs', 10)
    RETURNING id INTO dinner_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (dinner_id, 'Salmon', '250g cooked', 50, 0, 15, 330, 'Omega-3, high quality protein', 1),
    (dinner_id, 'Brown Rice', '200g cooked', 5, 55, 2, 250, 'Low GI carbs, fiber', 2),
    (dinner_id, 'Asparagus', '200g', 4, 9, 0, 40, 'Micronutrients, fiber, low cal', 3),
    (dinner_id, 'Olive Oil', '15ml', 0, 0, 14, 126, 'Fat for absorption', 4);
    
    -- DINNER ALTERNATIVE (~740 cal)
    INSERT INTO meal_templates (plan_id, meal_type, option_name, total_calories, protein_g, carbs_g, fat_g, timing_notes, order_index)
    VALUES (high_plan_id, 'dinner', 'Steak & Sweet Potato', 740, 56, 66, 20, 'Iron, B12, and creatine from red meat', 11)
    RETURNING id INTO dinner_alt_id;
    
    INSERT INTO meal_template_items (template_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index) VALUES
    (dinner_alt_id, 'Red Meat (Steak)', '200g', 50, 0, 20, 380, 'Iron, B12, creatine', 1),
    (dinner_alt_id, 'Sweet Potato', '250g', 2, 58, 0, 240, 'Slower carbs', 2),
    (dinner_alt_id, 'Salad (mixed greens)', '200g', 4, 8, 0, 50, 'Micronutrients', 3);
END $$;

-- ============================================
-- SEED: MODERATE DAY PLAN  
-- Days: Sunday, Wednesday
-- Target: ~3,150 cal, ~175g P / 270g C / 50g F
-- ============================================

INSERT INTO nutrition_plans (name, day_type, description, daily_calories, protein_g, carbs_g, fat_g, meals_count, notes)
VALUES (
    'Moderate Training Day',
    'moderate',
    'Lower volume training days with adjusted macros',
    3150,
    175,
    270,
    50,
    5,
    'Split calories across 5 meals. Moderate carbs, maintain protein.'
);

-- ============================================
-- SEED: RECOVERY DAY PLAN
-- Day: Saturday
-- Target: ~2,600 cal, ~140g P / 200g C / 55g F
-- ============================================

INSERT INTO nutrition_plans (name, day_type, description, daily_calories, protein_g, carbs_g, fat_g, meals_count, notes)
VALUES (
    'Recovery Day',
    'recovery',
    'Complete rest day for active recovery - lowest calorie day',
    2600,
    140,
    200,
    55,
    4,
    'Split calories across 4 meals. Lower overall intake for recovery.'
);

COMMIT;
