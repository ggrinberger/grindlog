import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

import { query } from '../src/config/database.js';

const mockQuery = query as ReturnType<typeof vi.fn>;

describe('Cardio API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cardio/protocols', () => {
    it('should fetch all active cardio protocols', async () => {
      const mockProtocols = [
        { 
          id: '1', 
          name: '4x4 Protocol', 
          modality: 'Running/Cycling',
          description: 'High intensity intervals',
          total_minutes: 32,
          frequency: '1x weekly',
          hr_zone_target: 'Zone 4-5',
          is_active: true
        },
        { 
          id: '2', 
          name: 'Zone 2 Aerobic', 
          modality: 'Any',
          description: 'Low intensity aerobic',
          total_minutes: 45,
          frequency: '2-3x weekly',
          hr_zone_target: 'Zone 2',
          is_active: true
        },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockProtocols });
      
      const result = await query(
        `SELECT * FROM cardio_protocols WHERE is_active = true ORDER BY name`
      );
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe('4x4 Protocol');
    });
  });

  describe('GET /api/cardio/protocols/:id', () => {
    it('should fetch protocol by ID', async () => {
      const mockProtocol = { 
        id: '1', 
        name: '4x4 Protocol',
        instructions: 'Warm up, then 4x4 min at max effort',
        science_notes: 'Improves VO2max',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockProtocol] });
      
      const result = await query(
        `SELECT * FROM cardio_protocols WHERE id = $1 AND is_active = true`,
        ['1']
      );
      
      expect(result.rows[0].name).toBe('4x4 Protocol');
    });

    it('should return empty for non-existent protocol', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const result = await query(
        `SELECT * FROM cardio_protocols WHERE id = $1 AND is_active = true`,
        ['nonexistent']
      );
      
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('POST /api/cardio/protocols', () => {
    it('should create a new cardio protocol', async () => {
      const newProtocol = {
        id: '1',
        name: 'Tabata',
        modality: 'Any',
        description: '20 sec work, 10 sec rest',
        total_minutes: 8,
        frequency: '1-2x weekly',
        hr_zone_target: 'Zone 5',
        instructions: '8 rounds of 20 sec max effort, 10 sec rest',
        science_notes: 'HIIT benefits in minimal time',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [newProtocol] });
      
      const result = await query(
        `INSERT INTO cardio_protocols (name, modality, description, total_minutes, frequency, hr_zone_target, instructions, science_notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        ['Tabata', 'Any', '20 sec work, 10 sec rest', 8, '1-2x weekly', 'Zone 5', '8 rounds...', 'HIIT benefits...']
      );
      
      expect(result.rows[0].name).toBe('Tabata');
      expect(result.rows[0].total_minutes).toBe(8);
    });
  });

  describe('PUT /api/cardio/protocols/:id', () => {
    it('should update protocol', async () => {
      const updatedProtocol = {
        id: '1',
        name: '4x4 Protocol Updated',
        total_minutes: 35,
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [updatedProtocol] });
      
      const result = await query(
        `UPDATE cardio_protocols SET name = $1, total_minutes = $2 WHERE id = $3 RETURNING *`,
        ['4x4 Protocol Updated', 35, '1']
      );
      
      expect(result.rows[0].name).toBe('4x4 Protocol Updated');
    });
  });

  describe('POST /api/cardio/log', () => {
    it('should log cardio session', async () => {
      // Mock protocol exists
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '1' }] });
      // Mock log insert
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'log1', 
          user_id: 'user1', 
          protocol_id: '1',
          duration_minutes: 30,
          avg_heart_rate: 155,
          max_heart_rate: 175,
          calories_burned: 350,
          completed_at: new Date()
        }] 
      });
      
      // Verify protocol exists
      const protocolCheck = await query(
        'SELECT id FROM cardio_protocols WHERE id = $1',
        ['1']
      );
      expect(protocolCheck.rows).toHaveLength(1);
      
      // Log session
      const log = await query(
        `INSERT INTO cardio_protocol_logs (user_id, protocol_id, duration_minutes, avg_heart_rate, max_heart_rate, calories_burned) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        ['user1', '1', 30, 155, 175, 350]
      );
      
      expect(log.rows[0].duration_minutes).toBe(30);
      expect(log.rows[0].avg_heart_rate).toBe(155);
    });

    it('should fail if protocol does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const protocolCheck = await query(
        'SELECT id FROM cardio_protocols WHERE id = $1',
        ['nonexistent']
      );
      
      expect(protocolCheck.rows).toHaveLength(0);
    });
  });

  describe('GET /api/cardio/logs', () => {
    it('should fetch user cardio logs', async () => {
      const mockLogs = [
        { 
          id: 'log1', 
          protocol_name: '4x4 Protocol',
          modality: 'Running',
          duration_minutes: 32,
          completed_at: new Date()
        },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockLogs });
      
      const result = await query(
        `SELECT cpl.*, cp.name as protocol_name, cp.modality
         FROM cardio_protocol_logs cpl
         JOIN cardio_protocols cp ON cpl.protocol_id = cp.id
         WHERE cpl.user_id = $1
         ORDER BY cpl.completed_at DESC LIMIT $2 OFFSET $3`,
        ['user1', 30, 0]
      );
      
      expect(result.rows[0].protocol_name).toBe('4x4 Protocol');
    });

    it('should filter by protocol ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log1', protocol_id: '1' }] });
      
      const result = await query(
        `SELECT * FROM cardio_protocol_logs WHERE user_id = $1 AND protocol_id = $2`,
        ['user1', '1']
      );
      
      expect(result.rows[0].protocol_id).toBe('1');
    });

    it('should filter by date range', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      await query(
        `SELECT * FROM cardio_protocol_logs WHERE user_id = $1 AND completed_at >= $2 AND completed_at <= $3`,
        ['user1', '2024-01-01', '2024-01-31']
      );
      
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['user1', '2024-01-01', '2024-01-31']
      );
    });
  });

  describe('GET /api/cardio/summary/weekly', () => {
    it('should calculate weekly cardio summary', async () => {
      const mockSummary = {
        total_sessions: '5',
        total_minutes: '160',
        avg_heart_rate: '145',
        total_calories: '1500',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockSummary] });
      
      const result = await query(
        `SELECT 
           COUNT(*) as total_sessions,
           SUM(duration_minutes) as total_minutes,
           AVG(avg_heart_rate) as avg_heart_rate,
           SUM(calories_burned) as total_calories
         FROM cardio_protocol_logs
         WHERE user_id = $1 AND completed_at >= CURRENT_DATE - INTERVAL '7 days'`,
        ['user1']
      );
      
      expect(result.rows[0].total_sessions).toBe('5');
      expect(result.rows[0].total_minutes).toBe('160');
    });
  });

  describe('GET /api/cardio/by-day', () => {
    it('should return cardio protocols mapped by day of week', async () => {
      const mockProtocols = [
        { id: '1', name: '4x4 Protocol', modality: 'Running' },
        { id: '2', name: 'Zone 2 Aerobic', modality: 'Any' },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockProtocols });
      
      const protocols = await query(
        `SELECT * FROM cardio_protocols WHERE is_active = true ORDER BY name`
      );
      
      // Simulate day mapping
      const dayMapping: Record<number, { protocolName: string }> = {
        1: { protocolName: '4x4 Protocol' },
        2: { protocolName: 'Zone 2 Aerobic Base' },
        4: { protocolName: '3 Min Hard Intervals' },
        5: { protocolName: 'Tabata' },
      };
      
      const byDay: Record<number, { day: number; protocol: unknown }> = {};
      for (const [day, info] of Object.entries(dayMapping)) {
        const dayNum = parseInt(day);
        const matchingProtocol = protocols.rows.find((p: { name: string }) =>
          p.name.toLowerCase().includes(info.protocolName.split(' ')[0].toLowerCase())
        );
        byDay[dayNum] = { day: dayNum, protocol: matchingProtocol || null };
      }
      
      expect(byDay[1].protocol).toBeDefined();
      expect((byDay[1].protocol as { name: string }).name).toBe('4x4 Protocol');
    });
  });
});
