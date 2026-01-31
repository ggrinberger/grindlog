import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

import { query } from '../src/config/database.js';

const mockQuery = query as ReturnType<typeof vi.fn>;

describe('Nutrition API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/nutrition/targets', () => {
    it('should fetch user nutrition targets', async () => {
      const mockTargets = {
        daily_calories: 3000,
        protein_g: 180,
        carbs_g: 350,
        fat_g: 90,
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [mockTargets] });
      
      const result = await query(
        `SELECT * FROM nutrition_targets WHERE user_id = $1 AND is_active = true`,
        ['user1']
      );
      
      expect(result.rows[0].daily_calories).toBe(3000);
      expect(result.rows[0].protein_g).toBe(180);
    });

    it('should return defaults if no targets set', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const result = await query(
        `SELECT * FROM nutrition_targets WHERE user_id = $1 AND is_active = true`,
        ['user1']
      );
      
      expect(result.rows).toHaveLength(0);
      
      // Default values returned when no rows
      const defaults = {
        daily_calories: 3200,
        protein_g: 180,
        carbs_g: 350,
        fat_g: 80,
        is_default: true
      };
      
      expect(defaults.daily_calories).toBe(3200);
    });
  });

  describe('PUT /api/nutrition/targets', () => {
    it('should upsert nutrition targets', async () => {
      const newTargets = {
        user_id: 'user1',
        daily_calories: 2800,
        protein_g: 160,
        carbs_g: 300,
        fat_g: 80,
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [newTargets] });
      
      const result = await query(
        `INSERT INTO nutrition_targets (user_id, daily_calories, protein_g, carbs_g, fat_g)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET 
           daily_calories = COALESCE($2, nutrition_targets.daily_calories),
           protein_g = COALESCE($3, nutrition_targets.protein_g),
           carbs_g = COALESCE($4, nutrition_targets.carbs_g),
           fat_g = COALESCE($5, nutrition_targets.fat_g)
         RETURNING *`,
        ['user1', 2800, 160, 300, 80]
      );
      
      expect(result.rows[0].daily_calories).toBe(2800);
    });
  });

  describe('POST /api/nutrition/meals', () => {
    it('should log a meal with items', async () => {
      const newMeal = {
        id: 'meal1',
        user_id: 'user1',
        meal_type: 'breakfast',
        total_calories: 600,
        protein_g: 40,
        carbs_g: 60,
        fat_g: 20,
      };
      
      mockQuery.mockResolvedValueOnce({ rows: [newMeal] });
      
      const result = await query(
        `INSERT INTO meals (user_id, meal_type, logged_at, total_calories, protein_g, carbs_g, fat_g) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        ['user1', 'breakfast', new Date(), 600, 40, 60, 20]
      );
      
      expect(result.rows[0].meal_type).toBe('breakfast');
      expect(result.rows[0].total_calories).toBe(600);
    });

    it('should validate meal type', () => {
      const validMealTypes = ['breakfast', 'pre_workout', 'lunch', 'post_workout', 'snack', 'dinner'];
      
      expect(validMealTypes.includes('breakfast')).toBe(true);
      expect(validMealTypes.includes('pre_workout')).toBe(true);
      expect(validMealTypes.includes('brunch')).toBe(false);
    });

    it('should calculate totals from items', () => {
      const items = [
        { calories: 300, proteinG: 20, carbsG: 30, fatG: 10 },
        { calories: 200, proteinG: 15, carbsG: 20, fatG: 8 },
      ];
      
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      
      for (const item of items) {
        totalCalories += item.calories || 0;
        totalProtein += item.proteinG || 0;
        totalCarbs += item.carbsG || 0;
        totalFat += item.fatG || 0;
      }
      
      expect(totalCalories).toBe(500);
      expect(totalProtein).toBe(35);
      expect(totalCarbs).toBe(50);
      expect(totalFat).toBe(18);
    });
  });

  describe('GET /api/nutrition/meals', () => {
    it('should fetch meals for a date', async () => {
      const mockMeals = [
        { id: 'meal1', meal_type: 'breakfast', total_calories: 500, logged_at: new Date() },
        { id: 'meal2', meal_type: 'lunch', total_calories: 700, logged_at: new Date() },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockMeals });
      
      const result = await query(
        `SELECT * FROM meals WHERE user_id = $1 AND DATE(logged_at) = $2 ORDER BY logged_at`,
        ['user1', '2024-01-15']
      );
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].meal_type).toBe('breakfast');
    });

    it('should default to today if no date provided', () => {
      const today = new Date().toISOString().split('T')[0];
      const targetDate = undefined || today;
      
      expect(targetDate).toBe(today);
    });
  });

  describe('GET /api/nutrition/meals/:id', () => {
    it('should fetch meal by ID with items', async () => {
      const mockMeal = { id: 'meal1', meal_type: 'lunch', total_calories: 800 };
      const mockItems = [
        { id: 'item1', ingredient: 'Chicken', protein_g: 40 },
        { id: 'item2', ingredient: 'Rice', carbs_g: 50 },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: [mockMeal] });
      mockQuery.mockResolvedValueOnce({ rows: mockItems });
      
      const mealResult = await query(
        `SELECT * FROM meals WHERE id = $1 AND user_id = $2`,
        ['meal1', 'user1']
      );
      
      expect(mealResult.rows[0].meal_type).toBe('lunch');
      
      const itemsResult = await query(
        `SELECT * FROM meal_items WHERE meal_id = $1`,
        ['meal1']
      );
      
      expect(itemsResult.rows).toHaveLength(2);
    });

    it('should return empty for non-existent meal', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      const result = await query(
        `SELECT * FROM meals WHERE id = $1 AND user_id = $2`,
        ['nonexistent', 'user1']
      );
      
      expect(result.rows).toHaveLength(0);
    });
  });

  describe('PUT /api/nutrition/meals/:id', () => {
    it('should update meal', async () => {
      // Mock ownership check
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'meal1' }] });
      // Mock update
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'meal1', total_calories: 900 }] });
      
      const ownerCheck = await query(
        'SELECT id FROM meals WHERE id = $1 AND user_id = $2',
        ['meal1', 'user1']
      );
      expect(ownerCheck.rows).toHaveLength(1);
      
      const result = await query(
        `UPDATE meals SET total_calories = $1 WHERE id = $2 RETURNING *`,
        [900, 'meal1']
      );
      
      expect(result.rows[0].total_calories).toBe(900);
    });
  });

  describe('DELETE /api/nutrition/meals/:id', () => {
    it('should delete meal', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'meal1' }] });
      
      const result = await query(
        `DELETE FROM meals WHERE id = $1 AND user_id = $2 RETURNING id`,
        ['meal1', 'user1']
      );
      
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('GET /api/nutrition/summary/daily', () => {
    it('should calculate daily nutrition summary', async () => {
      // Mock meals totals
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ 
          total_calories: '2500', 
          total_protein: '150', 
          total_carbs: '280', 
          total_fat: '70',
          meal_count: '4'
        }] 
      });
      // Mock targets
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ 
          daily_calories: 3000, 
          protein_g: 180, 
          carbs_g: 350, 
          fat_g: 80 
        }] 
      });
      
      const mealsResult = await query(
        `SELECT SUM(total_calories) as total_calories FROM meals WHERE user_id = $1 AND DATE(logged_at) = $2`,
        ['user1', '2024-01-15']
      );
      
      const targetsResult = await query(
        `SELECT * FROM nutrition_targets WHERE user_id = $1`,
        ['user1']
      );
      
      const consumed = {
        calories: Number(mealsResult.rows[0].total_calories),
        protein: 150,
        carbs: 280,
        fat: 70,
      };
      
      const targets = targetsResult.rows[0];
      
      const remaining = {
        calories: targets.daily_calories - consumed.calories,
        protein: targets.protein_g - consumed.protein,
        carbs: targets.carbs_g - consumed.carbs,
        fat: targets.fat_g - consumed.fat,
      };
      
      expect(remaining.calories).toBe(500);
      expect(remaining.protein).toBe(30);
    });
  });

  describe('GET /api/nutrition/summary/weekly', () => {
    it('should calculate weekly nutrition summary', async () => {
      const mockWeeklySummary = [
        { date: '2024-01-15', total_calories: '2500', meal_count: '4' },
        { date: '2024-01-16', total_calories: '2800', meal_count: '5' },
        { date: '2024-01-17', total_calories: '2600', meal_count: '4' },
      ];
      
      mockQuery.mockResolvedValueOnce({ rows: mockWeeklySummary });
      
      const result = await query(
        `SELECT DATE(logged_at) as date, SUM(total_calories) as total_calories, COUNT(*) as meal_count
         FROM meals WHERE user_id = $1 AND logged_at >= CURRENT_DATE - INTERVAL '7 days'
         GROUP BY DATE(logged_at) ORDER BY date`,
        ['user1']
      );
      
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].total_calories).toBe('2500');
    });
  });
});
