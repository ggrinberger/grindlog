import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Dashboard stats
router.get('/stats', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [users, groups, workouts, dietLogs] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM groups'),
      query('SELECT COUNT(*) as count FROM workout_sessions'),
      query('SELECT COUNT(*) as count FROM diet_logs'),
    ]);
    
    const [newUsersToday, activeUsersWeek] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM users WHERE created_at >= CURRENT_DATE`),
      query(`SELECT COUNT(DISTINCT user_id) as count FROM workout_sessions WHERE started_at >= NOW() - INTERVAL '7 days'`),
    ]);
    
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalGroups: parseInt(groups.rows[0].count),
      totalWorkouts: parseInt(workouts.rows[0].count),
      totalDietLogs: parseInt(dietLogs.rows[0].count),
      newUsersToday: parseInt(newUsersToday.rows[0].count),
      activeUsersWeek: parseInt(activeUsersWeek.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

// User growth over time
router.get('/stats/growth', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as new_users
       FROM users
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [days]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Activity stats
router.get('/stats/activity', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    
    const [workouts, cardio, diet] = await Promise.all([
      query(
        `SELECT DATE(started_at) as date, COUNT(*) as count
         FROM workout_sessions
         WHERE started_at >= NOW() - INTERVAL '1 day' * $1
         GROUP BY DATE(started_at)
         ORDER BY date`,
        [days]
      ),
      query(
        `SELECT DATE(session_date) as date, COUNT(*) as count
         FROM cardio_sessions
         WHERE session_date >= NOW() - INTERVAL '1 day' * $1
         GROUP BY DATE(session_date)
         ORDER BY date`,
        [days]
      ),
      query(
        `SELECT DATE(logged_at) as date, COUNT(*) as count
         FROM diet_logs
         WHERE logged_at >= NOW() - INTERVAL '1 day' * $1
         GROUP BY DATE(logged_at)
         ORDER BY date`,
        [days]
      ),
    ]);
    
    res.json({
      workouts: workouts.rows,
      cardio: cardio.rows,
      dietLogs: diet.rows,
    });
  } catch (error) {
    next(error);
  }
});

// List users
router.get('/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let sql = `
      SELECT id, email, username, display_name, role, created_at,
        (SELECT COUNT(*) FROM workout_sessions WHERE user_id = users.id) as workout_count
      FROM users
    `;
    const params: unknown[] = [];
    
    if (search) {
      sql += ` WHERE username ILIKE $1 OR email ILIKE $1 OR display_name ILIKE $1`;
      params.push(`%${search}%`);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    const countResult = await query('SELECT COUNT(*) as total FROM users');
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    next(error);
  }
});

// Update user role
router.patch('/users/:userId/role', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const result = await query(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING id, email, username, role`,
      [role, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// List groups
router.get('/groups', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await query(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        u.username as created_by_username
       FROM groups g
       LEFT JOIN users u ON g.created_by = u.id
       ORDER BY g.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Popular exercises
router.get('/stats/exercises', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT e.id, e.name, e.category, COUNT(el.id) as log_count
       FROM exercises e
       LEFT JOIN exercise_logs el ON e.id = el.exercise_id
       GROUP BY e.id, e.name, e.category
       ORDER BY log_count DESC
       LIMIT 20`
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// System health
router.get('/health', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dbCheck = await query('SELECT NOW() as time');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      serverTime: dbCheck.rows[0].time,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
