import { useEffect, useState } from 'react';
import { diet } from '../services/api';

interface DietLog {
  id: string;
  food_name: string;
  custom_name: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

interface DietSummary {
  meals_logged: string;
  total_calories: string;
  total_protein: string;
  total_carbs: string;
  total_fat: string;
}

export default function Diet() {
  const [logs, setLogs] = useState<DietLog[]>([]);
  const [summary, setSummary] = useState<DietSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [newLog, setNewLog] = useState({
    customName: '',
    mealType: 'lunch',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [logsRes, summaryRes] = await Promise.all([
        diet.getLogs(today, today),
        diet.getSummary(),
      ]);
      setLogs(logsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch diet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logMeal = async () => {
    try {
      await diet.logFood({
        customName: newLog.customName,
        mealType: newLog.mealType,
        calories: parseInt(newLog.calories) || 0,
        protein: parseFloat(newLog.protein) || 0,
        carbs: parseFloat(newLog.carbs) || 0,
        fat: parseFloat(newLog.fat) || 0,
      });
      setShowLogForm(false);
      setNewLog({ customName: '', mealType: 'lunch', calories: '', protein: '', carbs: '', fat: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to log meal:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Diet Tracking</h1>
        <button onClick={() => setShowLogForm(true)} className="btn-primary">
          + Log Meal
        </button>
      </div>

      {/* Today's Summary */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {Math.round(parseFloat(summary?.total_calories || '0'))}
            </div>
            <div className="text-sm text-gray-500">Calories</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-500">
              {Math.round(parseFloat(summary?.total_protein || '0'))}g
            </div>
            <div className="text-sm text-gray-500">Protein</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-500">
              {Math.round(parseFloat(summary?.total_carbs || '0'))}g
            </div>
            <div className="text-sm text-gray-500">Carbs</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-500">
              {Math.round(parseFloat(summary?.total_fat || '0'))}g
            </div>
            <div className="text-sm text-gray-500">Fat</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-500">
              {summary?.meals_logged || 0}
            </div>
            <div className="text-sm text-gray-500">Meals</div>
          </div>
        </div>
      </div>

      {showLogForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Log Meal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Food Name</label>
              <input
                type="text"
                value={newLog.customName}
                onChange={(e) => setNewLog({ ...newLog, customName: e.target.value })}
                className="input"
                placeholder="What did you eat?"
              />
            </div>
            <div>
              <label className="label">Meal Type</label>
              <select
                value={newLog.mealType}
                onChange={(e) => setNewLog({ ...newLog, mealType: e.target.value })}
                className="input"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="label">Calories</label>
              <input
                type="number"
                value={newLog.calories}
                onChange={(e) => setNewLog({ ...newLog, calories: e.target.value })}
                className="input"
                placeholder="kcal"
              />
            </div>
            <div>
              <label className="label">Protein (g)</label>
              <input
                type="number"
                value={newLog.protein}
                onChange={(e) => setNewLog({ ...newLog, protein: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Carbs (g)</label>
              <input
                type="number"
                value={newLog.carbs}
                onChange={(e) => setNewLog({ ...newLog, carbs: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Fat (g)</label>
              <input
                type="number"
                value={newLog.fat}
                onChange={(e) => setNewLog({ ...newLog, fat: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button onClick={logMeal} className="btn-primary">Log Meal</button>
            <button onClick={() => setShowLogForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Today's Logs */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Today's Meals</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500">No meals logged today.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{log.food_name || log.custom_name}</div>
                  <div className="text-sm text-gray-500 capitalize">{log.meal_type}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{log.calories} kcal</div>
                  <div className="text-gray-500">P: {log.protein}g | C: {log.carbs}g | F: {log.fat}g</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
