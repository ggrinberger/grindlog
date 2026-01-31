import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// ============================================
// ROUTINES
// ============================================

// Get all routines
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    
    let sql = `SELECT * FROM routines WHERE is_active = true`;
    const params: string[] = [];
    
    if (type && (type === 'morning' || type === 'evening')) {
      sql += ` AND type = $1`;
      params.push(type);
    }
    
    sql += ` ORDER BY type, name`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get routine by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT * FROM routines WHERE id = $1 AND is_active = true`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Routine not found', 404));
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create routine
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, type, description, totalDurationMinutes, items } = req.body;
    
    if (!['morning', 'evening'].includes(type)) {
      return next(createError('Type must be morning or evening', 400));
    }
    
    const result = await query(
      `INSERT INTO routines (name, type, description, total_duration_minutes, items)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, type, description, totalDurationMinutes, JSON.stringify(items || [])]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update routine
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, type, description, totalDurationMinutes, items, isActive } = req.body;
    
    const result = await query(
      `UPDATE routines 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           description = COALESCE($3, description),
           total_duration_minutes = COALESCE($4, total_duration_minutes),
           items = COALESCE($5, items),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name, type, description, totalDurationMinutes, items ? JSON.stringify(items) : null, isActive, id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Routine not found', 404));
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// ============================================
// ROUTINE COMPLETIONS
// ============================================

// Log routine completion
router.post('/:routineId/complete', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { routineId } = req.params;
    const { itemsCompleted, notes } = req.body;
    
    // Verify routine exists
    const routineCheck = await query(
      'SELECT id FROM routines WHERE id = $1 AND is_active = true',
      [routineId]
    );
    
    if (routineCheck.rows.length === 0) {
      return next(createError('Routine not found', 404));
    }
    
    const result = await query(
      `INSERT INTO routine_completions (user_id, routine_id, items_completed, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user!.id, routineId, JSON.stringify(itemsCompleted || []), notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get user's routine completions
router.get('/completions/history', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate } = req.query;
    
    let sql = `
      SELECT rc.*, r.name as routine_name, r.type as routine_type
      FROM routine_completions rc
      JOIN routines r ON rc.routine_id = r.id
      WHERE rc.user_id = $1
    `;
    const params: (string | number)[] = [req.user!.id];
    let paramIndex = 2;
    
    if (startDate) {
      sql += ` AND rc.completed_at >= $${paramIndex}`;
      params.push(startDate as string);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND rc.completed_at <= $${paramIndex}`;
      params.push(endDate as string);
      paramIndex++;
    }
    
    sql += ` ORDER BY rc.completed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get today's completion status
router.get('/completions/today', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT rc.*, r.name as routine_name, r.type as routine_type
       FROM routine_completions rc
       JOIN routines r ON rc.routine_id = r.id
       WHERE rc.user_id = $1 AND DATE(rc.completed_at) = CURRENT_DATE`,
      [req.user!.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
