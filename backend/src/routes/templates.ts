import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// ============================================
// WORKOUT TEMPLATES
// ============================================

// Get all workout templates
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT * FROM workout_templates 
       WHERE is_active = true 
       ORDER BY day_of_week, order_index`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get templates by day of week
router.get('/day/:dayOfWeek', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dayOfWeek } = req.params;
    const dayNum = parseInt(dayOfWeek);
    
    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      return next(createError('Invalid day of week (0-6)', 400));
    }
    
    const result = await query(
      `SELECT * FROM workout_templates 
       WHERE day_of_week = $1 AND is_active = true 
       ORDER BY order_index`,
      [dayNum]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get templates grouped by day
router.get('/weekly', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT * FROM workout_templates 
       WHERE is_active = true 
       ORDER BY day_of_week, order_index`
    );
    
    // Group by day
    const weeklyPlan: Record<number, typeof result.rows> = {};
    const dayNames: Record<number, string> = {};
    
    for (const template of result.rows) {
      const day = template.day_of_week;
      if (!weeklyPlan[day]) {
        weeklyPlan[day] = [];
        dayNames[day] = template.day_name;
      }
      weeklyPlan[day].push(template);
    }
    
    res.json({ weeklyPlan, dayNames });
  } catch (error) {
    next(error);
  }
});

// Create workout template
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dayOfWeek, dayName, section, exercise, setsReps, intensity, restSeconds, notes, orderIndex } = req.body;
    
    const result = await query(
      `INSERT INTO workout_templates (day_of_week, day_name, section, exercise, sets_reps, intensity, rest_seconds, notes, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [dayOfWeek, dayName, section, exercise, setsReps, intensity, restSeconds, notes, orderIndex || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update workout template
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, dayName, section, exercise, setsReps, intensity, restSeconds, notes, orderIndex, isActive } = req.body;
    
    const result = await query(
      `UPDATE workout_templates 
       SET day_of_week = COALESCE($1, day_of_week),
           day_name = COALESCE($2, day_name),
           section = COALESCE($3, section),
           exercise = COALESCE($4, exercise),
           sets_reps = COALESCE($5, sets_reps),
           intensity = COALESCE($6, intensity),
           rest_seconds = COALESCE($7, rest_seconds),
           notes = COALESCE($8, notes),
           order_index = COALESCE($9, order_index),
           is_active = COALESCE($10, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [dayOfWeek, dayName, section, exercise, setsReps, intensity, restSeconds, notes, orderIndex, isActive, id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Template not found', 404));
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete workout template
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE workout_templates SET is_active = false WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Template not found', 404));
    }
    
    res.json({ message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
