import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Get current user profile (basic)
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT id, email, username, display_name, avatar_url, role, created_at
       FROM users WHERE id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get full user profile including settings
router.get('/me/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT id, email, username, display_name, avatar_url, role, 
              height_cm, fitness_goal, experience_level, created_at
       FROM users WHERE id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    // Get latest weight
    const weightResult = await query(
      `SELECT weight FROM body_measurements WHERE user_id = $1 ORDER BY measured_at DESC LIMIT 1`,
      [req.user!.id]
    );

    res.json({
      ...result.rows[0],
      current_weight: weightResult.rows[0]?.weight || null
    });
  } catch (error) {
    next(error);
  }
});

// Update full profile including settings
router.patch('/me/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { displayName, avatarUrl, heightCm, fitnessGoal, experienceLevel, weight } = req.body;
    
    const result = await query(
      `UPDATE users SET 
        display_name = COALESCE($1, display_name), 
        avatar_url = COALESCE($2, avatar_url),
        height_cm = COALESCE($3, height_cm),
        fitness_goal = COALESCE($4, fitness_goal),
        experience_level = COALESCE($5, experience_level),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, username, display_name, avatar_url, role, height_cm, fitness_goal, experience_level`,
      [displayName, avatarUrl, heightCm, fitnessGoal, experienceLevel, req.user!.id]
    );

    // Update weight if provided
    if (weight) {
      await query(
        `INSERT INTO body_measurements (user_id, weight, notes)
         VALUES ($1, $2, 'Updated from profile settings')`,
        [req.user!.id, weight]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update profile
router.patch('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { displayName, avatarUrl } = req.body;
    
    const result = await query(
      `UPDATE users SET display_name = COALESCE($1, display_name), 
       avatar_url = COALESCE($2, avatar_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, username, display_name, avatar_url, role`,
      [displayName, avatarUrl, req.user!.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get user by username (public profile)
router.get('/:username', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, username, display_name, avatar_url, created_at
       FROM users WHERE username = $1`,
      [req.params.username]
    );

    if (result.rows.length === 0) {
      return next(createError('User not found', 404));
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
