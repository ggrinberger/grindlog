import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Get all exercises
router.get('/exercises', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT id, name, category, muscle_group, description, is_cardio, is_public, created_by, created_at,
              COALESCE(typical_section, 'exercise') as typical_section
       FROM exercises 
       WHERE is_public = true OR created_by = $1 
       ORDER BY name`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create exercise
router.post('/exercises', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, category, muscleGroup, description, isCardio, isPublic } = req.body;
    
    const result = await query(
      `INSERT INTO exercises (name, category, muscle_group, description, is_cardio, created_by, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, category, muscleGroup, description, isCardio || false, req.user!.id, isPublic || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get workout plans
router.get('/plans', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT wp.*, 
        (SELECT COUNT(*) FROM workout_plan_exercises WHERE plan_id = wp.id) as exercise_count
       FROM workout_plans wp
       WHERE wp.user_id = $1 OR wp.is_public = true
       ORDER BY wp.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create workout plan
router.post('/plans', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, isPublic, exercises } = req.body;
    
    const planResult = await query(
      `INSERT INTO workout_plans (user_id, name, description, is_public)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user!.id, name, description, isPublic || false]
    );
    
    const plan = planResult.rows[0];
    
    if (exercises && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await query(
          `INSERT INTO workout_plan_exercises (plan_id, exercise_id, sets, reps, duration_minutes, notes, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [plan.id, ex.exerciseId, ex.sets, ex.reps, ex.durationMinutes, ex.notes, i]
        );
      }
    }
    
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

// Start workout session
router.post('/sessions', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { planId, name, notes } = req.body;
    
    const result = await query(
      `INSERT INTO workout_sessions (user_id, plan_id, name, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user!.id, planId || null, name, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get workout sessions
router.get('/sessions', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await query(
      `SELECT ws.*, wp.name as plan_name,
        (SELECT COUNT(*) FROM exercise_logs WHERE session_id = ws.id) as exercise_count
       FROM workout_sessions ws
       LEFT JOIN workout_plans wp ON ws.plan_id = wp.id
       WHERE ws.user_id = $1
       ORDER BY ws.started_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.id, limit, offset]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Log exercise set
router.post('/sessions/:sessionId/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { exerciseId, setNumber, reps, weight, durationSeconds, distanceMeters, notes } = req.body;
    
    // Verify session belongs to user
    const sessionCheck = await query(
      'SELECT id FROM workout_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user!.id]
    );
    
    if (sessionCheck.rows.length === 0) {
      return next(createError('Session not found', 404));
    }
    
    const result = await query(
      `INSERT INTO exercise_logs (session_id, exercise_id, set_number, reps, weight, duration_seconds, distance_meters, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [sessionId, exerciseId, setNumber, reps, weight, durationSeconds, distanceMeters, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// End workout session
router.patch('/sessions/:sessionId/end', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    
    const result = await query(
      `UPDATE workout_sessions SET ended_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [sessionId, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Session not found', 404));
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Log cardio session
router.post('/cardio', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId, durationMinutes, distanceKm, caloriesBurned, avgHeartRate, notes, sessionDate } = req.body;
    
    const result = await query(
      `INSERT INTO cardio_sessions (user_id, exercise_id, duration_minutes, distance_km, calories_burned, avg_heart_rate, notes, session_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user!.id, exerciseId, durationMinutes, distanceKm, caloriesBurned, avgHeartRate, notes, sessionDate || new Date()]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get cardio sessions
router.get('/cardio', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await query(
      `SELECT cs.*, e.name as exercise_name
       FROM cardio_sessions cs
       LEFT JOIN exercises e ON cs.exercise_id = e.id
       WHERE cs.user_id = $1
       ORDER BY cs.session_date DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.id, limit, offset]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
