import { Router, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// ============================================
// CARDIO PROTOCOLS
// ============================================

// Get all cardio protocols
router.get('/protocols', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT * FROM cardio_protocols WHERE is_active = true ORDER BY name`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get protocol by ID
router.get('/protocols/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT * FROM cardio_protocols WHERE id = $1 AND is_active = true`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Protocol not found', 404));
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create cardio protocol
router.post('/protocols', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, modality, description, totalMinutes, frequency, hrZoneTarget, instructions, scienceNotes } = req.body;
    
    const result = await query(
      `INSERT INTO cardio_protocols (name, modality, description, total_minutes, frequency, hr_zone_target, instructions, science_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, modality, description, totalMinutes, frequency, hrZoneTarget, instructions, scienceNotes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update cardio protocol
router.put('/protocols/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, modality, description, totalMinutes, frequency, hrZoneTarget, instructions, scienceNotes, isActive } = req.body;
    
    const result = await query(
      `UPDATE cardio_protocols 
       SET name = COALESCE($1, name),
           modality = COALESCE($2, modality),
           description = COALESCE($3, description),
           total_minutes = COALESCE($4, total_minutes),
           frequency = COALESCE($5, frequency),
           hr_zone_target = COALESCE($6, hr_zone_target),
           instructions = COALESCE($7, instructions),
           science_notes = COALESCE($8, science_notes),
           is_active = COALESCE($9, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [name, modality, description, totalMinutes, frequency, hrZoneTarget, instructions, scienceNotes, isActive, id]
    );
    
    if (result.rows.length === 0) {
      return next(createError('Protocol not found', 404));
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// ============================================
// CARDIO PROTOCOL LOGS
// ============================================

// Log a cardio session with protocol
router.post('/log', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { protocolId, durationMinutes, avgHeartRate, maxHeartRate, caloriesBurned, notes } = req.body;
    
    // Verify protocol exists
    const protocolCheck = await query(
      'SELECT id FROM cardio_protocols WHERE id = $1',
      [protocolId]
    );
    
    if (protocolCheck.rows.length === 0) {
      return next(createError('Protocol not found', 404));
    }
    
    const result = await query(
      `INSERT INTO cardio_protocol_logs (user_id, protocol_id, duration_minutes, avg_heart_rate, max_heart_rate, calories_burned, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user!.id, protocolId, durationMinutes, avgHeartRate, maxHeartRate, caloriesBurned, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get user's cardio logs
router.get('/logs', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = 30, offset = 0, startDate, endDate, protocolId } = req.query;
    
    let sql = `
      SELECT cpl.*, cp.name as protocol_name, cp.modality, cp.hr_zone_target
      FROM cardio_protocol_logs cpl
      JOIN cardio_protocols cp ON cpl.protocol_id = cp.id
      WHERE cpl.user_id = $1
    `;
    const params: (string | number)[] = [req.user!.id];
    let paramIndex = 2;
    
    if (startDate) {
      sql += ` AND cpl.completed_at >= $${paramIndex}`;
      params.push(startDate as string);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND cpl.completed_at <= $${paramIndex}`;
      params.push(endDate as string);
      paramIndex++;
    }
    
    if (protocolId) {
      sql += ` AND cpl.protocol_id = $${paramIndex}`;
      params.push(protocolId as string);
      paramIndex++;
    }
    
    sql += ` ORDER BY cpl.completed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get weekly cardio summary
router.get('/summary/weekly', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT 
         COUNT(*) as total_sessions,
         SUM(duration_minutes) as total_minutes,
         AVG(avg_heart_rate) as avg_heart_rate,
         SUM(calories_burned) as total_calories
       FROM cardio_protocol_logs
       WHERE user_id = $1 
         AND completed_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [req.user!.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get cardio protocols mapped by day of week
router.get('/by-day', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Static mapping based on the training program
    // Day mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    const dayMapping: Record<number, { protocolName: string; description: string }> = {
      1: { protocolName: '4x4 Protocol', description: '4 rounds of 4 min max effort + 4 min recovery' },
      2: { protocolName: 'Zone 2 Aerobic Base', description: 'Zone 2 cardio after pull workout' },
      4: { protocolName: '3 Min Hard Intervals', description: '5 rounds of 3 min hard + 2 min easy' },
      5: { protocolName: 'Tabata', description: '8 rounds of 20 sec max + 10 sec rest (optional)' },
    };
    
    // Fetch matching protocols
    const result = await query(
      `SELECT * FROM cardio_protocols WHERE is_active = true ORDER BY name`
    );
    
    const protocols = result.rows;
    const byDay: Record<number, { day: number; protocolName: string; description: string; protocol: typeof protocols[0] | null }> = {};
    
    for (const [day, info] of Object.entries(dayMapping)) {
      const dayNum = parseInt(day);
      const matchingProtocol = protocols.find((p: { name: string }) => 
        p.name.toLowerCase().includes(info.protocolName.split(' ')[0].toLowerCase()) ||
        info.protocolName.toLowerCase().includes(p.name.split(' ')[0].toLowerCase())
      );
      
      byDay[dayNum] = {
        day: dayNum,
        protocolName: info.protocolName,
        description: info.description,
        protocol: matchingProtocol || null,
      };
    }
    
    res.json(byDay);
  } catch (error) {
    next(error);
  }
});

export default router;
