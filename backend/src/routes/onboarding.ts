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
