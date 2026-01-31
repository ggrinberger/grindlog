import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Get current user profile
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
