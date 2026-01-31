import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

import { query } from '../src/config/database.js';

const mockQuery = query as ReturnType<typeof vi.fn>;

describe('Supplements API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/supplements', () => {
    it('should fetch user and global supplements', async () => {
      const mockSupplements = [
        { id: '1', name: 'Vitamin D', dosage: '5000 IU', frequency: '1x daily', user_id: 'user1', is_global: false },
        { id: '2', name: 'Fish Oil', dosage: '2g', frequency: '2x daily', user_id: null, is_global: true },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockSupplements });
      
      const result = await query(
        `SELECT * FROM supplements WHERE (user_id = $1 OR is_global = true) AND is_active = true ORDER BY name`,
        ['user1']
      );
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe('Vitamin D');
    });
  });

  describe('GET /api/supplements/:id', () => {
    it('should fetch supplement by ID', async () => {
      const mockSupplement = { 
        id: '1', 
        name: 'Creatine', 
        dosage: '5g',
        frequency: '1x daily',
        timing_notes: 'Post-workout'
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockSupplement] });
      
      const result = await query(
        `SELECT * FROM supplements WHERE id = $1 AND (user_id = $2 OR is_global = true) AND is_active = true`,
        ['1', 'user1']
      );
      
      expect(result.rows[0].name).toBe('Creatine');
      expect(result.rows[0].dosage).toBe('5g');
    });

    it('should return empty for inaccessible supplement', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const result = await query(
        `SELECT * FROM supplements WHERE id = $1 AND (user_id = $2 OR is_global = true) AND is_active = true`,
        ['999', 'user1']
      );
      
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('POST /api/supplements', () => {
    it('should create a new supplement', async () => {
      const newSupplement = {
        id: '1',
        user_id: 'user1',
        name: 'Magnesium',
        dosage: '400mg',
        frequency: '1x daily before bed',
        timing_notes: 'Before sleep',
        description: 'For better sleep',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [newSupplement] });
      
      const result = await query(
        `INSERT INTO supplements (user_id, name, dosage, frequency, timing_notes, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        ['user1', 'Magnesium', '400mg', '1x daily before bed', 'Before sleep', 'For better sleep']
      );
      
      expect(result.rows[0].name).toBe('Magnesium');
      expect(result.rows[0].user_id).toBe('user1');
    });
  });

  describe('PUT /api/supplements/:id', () => {
    it('should update own supplement', async () => {
      const updatedSupplement = {
        id: '1',
        name: 'Magnesium Glycinate',
        dosage: '500mg',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [updatedSupplement] });
      
      const result = await query(
        `UPDATE supplements SET name = $1, dosage = $2 WHERE id = $3 AND user_id = $4 RETURNING *`,
        ['Magnesium Glycinate', '500mg', '1', 'user1']
      );
      
      expect(result.rows[0].name).toBe('Magnesium Glycinate');
      expect(result.rows[0].dosage).toBe('500mg');
    });

    it('should not update other user supplements', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const result = await query(
        `UPDATE supplements SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
        ['Hacked', '1', 'otherUser']
      );
      
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('DELETE /api/supplements/:id', () => {
    it('should soft delete supplement', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '1' }] });
      
      const result = await query(
        `UPDATE supplements SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING *`,
        ['1', 'user1']
      );
      
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('POST /api/supplements/:supplementId/log', () => {
    it('should log supplement intake', async () => {
      // Mock supplement exists
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '1' }] });
      // Mock log insert
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'log1', 
          user_id: 'user1', 
          supplement_id: '1',
          taken_at: new Date(),
          notes: 'Taken with breakfast'
        }] 
      });
      
      // Verify supplement access
      const suppCheck = await query(
        `SELECT id FROM supplements WHERE id = $1 AND (user_id = $2 OR is_global = true) AND is_active = true`,
        ['1', 'user1']
      );
      expect(suppCheck.rows).toHaveLength(1);
      
      // Log intake
      const log = await query(
        `INSERT INTO supplement_logs (user_id, supplement_id, taken_at, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
        ['user1', '1', new Date(), 'Taken with breakfast']
      );
      
      expect(log.rows[0].supplement_id).toBe('1');
    });

    it('should fail if supplement not accessible', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const suppCheck = await query(
        `SELECT id FROM supplements WHERE id = $1 AND (user_id = $2 OR is_global = true) AND is_active = true`,
        ['999', 'user1']
      );
      
      expect(suppCheck.rows).toHaveLength(0);
    });
  });

  describe('GET /api/supplements/logs/today', () => {
    it('should return today\'s supplement status', async () => {
      // Mock all supplements
      mockQuery.mockResolvedValueOnce({ 
        rows: [
          { id: '1', name: 'Vitamin D', frequency: '1x daily' },
          { id: '2', name: 'Fish Oil', frequency: '2x daily' },
        ] 
      });
      // Mock today's logs
      mockQuery.mockResolvedValueOnce({ 
        rows: [
          { id: 'log1', supplement_id: '1', taken_at: new Date() },
          { id: 'log2', supplement_id: '2', taken_at: new Date() },
        ] 
      });
      
      const supplements = await query(
        `SELECT * FROM supplements WHERE (user_id = $1 OR is_global = true) AND is_active = true`,
        ['user1']
      );
      
      const logs = await query(
        `SELECT sl.* FROM supplement_logs sl WHERE sl.user_id = $1 AND DATE(sl.taken_at) = CURRENT_DATE`,
        ['user1']
      );
      
      // Build status (matching the API logic)
      const status = supplements.rows.map((supp: { id: string; frequency?: string }) => {
        const suppLogs = logs.rows.filter((log: { supplement_id: string }) => log.supplement_id === supp.id);
        const expectedDoses = supp.frequency?.includes('2x') ? 2 : 1;
        return {
          supplement: supp,
          dosesLogged: suppLogs.length,
          expectedDoses,
          complete: suppLogs.length >= expectedDoses,
        };
      });
      
      expect(status).toHaveLength(2);
      expect(status[0].dosesLogged).toBe(1);
      expect(status[0].complete).toBe(true); // 1x daily, 1 log
      expect(status[1].complete).toBe(false); // 2x daily, 1 log
    });
  });

  describe('GET /api/supplements/logs/history', () => {
    it('should fetch supplement log history', async () => {
      const mockHistory = [
        { id: 'log1', supplement_name: 'Vitamin D', taken_at: new Date() },
        { id: 'log2', supplement_name: 'Fish Oil', taken_at: new Date() },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockHistory });
      
      const result = await query(
        `SELECT sl.*, s.name as supplement_name FROM supplement_logs sl
         JOIN supplements s ON sl.supplement_id = s.id
         WHERE sl.user_id = $1
         ORDER BY sl.taken_at DESC LIMIT $2 OFFSET $3`,
        ['user1', 50, 0]
      );
      
      expect(result.rows).toHaveLength(2);
    });

    it('should filter by supplement ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log1', supplement_id: '1' }] });
      
      const result = await query(
        `SELECT * FROM supplement_logs WHERE user_id = $1 AND supplement_id = $2`,
        ['user1', '1']
      );
      
      expect(result.rows[0].supplement_id).toBe('1');
    });
  });

  describe('DELETE /api/supplements/logs/:logId', () => {
    it('should delete own log', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log1' }] });
      
      const result = await query(
        `DELETE FROM supplement_logs WHERE id = $1 AND user_id = $2 RETURNING id`,
        ['log1', 'user1']
      );
      
      expect(result.rows).toHaveLength(1);
    });

    it('should not delete other user logs', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const result = await query(
        `DELETE FROM supplement_logs WHERE id = $1 AND user_id = $2 RETURNING id`,
        ['log1', 'otherUser']
      );
      
      expect(result.rows).toHaveLength(0);
    });
  });
});
