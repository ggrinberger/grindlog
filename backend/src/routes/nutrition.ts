import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// ============================================
// NUTRITION TARGETS
// ============================================

// Get user's nutrition targets
router.get('/targets', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT * FROM nutrition_targets WHERE user_id = $1 AND is_active = true`,
      [req.user!.id]
    );
    
    // Return default if no targets set
    if (result.rows.length === 0) {
      res.json({
        daily_calories: 3200,
        protein_g: 180,
        carbs_g: 350,
        fat_g: 80,
        is_default: true
      });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Set/update nutrition targets
router.put('/targets', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dailyCalories, proteinG, carbsG, fatG } = req.body;
    
    // Upsert targets
    const result = await query(
      `INSERT INTO nutrition_targets (user_id, daily_calories, protein_g, carbs_g, fat_g)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         daily_calories = COALESCE($2, nutrition_targets.daily_calories),
         protein_g = COALESCE($3, nutrition_targets.protein_g),
         carbs_g = COALESCE($4, nutrition_targets.carbs_g),
         fat_g = COALESCE($5, nutrition_targets.fat_g),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user!.id, dailyCalories, proteinG, carbsG, fatG]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// ============================================
// MEALS
// ============================================

// Log a meal
router.post('/meals', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { mealType, items, notes, loggedAt } = req.body;
    
    const validMealTypes = ['breakfast', 'pre_workout', 'lunch', 'post_workout', 'snack', 'dinner'];
    if (!validMealTypes.includes(mealType)) {
      return next(createError(`Invalid meal type. Must be one of: ${validMealTypes.join(', ')}`, 400));
    }
    
    // Calculate totals from items
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    if (items && items.length > 0) {
      for (const item of items) {
        totalCalories += item.calories || 0;
        totalProtein += item.proteinG || 0;
        totalCarbs += item.carbsG || 0;
        totalFat += item.fatG || 0;
      }
    }
    
    // Create meal
    const mealResult = await query(
      `INSERT INTO meals (user_id, meal_type, logged_at, total_calories, protein_g, carbs_g, fat_g, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user!.id, mealType, loggedAt || new Date(), totalCalories, totalProtein, totalCarbs, totalFat, notes]
    );
    
    const meal = mealResult.rows[0];
    
    // Add meal items
    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          `INSERT INTO meal_items (meal_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [meal.id, item.ingredient, item.amount, item.proteinG || 0, item.carbsG || 0, item.fatG || 0, item.calories || 0, item.notes]
        );
      }
    }
    
    res.status(201).json(meal);
  } catch (error) {
    next(error);
  }
});

// Get meals for a date
router.get('/meals', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const mealsResult = await query(
      `SELECT * FROM meals 
       WHERE user_id = $1 AND DATE(logged_at) = $2
       ORDER BY logged_at`,
      [req.user!.id, targetDate]
    );
    
    // Get items for each meal
    const meals = [];
    for (const meal of mealsResult.rows) {
      const itemsResult = await query(
        `SELECT * FROM meal_items WHERE meal_id = $1`,
        [meal.id]
      );
      meals.push({
        ...meal,
        items: itemsResult.rows
      });
    }
    
    res.json(meals);
  } catch (error) {
    next(error);
  }
});

// Get meal by ID
router.get('/meals/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const mealResult = await query(
      `SELECT * FROM meals WHERE id = $1 AND user_id = $2`,
      [id, req.user!.id]
    );
    
    if (mealResult.rows.length === 0) {
      return next(createError('Meal not found', 404));
    }
    
    const itemsResult = await query(
      `SELECT * FROM meal_items WHERE meal_id = $1`,
      [id]
    );
    
    res.json({
      ...mealResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    next(error);
  }
});

