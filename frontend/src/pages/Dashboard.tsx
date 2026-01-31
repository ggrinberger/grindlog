import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progress, diet } from '../services/api';

interface Stats {
  workouts: { workout_count: string; total_minutes: string };
  cardio: { cardio_count: string; total_cardio_minutes: string; total_distance: string };
  weight: { current: number | null; previous: number | null; change: string | null };
  nutrition: { avg_daily_calories: string };
}

interface DietSummary {
  total_calories: string;
  total_protein: string;
  total_carbs: string;
  total_fat: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayDiet, setTodayDiet] = useState<DietSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dietRes] = await Promise.all([
          progress.getStats(30),
          diet.getSummary(),
        ]);
        setStats(statsRes.data);
        setTodayDiet(dietRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-500">Workouts (30 days)</div>
          <div className="text-3xl font-bold text-emerald-600">
            {stats?.workouts.workout_count || 0}
          </div>
          <div className="text-xs text-gray-400">
            {Math.round(parseFloat(stats?.workouts.total_minutes || '0'))} minutes total
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500">Cardio Sessions</div>
          <div className="text-3xl font-bold text-blue-600">
            {stats?.cardio.cardio_count || 0}
          </div>
          <div className="text-xs text-gray-400">
            {parseFloat(stats?.cardio.total_distance || '0').toFixed(1)} km total
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500">Current Weight</div>
          <div className="text-3xl font-bold text-purple-600">
            {stats?.weight.current ? `${stats.weight.current} kg` : '—'}
          </div>
          {stats?.weight.change && (
            <div className={`text-xs ${parseFloat(stats.weight.change) < 0 ? 'text-green-500' : 'text-red-500'}`}>
              {parseFloat(stats.weight.change) > 0 ? '+' : ''}{stats.weight.change} kg
            </div>
          )}
        </div>

        <div className="card">
          <div className="text-sm text-gray-500">Avg Daily Calories</div>
          <div className="text-3xl font-bold text-orange-600">
            {Math.round(parseFloat(stats?.nutrition.avg_daily_calories || '0'))}
          </div>
          <div className="text-xs text-gray-400">kcal</div>
        </div>
      </div>

      {/* Today's Nutrition */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Today's Nutrition</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(parseFloat(todayDiet?.total_calories || '0'))}
            </div>
            <div className="text-sm text-gray-500">Calories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">
              {Math.round(parseFloat(todayDiet?.total_protein || '0'))}g
            </div>
            <div className="text-sm text-gray-500">Protein</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">
              {Math.round(parseFloat(todayDiet?.total_carbs || '0'))}g
            </div>
            <div className="text-sm text-gray-500">Carbs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">
              {Math.round(parseFloat(todayDiet?.total_fat || '0'))}g
            </div>
            <div className="text-sm text-gray-500">Fat</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/workouts" className="card hover:shadow-md transition-shadow">
          <div className="text-xl">🏋️</div>
          <div className="font-semibold">Start Workout</div>
          <div className="text-sm text-gray-500">Log your training session</div>
        </Link>
        <Link to="/diet" className="card hover:shadow-md transition-shadow">
          <div className="text-xl">🍎</div>
          <div className="font-semibold">Log Meal</div>
          <div className="text-sm text-gray-500">Track your nutrition</div>
        </Link>
        <Link to="/progress" className="card hover:shadow-md transition-shadow">
          <div className="text-xl">📈</div>
          <div className="font-semibold">Track Progress</div>
          <div className="text-sm text-gray-500">Log measurements & goals</div>
        </Link>
      </div>
    </div>
  );
}
