import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get onboarding status
router.get('/status', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT height_cm, fitness_goal, experience_level, onboarding_completed, workouts_setup, menu_setup
       FROM users WHERE id = $1`,
      [req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Complete onboarding step 1: Basic info
router.post('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { heightCm, weight, fitnessGoal, experienceLevel } = req.body;
    
    // Update user profile
    await query(
      `UPDATE users SET 
        height_cm = $1, 
        fitness_goal = $2, 
        experience_level = $3,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [heightCm, fitnessGoal, experienceLevel, req.user!.id]
    );
    
    // Log initial weight if provided
    if (weight) {
      await query(
        `INSERT INTO body_measurements (user_id, weight, notes)
         VALUES ($1, $2, 'Initial weight from onboarding')`,
        [req.user!.id, weight]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Complete onboarding
router.post('/complete', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { workoutsSetup, menuSetup } = req.body;
    
    await query(
      `UPDATE users SET 
        onboarding_completed = true,
        workouts_setup = $1,
        menu_setup = $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [workoutsSetup || false, menuSetup || false, req.user!.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get weekly schedule
router.get('/schedule', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT ws.*, wp.name as plan_name
       FROM weekly_schedule ws
       LEFT JOIN workout_plans wp ON ws.plan_id = wp.id
       WHERE ws.user_id = $1
       ORDER BY ws.day_of_week`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Set day in weekly schedule
router.post('/schedule', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dayOfWeek, name, planId, isRestDay, notes } = req.body;
    
    const result = await query(
      `INSERT INTO weekly_schedule (user_id, day_of_week, name, plan_id, is_rest_day, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, day_of_week) 
       DO UPDATE SET name = $3, plan_id = $4, is_rest_day = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user!.id, dayOfWeek, name, planId || null, isRestDay || false, notes]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete day from schedule (make it unset)
router.delete('/schedule/:dayOfWeek', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dayOfWeek } = req.params;
    
    await query(
      'DELETE FROM weekly_schedule WHERE user_id = $1 AND day_of_week = $2',
      [req.user!.id, dayOfWeek]
    );
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get exercises for a schedule day
router.get('/schedule/:dayOfWeek/exercises', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dayOfWeek } = req.params;
    
    const result = await query(
      `SELECT sde.*, e.name as exercise_name, e.category, e.muscle_group, e.is_cardio
       FROM schedule_day_exercises sde
       JOIN exercises e ON sde.exercise_id = e.id
       JOIN weekly_schedule ws ON sde.schedule_id = ws.id
       WHERE ws.user_id = $1 AND ws.day_of_week = $2
       ORDER BY sde.order_index`,
      [req.user!.id, dayOfWeek]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get all schedule with exercises in one call
router.get('/schedule/full', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get schedule days
    const scheduleResult = await query(
      `SELECT ws.*, wp.name as plan_name
       FROM weekly_schedule ws
       LEFT JOIN workout_plans wp ON ws.plan_id = wp.id
       WHERE ws.user_id = $1
       ORDER BY ws.day_of_week`,
      [req.user!.id]
    );
    
    // Get all exercises for all days
    const exercisesResult = await query(
      `SELECT sde.*, e.name as exercise_name, e.category, e.muscle_group, e.is_cardio, ws.day_of_week
       FROM schedule_day_exercises sde
       JOIN exercises e ON sde.exercise_id = e.id
       JOIN weekly_schedule ws ON sde.schedule_id = ws.id
       WHERE ws.user_id = $1
       ORDER BY sde.order_index`,
      [req.user!.id]
    );
    
    // Map exercises to their days
    const exercisesByDay: Record<number, typeof exercisesResult.rows> = {};
    for (const ex of exercisesResult.rows) {
      if (!exercisesByDay[ex.day_of_week]) {
        exercisesByDay[ex.day_of_week] = [];
      }
      exercisesByDay[ex.day_of_week].push(ex);
    }
    
    // Attach exercises to schedule days
    const scheduleWithExercises = scheduleResult.rows.map(day => ({
      ...day,
      exercises: exercisesByDay[day.day_of_week] || []
    }));
    
    res.json(scheduleWithExercises);
  } catch (error) {
    next(error);
  }
});

// Add exercise to a schedule day
router.post('/schedule/:dayOfWeek/exercises', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dayOfWeek } = req.params;
    const { exerciseId, sets, reps, weight, durationSeconds, intervals, restSeconds, notes } = req.body;
    
    // Get or create schedule day
    let scheduleResult = await query(
      'SELECT id FROM weekly_schedule WHERE user_id = $1 AND day_of_week = $2',
      [req.user!.id, dayOfWeek]
    );
    
    let scheduleId: string;
    if (scheduleResult.rows.length === 0) {
      // Create the schedule day
      const createResult = await query(
        `INSERT INTO weekly_schedule (user_id, day_of_week, name, is_rest_day)
         VALUES ($1, $2, $3, false) RETURNING id`,
        [req.user!.id, dayOfWeek, 'Workout']
      );
      scheduleId = createResult.rows[0].id;
    } else {
      scheduleId = scheduleResult.rows[0].id;
    }
    
    // Get max order_index
    const orderResult = await query(
      'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM schedule_day_exercises WHERE schedule_id = $1',
      [scheduleId]
    );
    const nextOrder = orderResult.rows[0].next_order;
    
    // Add the exercise
    const result = await query(
      `INSERT INTO schedule_day_exercises (schedule_id, exercise_id, sets, reps, weight, duration_seconds, intervals, rest_seconds, notes, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [scheduleId, exerciseId, sets || 3, reps || 10, weight || null, durationSeconds || null, intervals || null, restSeconds || null, notes || null, nextOrder]
    );
    
    // Get exercise details
    const exerciseResult = await query(
      'SELECT name as exercise_name, category, muscle_group, is_cardio FROM exercises WHERE id = $1',
      [exerciseId]
    );
    
    res.status(201).json({
      ...result.rows[0],
      ...exerciseResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update exercise in schedule
router.patch('/schedule/exercises/:exerciseEntryId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseEntryId } = req.params;
    const { sets, reps, weight, durationSeconds, intervals, restSeconds, notes } = req.body;
    
    // Verify ownership
    const checkResult = await query(
      `SELECT sde.id FROM schedule_day_exercises sde
       JOIN weekly_schedule ws ON sde.schedule_id = ws.id
       WHERE sde.id = $1 AND ws.user_id = $2`,
      [exerciseEntryId, req.user!.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise entry not found' });
    }
    
    const result = await query(
      `UPDATE schedule_day_exercises 
       SET sets = COALESCE($1, sets), 
           reps = COALESCE($2, reps), 
           weight = COALESCE($3, weight),
           duration_seconds = COALESCE($4, duration_seconds),
           intervals = COALESCE($5, intervals),
           rest_seconds = COALESCE($6, rest_seconds),
           notes = COALESCE($7, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [sets, reps, weight, durationSeconds, intervals, restSeconds, notes, exerciseEntryId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Remove exercise from schedule
router.delete('/schedule/exercises/:exerciseEntryId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { exerciseEntryId } = req.params;
    
    // Verify ownership and delete
    const result = await query(
      `DELETE FROM schedule_day_exercises sde
       USING weekly_schedule ws
       WHERE sde.schedule_id = ws.id 
         AND sde.id = $1 
         AND ws.user_id = $2
       RETURNING sde.id`,
      [exerciseEntryId, req.user!.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise entry not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Reorder exercises in a day
router.patch('/schedule/:dayOfWeek/reorder', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dayOfWeek } = req.params;
    const { exerciseIds } = req.body; // Array of exercise entry IDs in new order
    
    // Verify ownership
    const scheduleResult = await query(
      'SELECT id FROM weekly_schedule WHERE user_id = $1 AND day_of_week = $2',
      [req.user!.id, dayOfWeek]
    );
    
    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule day not found' });
    }
    
    // Update order for each exercise
    for (let i = 0; i < exerciseIds.length; i++) {
      await query(
        'UPDATE schedule_day_exercises SET order_index = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [i, exerciseIds[i]]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Request AI recommendation
router.post('/ai-recommend', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, existingData } = req.body;
    
    // Get user profile for context
    const userResult = await query(
      `SELECT height_cm, fitness_goal, experience_level FROM users WHERE id = $1`,
      [req.user!.id]
    );
    const userProfile = userResult.rows[0];
    
    // Get latest measurements
    const measurementResult = await query(
      `SELECT weight, body_fat_percentage FROM body_measurements 
       WHERE user_id = $1 ORDER BY measured_at DESC LIMIT 1`,
      [req.user!.id]
    );
    const latestMeasurement = measurementResult.rows[0];
    
    // Store the recommendation request
    const result = await query(
      `INSERT INTO ai_recommendations (user_id, type, request_data)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user!.id, type, JSON.stringify({
        userProfile,
        latestMeasurement,
        existingData,
        requestedAt: new Date().toISOString()
      })]
    );
    
    // For now, return a placeholder - in production this would call an AI service
    res.json({
      id: result.rows[0].id,
      type,
      status: 'pending',
      message: 'AI recommendation request submitted. This feature will be enhanced with actual AI integration.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
