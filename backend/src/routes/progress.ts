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

// Log exercise progress (standalone, outside of workout sessions)
router.post('/exercise/:exerciseId/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId } = req.params;
    const { weight, sets, reps, durationSeconds, distanceMeters, intervals, notes } = req.body;
    
    const result = await query(
      `INSERT INTO exercise_progress 
        (user_id, exercise_id, weight, sets, reps, duration_seconds, distance_meters, intervals, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user!.id, exerciseId, weight, sets, reps, durationSeconds, distanceMeters, intervals, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get exercise progress history (for charts)
router.get('/exercise/:exerciseId/history', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId } = req.params;
    const { days = 90 } = req.query;
    
    // Get exercise info to determine if it's cardio
    const exerciseResult = await query(
      'SELECT name, is_cardio FROM exercises WHERE id = $1',
      [exerciseId]
    );
    
    if (exerciseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    const exercise = exerciseResult.rows[0];
    
    // Get progress entries
    const result = await query(
      `SELECT * FROM exercise_progress
       WHERE user_id = $1 AND exercise_id = $2 AND logged_at >= NOW() - INTERVAL '1 day' * $3
       ORDER BY logged_at ASC`,
      [req.user!.id, exerciseId, days]
    );
    
    res.json({
      exercise,
      history: result.rows,
      summary: exercise.is_cardio ? {
        totalDuration: result.rows.reduce((sum, r) => sum + (r.duration_seconds || 0), 0),
        totalDistance: result.rows.reduce((sum, r) => sum + parseFloat(r.distance_meters || 0), 0),
        sessions: result.rows.length,
      } : {
        maxWeight: Math.max(...result.rows.map(r => parseFloat(r.weight) || 0)),
        totalSets: result.rows.reduce((sum, r) => sum + (r.sets || 0), 0),
        sessions: result.rows.length,
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all exercises with their latest progress
router.get('/exercises/overview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT DISTINCT ON (ep.exercise_id) 
        ep.*, e.name as exercise_name, e.category, e.muscle_group, e.is_cardio,
        (SELECT COUNT(*) FROM exercise_progress WHERE exercise_id = ep.exercise_id AND user_id = $1) as total_entries
       FROM exercise_progress ep
       JOIN exercises e ON ep.exercise_id = e.id
       WHERE ep.user_id = $1
       ORDER BY ep.exercise_id, ep.logged_at DESC`,
      [req.user!.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get last weights for exercise names (for Training Plan display)
router.post('/exercises/last-weights', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseNames } = req.body;
    
    if (!exerciseNames || !Array.isArray(exerciseNames) || exerciseNames.length === 0) {
      return res.json({});
    }
    
    // Find exercises by name (case-insensitive partial match)
    const result = await query(
      `SELECT DISTINCT ON (e.name) 
        e.name as exercise_name,
        ep.weight,
        ep.sets,
        ep.reps,
        ep.logged_at
       FROM exercises e
       JOIN exercise_progress ep ON e.id = ep.exercise_id AND ep.user_id = $1
       WHERE LOWER(e.name) = ANY(SELECT LOWER(unnest($2::text[])))
       ORDER BY e.name, ep.logged_at DESC`,
      [req.user!.id, exerciseNames]
    );
    
    // Return as a map of exercise name -> last weight info
    const lastWeights: Record<string, { weight: number; sets: number; reps: number; logged_at: string }> = {};
    for (const row of result.rows) {
      lastWeights[row.exercise_name.toLowerCase()] = {
        weight: row.weight,
        sets: row.sets,
        reps: row.reps,
        logged_at: row.logged_at
      };
    }
    
    res.json(lastWeights);
  } catch (error) {
    next(error);
  }
});

// Log exercise by name (creates exercise if not exists, then logs progress)
router.post('/exercises/log-by-name', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseName, weight, sets, reps, notes, category, muscleGroup } = req.body;
    
    if (!exerciseName) {
      return res.status(400).json({ error: 'Exercise name required' });
    }
    
    // Find or create exercise
    const exerciseResult = await query(
      `SELECT id FROM exercises WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [exerciseName]
    );
    
    let exerciseId: string;
    
    if (exerciseResult.rows.length === 0) {
      // Create the exercise
      const newExercise = await query(
        `INSERT INTO exercises (name, category, muscle_group, is_public, created_by)
         VALUES ($1, $2, $3, false, $4) RETURNING id`,
        [exerciseName, category || 'Strength', muscleGroup || 'Full Body', req.user!.id]
      );
      exerciseId = newExercise.rows[0].id;
    } else {
      exerciseId = exerciseResult.rows[0].id;
    }
    
    // Log the progress
    const result = await query(
      `INSERT INTO exercise_progress 
        (user_id, exercise_id, weight, sets, reps, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user!.id, exerciseId, weight, sets, reps, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete a specific exercise progress entry
router.delete('/exercise-log/:logId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { logId } = req.params;
    
    const result = await query(
      `DELETE FROM exercise_progress WHERE id = $1 AND user_id = $2 RETURNING id`,
      [logId, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Progress entry not found' });
    }
    
    res.json({ message: 'Progress entry deleted' });
  } catch (error) {
    next(error);
  }
});

// Clear all exercise progress for a specific exercise
router.delete('/exercise/:exerciseId/clear', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseId } = req.params;
    
    const result = await query(
      `DELETE FROM exercise_progress WHERE exercise_id = $1 AND user_id = $2 RETURNING id`,
      [exerciseId, req.user!.id]
    );
    
    res.json({ message: `Deleted ${result.rowCount} progress entries` });
  } catch (error) {
    next(error);
  }
});

// Clear all exercise progress for the user
router.delete('/exercises/clear-all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `DELETE FROM exercise_progress WHERE user_id = $1 RETURNING id`,
      [req.user!.id]
    );
    
    res.json({ message: `Deleted ${result.rowCount} progress entries` });
  } catch (error) {
    next(error);
  }
});

export default router;
