import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progress, diet } from '../services/api';
import { useAuthStore } from '../store/authStore';

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
  const { user } = useAuthStore();
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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 skeleton rounded-2xl"></div>
          ))}
        </div>
        <div className="h-48 skeleton rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.displayName || user?.username}!</h1>
          <p className="text-slate-500 mt-1">Here's your fitness overview for the last 30 days.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon stat-icon-emerald">🏋️</div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.workouts.workout_count || 0}
            </div>
            <div className="text-sm text-slate-500">Workouts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">🏃</div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {parseFloat(stats?.cardio.total_distance || '0').toFixed(1)} km
            </div>
            <div className="text-sm text-slate-500">Distance</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">⚖️</div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.weight.current ? `${stats.weight.current}` : '—'}
            </div>
            <div className="text-sm text-slate-500">
              {stats?.weight.change && (
                <span className={parseFloat(stats.weight.change) < 0 ? 'text-emerald-500' : 'text-orange-500'}>
                  {parseFloat(stats.weight.change) > 0 ? '+' : ''}{stats.weight.change} kg
                </span>
              )}
              {!stats?.weight.change && 'Current kg'}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-orange">🔥</div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {Math.round(parseFloat(stats?.nutrition.avg_daily_calories || '0'))}
            </div>
            <div className="text-sm text-slate-500">Avg. calories</div>
          </div>
        </div>
      </div>

      {/* Today's Nutrition */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Today's Nutrition</h2>
          <Link to="/diet" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            View details →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-slate-900">
              {Math.round(parseFloat(todayDiet?.total_calories || '0'))}
            </div>
            <div className="text-sm text-slate-500 mt-1">Calories</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {Math.round(parseFloat(todayDiet?.total_protein || '0'))}g
            </div>
            <div className="text-sm text-slate-500 mt-1">Protein</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">
              {Math.round(parseFloat(todayDiet?.total_carbs || '0'))}g
            </div>
            <div className="text-sm text-slate-500 mt-1">Carbs</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(parseFloat(todayDiet?.total_fat || '0'))}g
            </div>
            <div className="text-sm text-slate-500 mt-1">Fat</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/workouts" className="card card-hover group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🏋️
            </div>
            <div>
              <div className="font-semibold text-slate-900">Start Workout</div>
              <div className="text-sm text-slate-500">Log your training</div>
            </div>
          </div>
        </Link>
        <Link to="/diet" className="card card-hover group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🥗
            </div>
            <div>
              <div className="font-semibold text-slate-900">Log Meal</div>
              <div className="text-sm text-slate-500">Track nutrition</div>
            </div>
          </div>
        </Link>
        <Link to="/progress" className="card card-hover group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📈
            </div>
            <div>
              <div className="font-semibold text-slate-900">Track Progress</div>
              <div className="text-sm text-slate-500">Log measurements</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
