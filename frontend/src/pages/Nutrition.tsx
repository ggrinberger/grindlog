import { useEffect, useState } from 'react';
import { nutrition as nutritionApi } from '../services/api';

interface NutritionTargets {
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_default?: boolean;
}

interface MealItem {
  id?: string;
  ingredient: string;
  amount: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number;
}

interface Meal {
  id: string;
  meal_type: string;
  logged_at: string;
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string;
  items?: MealItem[];
}

interface DailySummary {
  date: string;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealCount: number;
  };
  targets: NutritionTargets;
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const MEAL_TYPES = [
  { value: 'breakfast', label: '🌅 Breakfast', color: 'amber' },
  { value: 'pre_workout', label: '💪 Pre-Workout', color: 'orange' },
  { value: 'lunch', label: '☀️ Lunch', color: 'yellow' },
  { value: 'post_workout', label: '🔥 Post-Workout', color: 'red' },
  { value: 'snack', label: '🍎 Snack', color: 'green' },
  { value: 'dinner', label: '🌙 Dinner', color: 'indigo' },
];

export default function Nutrition() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [showTargetsForm, setShowTargetsForm] = useState(false);
  const [newMeal, setNewMeal] = useState({
    mealType: 'lunch',
    items: [{ ingredient: '', amount: '', proteinG: 0, carbsG: 0, fatG: 0, calories: 0 }] as Array<{
      ingredient: string;
      amount: string;
      proteinG: number;
      carbsG: number;
      fatG: number;
      calories: number;
    }>,
    notes: '',
  });
  const [editTargets, setEditTargets] = useState({
    dailyCalories: 3200,
    proteinG: 180,
    carbsG: 350,
    fatG: 80,
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [summaryRes, mealsRes, targetsRes] = await Promise.all([
        nutritionApi.getDailySummary(selectedDate),
        nutritionApi.getMeals(selectedDate),
        nutritionApi.getTargets(),
      ]);
      setSummary(summaryRes.data);
      setMeals(mealsRes.data);
      if (targetsRes.data) {
        setEditTargets({
          dailyCalories: targetsRes.data.daily_calories,
          proteinG: targetsRes.data.protein_g,
          carbsG: targetsRes.data.carbs_g,
          fatG: targetsRes.data.fat_g,
        });
      }
    } catch (error) {
      console.error('Failed to fetch nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMealItem = () => {
    setNewMeal({
      ...newMeal,
      items: [...newMeal.items, { ingredient: '', amount: '', proteinG: 0, carbsG: 0, fatG: 0, calories: 0 }],
    });
  };

  const removeMealItem = (index: number) => {
    const newItems = [...newMeal.items];
    newItems.splice(index, 1);
    setNewMeal({ ...newMeal, items: newItems });
  };

  const updateMealItem = (index: number, field: string, value: string | number) => {
    const newItems = [...newMeal.items];
    (newItems[index] as Record<string, string | number>)[field] = value;
    setNewMeal({ ...newMeal, items: newItems });
  };

  const submitMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await nutritionApi.logMeal({
        mealType: newMeal.mealType,
        items: newMeal.items.filter((item) => item.ingredient.trim()),
        notes: newMeal.notes,
        loggedAt: new Date().toISOString(),
      });
      setShowMealForm(false);
      setNewMeal({
        mealType: 'lunch',
        items: [{ ingredient: '', amount: '', proteinG: 0, carbsG: 0, fatG: 0, calories: 0 }],
        notes: '',
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to log meal:', error);
    }
  };

  const submitTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await nutritionApi.setTargets(editTargets);
      setShowTargetsForm(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to update targets:', error);
    }
  };

  const deleteMeal = async (mealId: string) => {
    if (!confirm('Delete this meal?')) return;
    try {
      await nutritionApi.deleteMeal(mealId);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  };

  const getProgressPercent = (consumed: number, target: number) => {
    return Math.min((consumed / target) * 100, 100);
  };

  const getProgressColor = (consumed: number, target: number) => {
    const percent = (consumed / target) * 100;
    if (percent > 110) return 'bg-red-500';
    if (percent > 90) return 'bg-emerald-500';
    if (percent > 70) return 'bg-yellow-500';
    return 'bg-slate-300';
  };

  const getMealTypeInfo = (type: string) => {
    return MEAL_TYPES.find((t) => t.value === type) || MEAL_TYPES[2];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="h-48 skeleton rounded-2xl"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nutrition</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your meals and macros</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input text-sm"
          />
          <button onClick={() => setShowMealForm(true)} className="btn-primary">
            + Log Meal
          </button>
        </div>
      </div>

      {/* Daily Summary */}
      {summary && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Daily Progress</h2>
            <button
              onClick={() => setShowTargetsForm(true)}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              Edit Targets
            </button>
          </div>

          {/* Calories */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{summary.consumed.calories}</span>
                <span className="text-slate-500 dark:text-slate-400 ml-1">/ {summary.targets.daily_calories} cal</span>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {summary.remaining.calories > 0 ? `${summary.remaining.calories} remaining` : 'Target reached!'}
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-4">
              <div
                className={`${getProgressColor(summary.consumed.calories, summary.targets.daily_calories)} rounded-full h-4 transition-all`}
                style={{ width: `${getProgressPercent(summary.consumed.calories, summary.targets.daily_calories)}%` }}
              />
            </div>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-4">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Protein</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {Math.round(summary.consumed.protein)}g / {summary.targets.protein_g}g
                </span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-blue-500 rounded-full h-2 transition-all"
                  style={{ width: `${getProgressPercent(summary.consumed.protein, summary.targets.protein_g)}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Carbs</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {Math.round(summary.consumed.carbs)}g / {summary.targets.carbs_g}g
                </span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-amber-500 rounded-full h-2 transition-all"
                  style={{ width: `${getProgressPercent(summary.consumed.carbs, summary.targets.carbs_g)}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Fat</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {Math.round(summary.consumed.fat)}g / {summary.targets.fat_g}g
                </span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-rose-500 rounded-full h-2 transition-all"
                  style={{ width: `${getProgressPercent(summary.consumed.fat, summary.targets.fat_g)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Meals */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Meals ({selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate})
        </h2>
        {meals.length === 0 ? (
          <div className="card text-center py-8 text-slate-500 dark:text-slate-400">
            <div className="text-4xl mb-2">🍽️</div>
            <div>No meals logged yet</div>
            <button onClick={() => setShowMealForm(true)} className="btn-primary mt-4">
              Log Your First Meal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => {
              const typeInfo = getMealTypeInfo(meal.meal_type);
              return (
                <div key={meal.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{typeInfo.label.split(' ')[0]}</div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{typeInfo.label}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white">{meal.total_calories} cal</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        P: {Math.round(meal.protein_g)}g • C: {Math.round(meal.carbs_g)}g • F: {Math.round(meal.fat_g)}g
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="text-red-400 hover:text-red-600 p-2 ml-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {meal.items && meal.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {meal.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex justify-between">
                          <span>
                            {item.ingredient} {item.amount && `(${item.amount})`}
                          </span>
                          <span>{item.calories} cal</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Meal Modal */}
      {showMealForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full my-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Log Meal</h3>

            <form onSubmit={submitMeal} className="space-y-4">
              <div>
                <label className="label">Meal Type</label>
                <select
                  value={newMeal.mealType}
                  onChange={(e) => setNewMeal({ ...newMeal, mealType: e.target.value })}
                  className="input"
                >
                  {MEAL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="label">Items</label>
                  <button type="button" onClick={addMealItem} className="text-sm text-emerald-600 hover:text-emerald-700">
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {newMeal.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Ingredient"
                          value={item.ingredient}
                          onChange={(e) => updateMealItem(idx, 'ingredient', e.target.value)}
                          className="input flex-1"
                        />
                        <input
                          type="text"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => updateMealItem(idx, 'amount', e.target.value)}
                          className="input w-24"
                        />
                        {newMeal.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMealItem(idx)}
                            className="text-red-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400">Protein (g)</label>
                          <input
                            type="number"
                            value={item.proteinG || ''}
                            onChange={(e) => updateMealItem(idx, 'proteinG', parseFloat(e.target.value) || 0)}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400">Carbs (g)</label>
                          <input
                            type="number"
                            value={item.carbsG || ''}
                            onChange={(e) => updateMealItem(idx, 'carbsG', parseFloat(e.target.value) || 0)}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400">Fat (g)</label>
                          <input
                            type="number"
                            value={item.fatG || ''}
                            onChange={(e) => updateMealItem(idx, 'fatG', parseFloat(e.target.value) || 0)}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400">Calories</label>
                          <input
                            type="number"
                            value={item.calories || ''}
                            onChange={(e) => updateMealItem(idx, 'calories', parseInt(e.target.value) || 0)}
                            className="input text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  value={newMeal.notes}
                  onChange={(e) => setNewMeal({ ...newMeal, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  Log Meal
                </button>
                <button type="button" onClick={() => setShowMealForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Targets Modal */}
      {showTargetsForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Edit Daily Targets</h3>

            <form onSubmit={submitTargets} className="space-y-4">
              <div>
                <label className="label">Daily Calories</label>
                <input
                  type="number"
                  value={editTargets.dailyCalories}
                  onChange={(e) => setEditTargets({ ...editTargets, dailyCalories: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Protein (g)</label>
                  <input
                    type="number"
                    value={editTargets.proteinG}
                    onChange={(e) => setEditTargets({ ...editTargets, proteinG: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Carbs (g)</label>
                  <input
                    type="number"
                    value={editTargets.carbsG}
                    onChange={(e) => setEditTargets({ ...editTargets, carbsG: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Fat (g)</label>
                  <input
                    type="number"
                    value={editTargets.fatG}
                    onChange={(e) => setEditTargets({ ...editTargets, fatG: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  Save Targets
                </button>
                <button type="button" onClick={() => setShowTargetsForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
