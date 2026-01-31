import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get food items
router.get('/foods', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    let sql = `SELECT * FROM food_items WHERE is_public = true OR created_by = $1`;
    const params: unknown[] = [req.user!.id];
    
    if (search) {
      sql += ` AND name ILIKE $2`;
      params.push(`%${search}%`);
    }
    
    sql += ` ORDER BY name LIMIT 50`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create food item
router.post('/foods', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, brand, servingSize, calories, protein, carbs, fat, fiber, isPublic } = req.body;
    
    const result = await query(
      `INSERT INTO food_items (name, brand, serving_size, calories, protein, carbs, fat, fiber, created_by, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, brand, servingSize, calories, protein, carbs, fat, fiber, req.user!.id, isPublic || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Log food/meal
router.post('/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { foodItemId, customName, servings, mealType, calories, protein, carbs, fat } = req.body;
    
    const result = await query(
      `INSERT INTO diet_logs (user_id, food_item_id, custom_name, servings, meal_type, calories, protein, carbs, fat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user!.id, foodItemId, customName, servings || 1, mealType, calories, protein, carbs, fat]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get diet logs for a date range
router.get('/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    let sql = `
      SELECT dl.*, fi.name as food_name, fi.brand
      FROM diet_logs dl
      LEFT JOIN food_items fi ON dl.food_item_id = fi.id
      WHERE dl.user_id = $1
    `;
    const params: unknown[] = [req.user!.id];
    
    if (startDate) {
      params.push(startDate);
      sql += ` AND dl.logged_at >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      sql += ` AND dl.logged_at <= $${params.length}`;
    }
    
    sql += ` ORDER BY dl.logged_at DESC LIMIT 100`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get daily summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const result = await query(
      `SELECT 
        COUNT(*) as meals_logged,
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(protein), 0) as total_protein,
        COALESCE(SUM(carbs), 0) as total_carbs,
        COALESCE(SUM(fat), 0) as total_fat
       FROM diet_logs
       WHERE user_id = $1 AND DATE(logged_at) = $2`,
      [req.user!.id, targetDate]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Supplements
router.get('/supplements', authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM supplements ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Log supplement
router.post('/supplements/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { supplementId, dosage } = req.body;
    
    const result = await query(
      `INSERT INTO supplement_logs (user_id, supplement_id, dosage)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user!.id, supplementId, dosage]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get supplement logs
router.get('/supplements/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const result = await query(
      `SELECT sl.*, s.name as supplement_name
       FROM supplement_logs sl
       JOIN supplements s ON sl.supplement_id = s.id
       WHERE sl.user_id = $1 AND DATE(sl.taken_at) = $2
       ORDER BY sl.taken_at`,
      [req.user!.id, targetDate]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
