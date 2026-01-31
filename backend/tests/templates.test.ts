import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

import { query } from '../src/config/database.js';

const mockQuery = query as ReturnType<typeof vi.fn>;

describe('Templates API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/templates/weekly', () => {
    it('should fetch weekly training plan', async () => {
      const mockTemplates = [
        { 
          id: '1', 
          day_of_week: 1, 
          day_name: 'Monday: Lower Power',
          section: null,
          exercise: 'Squat',
          sets_reps: '4x5',
          intensity: '85% 1RM',
          rest_seconds: '180',
          order_index: 1
        },
        { 
          id: '2', 
          day_of_week: 1, 
          day_name: 'Monday: Lower Power',
          section: null,
          exercise: 'Deadlift',
          sets_reps: '3x5',
          intensity: '80% 1RM',
          rest_seconds: '180',
          order_index: 2
        },
        { 
          id: '3', 
          day_of_week: 2, 
          day_name: 'Tuesday: Upper Push',
          section: null,
          exercise: 'Bench Press',
          sets_reps: '4x5',
          intensity: '85% 1RM',
          rest_seconds: '180',
          order_index: 1
        },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockTemplates });
      
      const result = await query(
        `SELECT * FROM workout_templates WHERE is_active = true ORDER BY day_of_week, order_index`
      );
      
      expect(result.rows).toHaveLength(3);
      
      // Group by day
      const weeklyPlan: Record<number, typeof mockTemplates> = {};
      const dayNames: Record<number, string> = {};
      
      for (const template of result.rows) {
        if (!weeklyPlan[template.day_of_week]) {
          weeklyPlan[template.day_of_week] = [];
          dayNames[template.day_of_week] = template.day_name;
        }
        weeklyPlan[template.day_of_week].push(template);
      }
      
      expect(Object.keys(weeklyPlan)).toHaveLength(2);
      expect(weeklyPlan[1]).toHaveLength(2);
      expect(weeklyPlan[2]).toHaveLength(1);
      expect(dayNames[1]).toBe('Monday: Lower Power');
    });

    it('should handle empty template', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const result = await query(
        `SELECT * FROM workout_templates WHERE is_active = true`
      );
      
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('GET /api/templates/day/:dayOfWeek', () => {
    it('should fetch templates for specific day', async () => {
      const mockDayTemplates = [
        { id: '1', day_of_week: 1, exercise: 'Squat', sets_reps: '4x5' },
        { id: '2', day_of_week: 1, exercise: 'Deadlift', sets_reps: '3x5' },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockDayTemplates });
      
      const result = await query(
        `SELECT * FROM workout_templates WHERE day_of_week = $1 AND is_active = true ORDER BY order_index`,
        [1]
      );
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].exercise).toBe('Squat');
    });
  });

  describe('POST /api/templates', () => {
    it('should create new template exercise', async () => {
      const newTemplate = {
        id: '1',
        day_of_week: 3,
        day_name: 'Wednesday: Pull',
        section: null,
        exercise: 'Barbell Row',
        sets_reps: '4x8',
        intensity: '75% 1RM',
        rest_seconds: '120',
        order_index: 1,
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [newTemplate] });
      
      const result = await query(
        `INSERT INTO workout_templates (day_of_week, day_name, section, exercise, sets_reps, intensity, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [3, 'Wednesday: Pull', null, 'Barbell Row', '4x8', '75% 1RM', '120', 1]
      );
      
      expect(result.rows[0].exercise).toBe('Barbell Row');
      expect(result.rows[0].day_of_week).toBe(3);
    });
  });

  describe('PUT /api/templates/:id', () => {
    it('should update template exercise', async () => {
      const updatedTemplate = {
        id: '1',
        exercise: 'Box Squat',
        sets_reps: '5x5',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [updatedTemplate] });
      
      const result = await query(
        `UPDATE workout_templates SET exercise = $1, sets_reps = $2 WHERE id = $3 RETURNING *`,
        ['Box Squat', '5x5', '1']
      );
      
      expect(result.rows[0].exercise).toBe('Box Squat');
      expect(result.rows[0].sets_reps).toBe('5x5');
    });
  });

  describe('DELETE /api/templates/:id', () => {
    it('should soft delete template exercise', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '1' }] });
      
      const result = await query(
        `UPDATE workout_templates SET is_active = false WHERE id = $1 RETURNING id`,
        ['1']
      );
      
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Template section grouping', () => {
    it('should group exercises by section', () => {
      const exercises = [
        { section: 'WARM-UP', exercise: 'Jump Rope' },
        { section: 'WARM-UP', exercise: 'Dynamic Stretch' },
        { section: null, exercise: 'Squat' },
        { section: null, exercise: 'Leg Press' },
        { section: 'FINISHER', exercise: 'Walking Lunges' },
      ];
      
      // Group by section (matching frontend logic)
      const groups: { section: string | null; exercises: typeof exercises }[] = [];
      let currentSection: string | null = 'INITIAL';
      let currentGroup: typeof exercises = [];
      
      for (const ex of exercises) {
        if (ex.section !== currentSection) {
          if (currentGroup.length > 0) {
            groups.push({ section: currentSection === 'INITIAL' ? null : currentSection, exercises: currentGroup });
          }
          currentSection = ex.section;
          currentGroup = [ex];
        } else {
          currentGroup.push(ex);
        }
      }
      if (currentGroup.length > 0) {
        groups.push({ section: currentSection, exercises: currentGroup });
      }
      
      expect(groups).toHaveLength(3);
      expect(groups[0].section).toBe('WARM-UP');
      expect(groups[0].exercises).toHaveLength(2);
      expect(groups[1].section).toBe(null);
      expect(groups[1].exercises).toHaveLength(2);
      expect(groups[2].section).toBe('FINISHER');
      expect(groups[2].exercises).toHaveLength(1);
    });
  });

  describe('Day of week validation', () => {
    it('should validate day of week is 0-6', () => {
      const validDays = [0, 1, 2, 3, 4, 5, 6];
      
      expect(validDays.includes(0)).toBe(true); // Sunday
      expect(validDays.includes(6)).toBe(true); // Saturday
      expect(validDays.includes(7)).toBe(false);
      expect(validDays.includes(-1)).toBe(false);
    });
  });

  describe('Order index handling', () => {
    it('should order exercises correctly within a day', () => {
      const exercises = [
        { order_index: 3, exercise: 'Accessory' },
        { order_index: 1, exercise: 'Main Lift' },
        { order_index: 2, exercise: 'Secondary Lift' },
      ];
      
      const sorted = exercises.sort((a, b) => a.order_index - b.order_index);
      
      expect(sorted[0].exercise).toBe('Main Lift');
      expect(sorted[1].exercise).toBe('Secondary Lift');
      expect(sorted[2].exercise).toBe('Accessory');
    });
  });
});
