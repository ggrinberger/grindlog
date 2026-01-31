import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Log body measurements
router.post('/measurements', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { weight, bodyFatPercentage, muscleMass, chest, waist, hips, biceps, thighs, notes } = req.body;
    
    const result = await query(
      `INSERT INTO body_measurements 
        (user_id, weight, body_fat_percentage, muscle_mass, chest, waist, hips, biceps, thighs, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user!.id, weight, bodyFatPercentage, muscleMass, chest, waist, hips, biceps, thighs, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get measurements history
router.get('/measurements', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 30 } = req.query;
    
    const result = await query(
      `SELECT * FROM body_measurements
       WHERE user_id = $1
       ORDER BY measured_at DESC
       LIMIT $2`,
      [req.user!.id, limit]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get goals
router.get('/goals', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT * FROM user_goals
       WHERE user_id = $1
       ORDER BY achieved, deadline`,
      [req.user!.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create goal
router.post('/goals', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goalType, targetValue, currentValue, unit, deadline } = req.body;
    
    const result = await query(
      `INSERT INTO user_goals (user_id, goal_type, target_value, current_value, unit, deadline)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user!.id, goalType, targetValue, currentValue, unit, deadline]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update goal
router.patch('/goals/:goalId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    const { currentValue, achieved } = req.body;
    
    const result = await query(
      `UPDATE user_goals SET
        current_value = COALESCE($1, current_value),
        achieved = COALESCE($2, achieved),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [currentValue, achieved, goalId, req.user!.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get progress overview/stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    
    // Workouts count
    const workoutsResult = await query(
      `SELECT COUNT(*) as workout_count,
        SUM(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as total_minutes
       FROM workout_sessions
       WHERE user_id = $1 AND started_at >= NOW() - INTERVAL '1 day' * $2`,
      [req.user!.id, days]
    );
    
    // Cardio stats
    const cardioResult = await query(
      `SELECT COUNT(*) as cardio_count,
        SUM(duration_minutes) as total_cardio_minutes,
        SUM(distance_km) as total_distance
       FROM cardio_sessions
       WHERE user_id = $1 AND session_date >= NOW() - INTERVAL '1 day' * $2`,
      [req.user!.id, days]
    );
    
    // Weight progress
    const weightResult = await query(
      `SELECT weight, measured_at
       FROM body_measurements
       WHERE user_id = $1 AND weight IS NOT NULL
       ORDER BY measured_at DESC
       LIMIT 2`,
      [req.user!.id]
    );
    
    // Average daily calories
    const caloriesResult = await query(
      `SELECT AVG(daily_cals) as avg_daily_calories FROM (
        SELECT DATE(logged_at), SUM(calories) as daily_cals
        FROM diet_logs
        WHERE user_id = $1 AND logged_at >= NOW() - INTERVAL '1 day' * $2
        GROUP BY DATE(logged_at)
      ) sub`,
      [req.user!.id, days]
    );
    
    res.json({
      period: `${days} days`,
      workouts: workoutsResult.rows[0],
      cardio: cardioResult.rows[0],
      weight: {
        current: weightResult.rows[0]?.weight,
        previous: weightResult.rows[1]?.weight,
        change: weightResult.rows[0] && weightResult.rows[1] 
          ? (weightResult.rows[0].weight - weightResult.rows[1].weight).toFixed(1)
          : null
      },
      nutrition: caloriesResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Get exercise progression (for a specific exercise)
router.get('/exercise/:exerciseId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId } = req.params;
    const { limit = 20 } = req.query;
    
    const result = await query(
      `SELECT el.*, ws.started_at as session_date
       FROM exercise_logs el
       JOIN workout_sessions ws ON el.session_id = ws.id
       WHERE ws.user_id = $1 AND el.exercise_id = $2
       ORDER BY ws.started_at DESC
       LIMIT $3`,
      [req.user!.id, exerciseId, limit]
    );
    
    // Calculate max weight per session for progression
    const progression = result.rows.reduce((acc: Record<string, { maxWeight: number; maxReps: number }>, log) => {
      const date = log.session_date.toISOString().split('T')[0];
      if (!acc[date] || (log.weight && log.weight > acc[date].maxWeight)) {
        acc[date] = { maxWeight: log.weight || 0, maxReps: log.reps || 0 };
      }
      return acc;
    }, {});
    
    res.json({ logs: result.rows, progression: Object.entries(progression).map(([date, data]) => ({ date, ...data })) });
  } catch (error) {
    next(error);
  }
});

export default router;
