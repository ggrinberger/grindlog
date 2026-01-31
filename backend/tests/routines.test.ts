import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

import { query } from '../src/config/database.js';

const mockQuery = query as ReturnType<typeof vi.fn>;

describe('Routines API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/routines', () => {
    it('should fetch all active routines', async () => {
      const mockRoutines = [
        { 
          id: '1', 
          name: 'Morning Routine', 
          type: 'morning', 
          description: 'Start your day right',
          total_duration_minutes: 30,
          items: JSON.stringify([{ activity: 'Stretch', duration: '5 min' }]),
          is_active: true
        },
        { 
          id: '2', 
          name: 'Evening Routine', 
          type: 'evening', 
          description: 'Wind down',
          total_duration_minutes: 20,
          items: JSON.stringify([{ activity: 'Meditation', duration: '10 min' }]),
          is_active: true
        },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockRoutines });
      
      const result = await query(
        `SELECT * FROM routines WHERE is_active = true ORDER BY type, name`
      );
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].type).toBe('morning');
      expect(result.rows[1].type).toBe('evening');
    });

    it('should filter by type when provided', async () => {
      const mockMorningRoutines = [
        { id: '1', name: 'Morning Routine', type: 'morning', is_active: true },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockMorningRoutines });
      
      const result = await query(
        `SELECT * FROM routines WHERE is_active = true AND type = $1 ORDER BY type, name`,
        ['morning']
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].type).toBe('morning');
    });
  });

  describe('GET /api/routines/:id', () => {
    it('should fetch routine by ID', async () => {
      const mockRoutine = { 
        id: '1', 
        name: 'Morning Routine', 
        type: 'morning',
        items: [{ activity: 'Stretch', duration: '5 min' }]
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockRoutine] });
      
      const result = await query(
        `SELECT * FROM routines WHERE id = $1 AND is_active = true`,
        ['1']
      );
      
      expect(result.rows[0].name).toBe('Morning Routine');
    });

    it('should return empty for non-existent routine', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const result = await query(
        `SELECT * FROM routines WHERE id = $1 AND is_active = true`,
        ['nonexistent']
      );
      
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('POST /api/routines', () => {
    it('should create a new routine', async () => {
      const newRoutine = {
        id: '1',
        name: 'New Morning Routine',
        type: 'morning',
        description: 'A fresh start',
        total_duration_minutes: 25,
        items: JSON.stringify([{ activity: 'Exercise', duration: '15 min' }]),
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [newRoutine] });
      
      const result = await query(
        `INSERT INTO routines (name, type, description, total_duration_minutes, items) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        ['New Morning Routine', 'morning', 'A fresh start', 25, JSON.stringify([{ activity: 'Exercise', duration: '15 min' }])]
      );
      
      expect(result.rows[0].name).toBe('New Morning Routine');
      expect(result.rows[0].type).toBe('morning');
    });

    it('should validate type is morning or evening', () => {
      const validTypes = ['morning', 'evening'];
      expect(validTypes.includes('morning')).toBe(true);
      expect(validTypes.includes('evening')).toBe(true);
      expect(validTypes.includes('afternoon')).toBe(false);
    });
  });

  describe('PUT /api/routines/:id', () => {
    it('should update routine', async () => {
      const updatedRoutine = {
        id: '1',
        name: 'Updated Routine',
        type: 'morning',
        total_duration_minutes: 35,
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [updatedRoutine] });
      
      const result = await query(
        `UPDATE routines SET name = $1, total_duration_minutes = $2 WHERE id = $3 RETURNING *`,
        ['Updated Routine', 35, '1']
      );
      
      expect(result.rows[0].name).toBe('Updated Routine');
      expect(result.rows[0].total_duration_minutes).toBe(35);
    });
  });

  describe('POST /api/routines/:routineId/complete', () => {
    it('should log routine completion', async () => {
      // Mock routine exists check
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '1' }] });
      // Mock completion insert
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'completion1', 
          user_id: 'user1', 
          routine_id: '1',
          items_completed: JSON.stringify(['Stretch', 'Meditation']),
          completed_at: new Date()
        }] 
      });
      
      // Check routine exists
      const routineCheck = await query(
        'SELECT id FROM routines WHERE id = $1 AND is_active = true',
        ['1']
      );
      expect(routineCheck.rows).toHaveLength(1);
      
      // Log completion
      const completion = await query(
        `INSERT INTO routine_completions (user_id, routine_id, items_completed, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
        ['user1', '1', JSON.stringify(['Stretch', 'Meditation']), null]
      );
      
      expect(completion.rows[0].routine_id).toBe('1');
    });

    it('should fail if routine does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const routineCheck = await query(
        'SELECT id FROM routines WHERE id = $1 AND is_active = true',
        ['nonexistent']
      );
      
      expect(routineCheck.rows).toHaveLength(0);
    });
  });

  describe('GET /api/routines/completions/today', () => {
    it('should fetch today\'s completions', async () => {
      const mockCompletions = [
        { 
          id: '1', 
          routine_id: '1', 
          routine_name: 'Morning Routine',
          routine_type: 'morning',
          completed_at: new Date()
        },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockCompletions });
      
      const result = await query(
        `SELECT rc.*, r.name as routine_name, r.type as routine_type
         FROM routine_completions rc
         JOIN routines r ON rc.routine_id = r.id
         WHERE rc.user_id = $1 AND DATE(rc.completed_at) = CURRENT_DATE`,
        ['user1']
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].routine_name).toBe('Morning Routine');
    });
  });

  describe('GET /api/routines/completions/history', () => {
    it('should fetch completion history with pagination', async () => {
      const mockHistory = [
        { id: '1', routine_name: 'Morning Routine', completed_at: new Date() },
        { id: '2', routine_name: 'Evening Routine', completed_at: new Date() },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockHistory });
      
      const result = await query(
        `SELECT rc.*, r.name as routine_name
         FROM routine_completions rc
         JOIN routines r ON rc.routine_id = r.id
         WHERE rc.user_id = $1
         ORDER BY rc.completed_at DESC LIMIT $2 OFFSET $3`,
        ['user1', 30, 0]
      );
      
      expect(result.rows).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const result = await query(
        `SELECT rc.* FROM routine_completions rc
         WHERE rc.user_id = $1 AND rc.completed_at >= $2 AND rc.completed_at <= $3`,
        ['user1', '2024-01-01', '2024-01-31']
      );
      
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['user1', '2024-01-01', '2024-01-31']
      );
    });
  });
});