// Update meal
router.put('/meals/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { mealType, items, notes } = req.body;
    
    // Verify ownership
    const ownerCheck = await query(
      'SELECT id FROM meals WHERE id = $1 AND user_id = $2',
      [id, req.user!.id]
    );
    
    if (ownerCheck.rows.length === 0) {
      return next(createError('Meal not found', 404));
    }
    
    // Calculate new totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    if (items && items.length > 0) {
      for (const item of items) {
        totalCalories += item.calories || 0;
        totalProtein += item.proteinG || 0;
        totalCarbs += item.carbsG || 0;
        totalFat += item.fatG || 0;
      }
    }
    
    // Update meal
    const result = await query(
      `UPDATE meals 
       SET meal_type = COALESCE($1, meal_type),
           total_calories = $2,
           protein_g = $3,
           carbs_g = $4,
           fat_g = $5,
           notes = COALESCE($6, notes)
       WHERE id = $7 RETURNING *`,
      [mealType, totalCalories, totalProtein, totalCarbs, totalFat, notes, id]
    );
    
    // Replace items if provided
    if (items) {
      await query('DELETE FROM meal_items WHERE meal_id = $1', [id]);
      
      for (const item of items) {
        await query(
          `INSERT INTO meal_items (meal_id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, item.ingredient, item.amount, item.proteinG || 0, item.carbsG || 0, item.fatG || 0, item.calories || 0, item.notes]
        );
      }
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete meal
router.delete('/meals/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `DELETE FROM meals WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Meal not found', 404));
    }
    
    res.json({ message: 'Meal deleted' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DAILY SUMMARY
// ============================================

// Get daily nutrition summary
router.get('/summary/daily', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get meals totals
    const mealsResult = await query(
      `SELECT 
         COALESCE(SUM(total_calories), 0) as total_calories,
         COALESCE(SUM(protein_g), 0) as total_protein,
         COALESCE(SUM(carbs_g), 0) as total_carbs,
         COALESCE(SUM(fat_g), 0) as total_fat,
         COUNT(*) as meal_count
       FROM meals 
       WHERE user_id = $1 AND DATE(logged_at) = $2`,
      [req.user!.id, targetDate]
    );
    
    // Get targets
    const targetsResult = await query(
      `SELECT * FROM nutrition_targets WHERE user_id = $1 AND is_active = true`,
      [req.user!.id]
    );
    
    const targets = targetsResult.rows.length > 0 ? targetsResult.rows[0] : {
      daily_calories: 3200,
      protein_g: 180,
      carbs_g: 350,
      fat_g: 80
    };
    
    const consumed = mealsResult.rows[0];
    
    res.json({
      date: targetDate,
      consumed: {
        calories: Number(consumed.total_calories),
        protein: Number(consumed.total_protein),
        carbs: Number(consumed.total_carbs),
        fat: Number(consumed.total_fat),
        mealCount: Number(consumed.meal_count)
      },
      targets: {
        calories: targets.daily_calories,
        protein: targets.protein_g,
        carbs: targets.carbs_g,
        fat: targets.fat_g
      },
      remaining: {
        calories: targets.daily_calories - Number(consumed.total_calories),
        protein: targets.protein_g - Number(consumed.total_protein),
        carbs: targets.carbs_g - Number(consumed.total_carbs),
        fat: targets.fat_g - Number(consumed.total_fat)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get weekly nutrition summary
router.get('/summary/weekly', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT 
         DATE(logged_at) as date,
         SUM(total_calories) as total_calories,
         SUM(protein_g) as total_protein,
         SUM(carbs_g) as total_carbs,
         SUM(fat_g) as total_fat,
         COUNT(*) as meal_count
       FROM meals 
       WHERE user_id = $1 
         AND logged_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(logged_at)
       ORDER BY date`,
      [req.user!.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// ============================================
// NUTRITION PLANS (Pre-built meal plans by day type)
// ============================================

// Get all nutrition plans
router.get('/plans', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT id, name, day_type, description, daily_calories, protein_g, carbs_g, fat_g, 
              meals_count, notes, is_active, created_at
       FROM nutrition_plans
       WHERE is_active = true
       ORDER BY 
         CASE day_type 
           WHEN 'high_intensity' THEN 1 
           WHEN 'moderate' THEN 2 
           WHEN 'recovery' THEN 3 
         END`
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get nutrition plan by ID with meal templates
router.get('/plans/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Get plan
    const planResult = await query(
      `SELECT id, name, day_type, description, daily_calories, protein_g, carbs_g, fat_g,
              meals_count, notes, is_active, created_at
       FROM nutrition_plans
       WHERE id = $1`,
      [id]
    );
    
    if (planResult.rows.length === 0) {
      return next(createError('Nutrition plan not found', 404));
    }
    
    const plan = planResult.rows[0];
    
    // Get meal templates for this plan
    const templatesResult = await query(
      `SELECT mt.id, mt.meal_type, mt.option_name, mt.total_calories, 
              mt.protein_g, mt.carbs_g, mt.fat_g, mt.timing_notes, mt.order_index
       FROM meal_templates mt
       WHERE mt.plan_id = $1
       ORDER BY mt.order_index`,
      [id]
    );
    
    // Get items for each template
    const templates = [];
    for (const template of templatesResult.rows) {
      const itemsResult = await query(
        `SELECT id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index
         FROM meal_template_items
         WHERE template_id = $1
         ORDER BY order_index`,
        [template.id]
      );
      
      templates.push({
        ...template,
        items: itemsResult.rows
      });
    }
    
    // Group templates by meal type
    const mealsByType: Record<string, any[]> = {};
    templates.forEach(t => {
      if (!mealsByType[t.meal_type]) {
        mealsByType[t.meal_type] = [];
      }
      mealsByType[t.meal_type].push(t);
    });
    
    res.json({
      ...plan,
      meals: mealsByType
    });
  } catch (error) {
    next(error);
  }
});

// Get nutrition plan by day type
router.get('/plans/day-type/:dayType', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dayType } = req.params;
    
    const validTypes = ['high_intensity', 'moderate', 'recovery'];
    if (!validTypes.includes(dayType)) {
      return next(createError(`Invalid day type. Must be one of: ${validTypes.join(', ')}`, 400));
    }
    
    const planResult = await query(
      `SELECT id FROM nutrition_plans WHERE day_type = $1 AND is_active = true LIMIT 1`,
      [dayType]
    );
    
    if (planResult.rows.length === 0) {
      return next(createError('No plan found for this day type', 404));
    }
    
    // Redirect to the full plan endpoint
    req.params.id = planResult.rows[0].id;
    
    // Re-fetch with the ID
    const fullPlanResult = await query(
      `SELECT id, name, day_type, description, daily_calories, protein_g, carbs_g, fat_g,
              meals_count, notes, is_active, created_at
       FROM nutrition_plans
       WHERE id = $1`,
      [planResult.rows[0].id]
    );
    
    const plan = fullPlanResult.rows[0];
    
    const templatesResult = await query(
      `SELECT mt.id, mt.meal_type, mt.option_name, mt.total_calories, 
              mt.protein_g, mt.carbs_g, mt.fat_g, mt.timing_notes, mt.order_index
       FROM meal_templates mt
       WHERE mt.plan_id = $1
       ORDER BY mt.order_index`,
      [plan.id]
    );
    
    const templates = [];
    for (const template of templatesResult.rows) {
      const itemsResult = await query(
        `SELECT id, ingredient, amount, protein_g, carbs_g, fat_g, calories, notes, order_index
         FROM meal_template_items
         WHERE template_id = $1
         ORDER BY order_index`,
        [template.id]
      );
      
      templates.push({
        ...template,
        items: itemsResult.rows
      });
    }
    
    const mealsByType: Record<string, any[]> = {};
    templates.forEach(t => {
      if (!mealsByType[t.meal_type]) {
        mealsByType[t.meal_type] = [];
      }
      mealsByType[t.meal_type].push(t);
    });
    
    res.json({
      ...plan,
      meals: mealsByType
    });
  } catch (error) {
    next(error);
  }
});

export default router;
