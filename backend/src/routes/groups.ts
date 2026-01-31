import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Get user's groups
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT g.*, gm.role as member_role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.name`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create group
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, isPrivate } = req.body;
    
    const groupResult = await query(
      `INSERT INTO groups (name, description, is_private, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, isPrivate || false, req.user!.id]
    );
    
    const group = groupResult.rows[0];
    
    // Add creator as owner
    await query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [group.id, req.user!.id]
    );
    
    // Set default sharing settings
    await query(
      `INSERT INTO sharing_settings (user_id, group_id)
       VALUES ($1, $2)`,
      [req.user!.id, group.id]
    );
    
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
});

// Get group details
router.get('/:groupId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    
    // Check if user is member
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user!.id]
    );
    
    const groupResult = await query(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g WHERE g.id = $1`,
      [groupId]
    );
    
    if (groupResult.rows.length === 0) {
      return next(createError('Group not found', 404));
    }
    
    const group = groupResult.rows[0];
    
    if (group.is_private && memberCheck.rows.length === 0) {
      return next(createError('Access denied', 403));
    }
    
    res.json({ ...group, isMember: memberCheck.rows.length > 0, memberRole: memberCheck.rows[0]?.role });
  } catch (error) {
    next(error);
  }
});

// Get group members
router.get('/:groupId/members', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    
    const result = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, gm.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.role, u.username`,
      [groupId]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Join group
router.post('/:groupId/join', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    
    // Check if group exists and is not private
    const groupCheck = await query('SELECT is_private FROM groups WHERE id = $1', [groupId]);
    
    if (groupCheck.rows.length === 0) {
      return next(createError('Group not found', 404));
    }
    
    if (groupCheck.rows[0].is_private) {
      return next(createError('This group is private', 403));
    }
    
    await query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [groupId, req.user!.id]
    );
    
    // Set default sharing settings
    await query(
      `INSERT INTO sharing_settings (user_id, group_id) VALUES ($1, $2)
       ON CONFLICT (user_id, group_id) DO NOTHING`,
      [req.user!.id, groupId]
    );
    
    res.json({ message: 'Joined group successfully' });
  } catch (error) {
    next(error);
  }
});

// Leave group
router.post('/:groupId/leave', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    
    await query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user!.id]
    );
    
    await query(
      'DELETE FROM sharing_settings WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user!.id]
    );
    
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    next(error);
  }
});

// Update sharing settings
router.patch('/:groupId/sharing', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const { shareWorkouts, shareDiet, shareProgress, sharePlans } = req.body;
    
    const result = await query(
      `UPDATE sharing_settings SET
        share_workouts = COALESCE($1, share_workouts),
        share_diet = COALESCE($2, share_diet),
        share_progress = COALESCE($3, share_progress),
        share_plans = COALESCE($4, share_plans)
       WHERE user_id = $5 AND group_id = $6
       RETURNING *`,
      [shareWorkouts, shareDiet, shareProgress, sharePlans, req.user!.id, groupId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get group feed (shared activity)
router.get('/:groupId/feed', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.params;
    const { limit = 20 } = req.query;
    
    // Get recent workouts from members who share them
    const workouts = await query(
      `SELECT 'workout' as type, ws.id, ws.name, ws.started_at as timestamp,
        u.username, u.display_name, u.avatar_url
       FROM workout_sessions ws
       JOIN users u ON ws.user_id = u.id
       JOIN sharing_settings ss ON ws.user_id = ss.user_id AND ss.group_id = $1
       WHERE ss.share_workouts = true AND ws.ended_at IS NOT NULL
       ORDER BY ws.started_at DESC
       LIMIT $2`,
      [groupId, limit]
    );
    
    res.json(workouts.rows);
  } catch (error) {
    next(error);
  }
});

// Search public groups
router.get('/search/public', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    
    const result = await query(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g
       WHERE g.is_private = false AND g.name ILIKE $1
       ORDER BY member_count DESC
       LIMIT 20`,
      [`%${q || ''}%`]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
