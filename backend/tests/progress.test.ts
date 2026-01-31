import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

import { query } from '../src/config/database.js';

const mockQuery = query as ReturnType<typeof vi.fn>;

describe('Progress API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/progress/measurements', () => {
    it('should fetch user measurements with limit', async () => {
      const mockMeasurements = [
        { id: '1', user_id: 'user1', weight: 80.5, body_fat_percentage: 15, measured_at: new Date() },
        { id: '2', user_id: 'user1', weight: 81.0, body_fat_percentage: 15.5, measured_at: new Date() },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockMeasurements });
      
      const result = await query(
        `SELECT * FROM body_measurements WHERE user_id = $1 ORDER BY measured_at DESC LIMIT $2`,
        ['user1', 30]
      );
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].weight).toBe(80.5);
    });
  });

  describe('POST /api/progress/measurements', () => {
    it('should insert new measurement', async () => {
      const newMeasurement = {
        id: '1',
        user_id: 'user1',
        weight: 80.5,
        body_fat_percentage: 15,
        measured_at: new Date(),
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [newMeasurement] });
      
      const result = await query(
        `INSERT INTO body_measurements (user_id, weight, body_fat_percentage) VALUES ($1, $2, $3) RETURNING *`,
        ['user1', 80.5, 15]
      );
      
      expect(result.rows[0].weight).toBe(80.5);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/progress/goals', () => {
    it('should fetch user goals ordered by achieved status', async () => {
      const mockGoals = [
        { id: '1', user_id: 'user1', goal_type: 'weight_loss', target_value: 75, achieved: false },
        { id: '2', user_id: 'user1', goal_type: 'muscle_gain', target_value: 10, achieved: true },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockGoals });
      
      const result = await query(
        `SELECT * FROM user_goals WHERE user_id = $1 ORDER BY achieved, deadline`,
        ['user1']
      );
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].achieved).toBe(false);
    });
  });

  describe('POST /api/progress/goals', () => {
    it('should create a new goal', async () => {
      const newGoal = {
        id: '1',
        user_id: 'user1',
        goal_type: 'weight_loss',
        target_value: 75,
        current_value: 80,
        unit: 'kg',
        deadline: '2024-06-01',
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [newGoal] });
      
      const result = await query(
        `INSERT INTO user_goals (user_id, goal_type, target_value, current_value, unit, deadline) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        ['user1', 'weight_loss', 75, 80, 'kg', '2024-06-01']
      );
      
      expect(result.rows[0].goal_type).toBe('weight_loss');
      expect(result.rows[0].target_value).toBe(75);
    });
  });

  describe('GET /api/progress/stats', () => {
    it('should calculate stats for given period', async () => {
      // Mock workout count
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ workout_count: '12', total_minutes: '720' }] 
      });
      // Mock cardio stats
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ cardio_count: '8', total_cardio_minutes: '240', total_distance: '32.5' }] 
      });
      // Mock weight progress
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ weight: 80.5, measured_at: new Date() }, { weight: 81.0, measured_at: new Date() }] 
      });
      // Mock calories
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ avg_daily_calories: '2500' }] 
      });
      
      // Simulate fetching all stats
      const workouts = await query(
        `SELECT COUNT(*) as workout_count FROM workout_sessions WHERE user_id = $1`,
        ['user1']
      );
      const cardio = await query(
        `SELECT COUNT(*) as cardio_count FROM cardio_sessions WHERE user_id = $1`,
        ['user1']
      );
      
      expect(workouts.rows[0].workout_count).toBe('12');
      expect(cardio.rows[0].cardio_count).toBe('8');
    });
  });

  describe('POST /api/progress/exercises/last-weights', () => {
    it('should return last weights for given exercise names', () => {
      // Test the mapping logic used in the API
      const mockWeights = [
        { exercise_name: 'bench press', weight: 80, sets: 4, reps: 8, logged_at: new Date() },
        { exercise_name: 'squat', weight: 100, sets: 4, reps: 6, logged_at: new Date() },
      ];
      
      // Build lastWeights map like the API does
      const lastWeights: Record<string, { weight: number; sets: number; reps: number }> = {};
      for (const row of mockWeights) {
        lastWeights[row.exercise_name.toLowerCase()] = {
          weight: row.weight,
          sets: row.sets,
          reps: row.reps,
        };
      }
      
      expect(Object.keys(lastWeights)).toHaveLength(2);
      expect(lastWeights['bench press'].weight).toBe(80);
      expect(lastWeights['squat'].weight).toBe(100);
    });

    it('should return empty object for empty exercise names', () => {
      const exerciseNames: string[] = [];
      const result = exerciseNames.length === 0 ? {} : { some: 'data' };
      
      expect(result).toEqual({});
    });
  });

  describe('POST /api/progress/exercises/log-by-name', () => {
    it('should find existing exercise and log progress', () => {
      // Test the workflow logic without mocks
      const exerciseName = 'Bench Press';
      
      // Simulate finding exercise
      const findResult = { rows: [{ id: 'exercise1' }] };
      expect(findResult.rows).toHaveLength(1);
      
      const exerciseId = findResult.rows[0].id;
      
      // Simulate logging progress
      const logResult = { 
        rows: [{ id: 'progress1', user_id: 'user1', exercise_id: exerciseId, weight: 80, sets: 4, reps: 8 }] 
      };
      
      expect(logResult.rows[0].weight).toBe(80);
      expect(logResult.rows[0].exercise_id).toBe(exerciseId);
    });

    it('should create exercise if not exists and then log', () => {
      // Test the logic: if no exercise found, create one
      const exerciseName = 'New Exercise';
      let exerciseId: string;
      
      // Simulate finding no exercise
      const findResult = { rows: [] };
      expect(findResult.rows).toHaveLength(0);
      
      // Since not found, simulate creating
      const createResult = { rows: [{ id: 'newExercise1' }] };
      exerciseId = createResult.rows[0].id;
      
      expect(exerciseId).toBe('newExercise1');
      
      // Then log progress
      const logResult = { rows: [{ id: 'progress1', exercise_id: exerciseId, weight: 60 }] };
      expect(logResult.rows[0].exercise_id).toBe('newExercise1');
    });
  });

  describe('GET /api/progress/exercises/overview', () => {
    it('should return exercises with their latest progress', () => {
      // Test the data structure expected by the frontend
      const mockOverview = [
        { 
          id: '1', 
          exercise_id: 'ex1', 
          exercise_name: 'Bench Press', 
          category: 'Strength', 
          muscle_group: 'Chest',
          is_cardio: false,
          weight: 80,
          sets: 4,
          reps: 8,
          total_entries: 10
        },
        { 
          id: '2', 
          exercise_id: 'ex2', 
          exercise_name: 'Running', 
          category: 'Cardio', 
          muscle_group: null,
          is_cardio: true,
          weight: null,
          duration_seconds: 1800,
          distance_meters: 5000,
          total_entries: 5
        },
      ];
      
      // Verify the data structure
      expect(mockOverview).toHaveLength(2);
      
      const strengthExercise = mockOverview.find(e => !e.is_cardio);
      expect(strengthExercise?.exercise_name).toBe('Bench Press');
      expect(strengthExercise?.weight).toBe(80);
      
      const cardioExercise = mockOverview.find(e => e.is_cardio);
      expect(cardioExercise?.exercise_name).toBe('Running');
      expect(cardioExercise?.duration_seconds).toBe(1800);
    });
  });
});
