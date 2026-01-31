import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// ============================================
// SUPPLEMENTS
// ============================================

// Get all supplements (user's + global)
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT * FROM supplements 
       WHERE (user_id = $1 OR is_global = true) AND is_active = true
       ORDER BY name`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get supplement by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT * FROM supplements 
       WHERE id = $1 AND (user_id = $2 OR is_global = true) AND is_active = true`,
      [id, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Supplement not found', 404));
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create supplement
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, dosage, frequency, timingNotes, description } = req.body;
    
    const result = await query(
      `INSERT INTO supplements (user_id, name, dosage, frequency, timing_notes, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user!.id, name, dosage, frequency, timingNotes, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update supplement
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, dosage, frequency, timingNotes, description, isActive } = req.body;
    
    // Only allow updating user's own supplements (not global)
    const result = await query(
      `UPDATE supplements 
       SET name = COALESCE($1, name),
           dosage = COALESCE($2, dosage),
           frequency = COALESCE($3, frequency),
           timing_notes = COALESCE($4, timing_notes),
           description = COALESCE($5, description),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [name, dosage, frequency, timingNotes, description, isActive, id, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Supplement not found or not owned by user', 404));
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete supplement
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE supplements SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Supplement not found or not owned by user', 404));
    }
    
    res.json({ message: 'Supplement deleted' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SUPPLEMENT LOGS
// ============================================

// Log supplement intake
router.post('/:supplementId/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { supplementId } = req.params;
    const { notes, takenAt } = req.body;
    
    // Verify supplement exists and user has access
    const suppCheck = await query(
      `SELECT id FROM supplements WHERE id = $1 AND (user_id = $2 OR is_global = true) AND is_active = true`,
      [supplementId, req.user!.id]
    );
    
    if (suppCheck.rows.length === 0) {
      return next(createError('Supplement not found', 404));
    }
    
    const result = await query(
      `INSERT INTO supplement_logs (user_id, supplement_id, taken_at, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user!.id, supplementId, takenAt || new Date(), notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get user's supplement logs
router.get('/logs/history', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 50, offset = 0, startDate, endDate, supplementId } = req.query;
    
    let sql = `
      SELECT sl.*, s.name as supplement_name, s.dosage, s.timing_notes
      FROM supplement_logs sl
      JOIN supplements s ON sl.supplement_id = s.id
      WHERE sl.user_id = $1
    `;
    const params: (string | number)[] = [req.user!.id];
    let paramIndex = 2;
    
    if (startDate) {
      sql += ` AND sl.taken_at >= $${paramIndex}`;
      params.push(startDate as string);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND sl.taken_at <= $${paramIndex}`;
      params.push(endDate as string);
      paramIndex++;
    }
    
    if (supplementId) {
      sql += ` AND sl.supplement_id = $${paramIndex}`;
      params.push(supplementId as string);
      paramIndex++;
    }
    
    sql += ` ORDER BY sl.taken_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get today's supplement status
router.get('/logs/today', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get all active supplements
    const supplementsResult = await query(
      `SELECT * FROM supplements 
       WHERE (user_id = $1 OR is_global = true) AND is_active = true
       ORDER BY name`,
      [req.user!.id]
    );
    
    // Get today's logs
    const logsResult = await query(
      `SELECT sl.*, s.name as supplement_name
       FROM supplement_logs sl
       JOIN supplements s ON sl.supplement_id = s.id
       WHERE sl.user_id = $1 AND DATE(sl.taken_at) = CURRENT_DATE`,
      [req.user!.id]
    );
    
    // Build status for each supplement
    const status = supplementsResult.rows.map(supp => {
      const logs = logsResult.rows.filter(log => log.supplement_id === supp.id);
      const expectedDoses = supp.frequency?.includes('2x') ? 2 : 1;
      
      return {
        supplement: supp,
        todayLogs: logs,
        dosesLogged: logs.length,
        expectedDoses,
        complete: logs.length >= expectedDoses
      };
    });
    
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Delete supplement log
router.delete('/logs/:logId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { logId } = req.params;
    
    const result = await query(
      `DELETE FROM supplement_logs WHERE id = $1 AND user_id = $2 RETURNING id`,
      [logId, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Log not found', 404));
    }
    
    res.json({ message: 'Log deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
