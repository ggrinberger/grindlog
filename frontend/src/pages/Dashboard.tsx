import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progress, diet, supplements as supplementsApi, routines as routinesApi } from '../services/api';
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

interface SupplementStatus {
  supplement: { id: string; name: string };
  todayLogs: { id: string }[];
  dosesLogged: number;
  expectedDoses: number;
  complete: boolean;
}

interface RoutineCompletion {
  id: string;
  routine_id: string;
  routine_name: string;
  routine_type: string;
  completed_at: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayDiet, setTodayDiet] = useState<DietSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Compliance data
  const [supplementStatus, setSupplementStatus] = useState<SupplementStatus[]>([]);
  const [routineCompletions, setRoutineCompletions] = useState<RoutineCompletion[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dietRes, suppRes, routineRes] = await Promise.all([
          progress.getStats(30),
          diet.getSummary(),
          supplementsApi.getTodayStatus(),
          routinesApi.getTodayStatus(),
        ]);
        setStats(statsRes.data);
        setTodayDiet(dietRes.data);
        setSupplementStatus(suppRes.data);
        setRoutineCompletions(routineRes.data);
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

  // Calculate overall compliance score
  const calculateComplianceScore = () => {
    const scores: { category: string; score: number; weight: number; icon: string }[] = [];
    
    // Workout completion (30% weight) - based on workout count in last 30 days
    const workoutCount = parseInt(stats?.workouts.workout_count || '0');
    const expectedWorkouts = 20; // Assume ~5 workouts/week = 20 in 30 days
    const workoutScore = Math.min((workoutCount / expectedWorkouts) * 100, 100);
    scores.push({ category: 'Workouts', score: workoutScore, weight: 30, icon: '🏋️' });
    
    // Supplement compliance (25% weight) - today's compliance
    const supplementsComplete = supplementStatus.filter(s => s.complete).length;
    const totalSupplements = supplementStatus.length || 1;
    const supplementScore = (supplementsComplete / totalSupplements) * 100;
    scores.push({ category: 'Supplements', score: supplementScore, weight: 25, icon: '💊' });
    
    // Routine completion (25% weight) - today's routines
    const routinesComplete = routineCompletions.length;
    const expectedRoutines = 2; // Morning and evening
    const routineScore = Math.min((routinesComplete / expectedRoutines) * 100, 100);
    scores.push({ category: 'Routines', score: routineScore, weight: 25, icon: '☀️' });
    
    // Nutrition/Diet (20% weight) - based on calories logged today
    const caloriesLogged = parseFloat(todayDiet?.total_calories || '0');
    const targetCalories = 2500; // Default target
    const nutritionScore = caloriesLogged > 0 ? Math.min((caloriesLogged / targetCalories) * 100, 100) : 0;
    scores.push({ category: 'Nutrition', score: nutritionScore, weight: 20, icon: '🥗' });
    
    // Calculate weighted average
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight;
    
    return { overall: Math.round(weightedScore), breakdown: scores };
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

  const compliance = calculateComplianceScore();

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.displayName || user?.username}!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your fitness overview for the last 30 days.</p>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <div className="card bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white border-0">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Score Ring */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="72"
                cy="72"
                r="64"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-700"
              />
              {/* Progress circle */}
              <circle
                cx="72"
                cy="72"
                r="64"
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${compliance.overall * 4.02} 402`}
                className={getScoreRingColor(compliance.overall)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getScoreColor(compliance.overall)}`}>
                {compliance.overall}
              </span>
              <span className="text-sm text-slate-400">Score</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold mb-4">Daily Compliance</h2>
            <div className="grid grid-cols-2 gap-3">
              {compliance.breakdown.map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-300">{item.category}</span>
                      <span className={`text-sm font-medium ${getScoreColor(item.score)}`}>
                        {Math.round(item.score)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getScoreBgColor(item.score)}`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon stat-icon-emerald">🏋️</div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.workouts.workout_count || 0}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Workouts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">🏃</div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {parseFloat(stats?.cardio.total_distance || '0').toFixed(1)} km
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Distance</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">⚖️</div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.weight.current ? `${stats.weight.current}` : '—'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
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
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.round(parseFloat(stats?.nutrition.avg_daily_calories || '0'))}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Avg. calories</div>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Supplements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Supplements</h2>
            <Link to="/supplements" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
              Manage →
            </Link>
          </div>
          {supplementStatus.length === 0 ? (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400">
              <span className="text-2xl mb-2 block">💊</span>
              No supplements tracked
            </div>
          ) : (
            <div className="space-y-2">
              {supplementStatus.map((status) => (
                <div
                  key={status.supplement.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    status.complete
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      status.complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      {status.complete ? '✓' : '○'}
                    </div>
                    <span className={status.complete ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                      {status.supplement.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {status.dosesLogged}/{status.expectedDoses}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Routines */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Routines</h2>
            <Link to="/routines" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
              Start →
            </Link>
          </div>
          {routineCompletions.length === 0 ? (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400">
              <span className="text-2xl mb-2 block">☀️</span>
              No routines completed today
              <Link to="/routines" className="block text-sm text-emerald-600 dark:text-emerald-400 mt-2 hover:underline">
                Start a routine
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {routineCompletions.map((completion) => (
                <div
                  key={completion.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{completion.routine_type === 'morning' ? '🌅' : '🌙'}</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{completion.routine_name}</span>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-500">
                    {new Date(completion.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's Nutrition */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Nutrition</h2>
          <Link to="/diet" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
            View details →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {Math.round(parseFloat(todayDiet?.total_calories || '0'))}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calories</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {Math.round(parseFloat(todayDiet?.total_protein || '0'))}g
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Protein</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {Math.round(parseFloat(todayDiet?.total_carbs || '0'))}g
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Carbs</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(parseFloat(todayDiet?.total_fat || '0'))}g
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fat</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/weekly-plan" className="card card-hover group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🏋️
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Start Workout</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Begin training</div>
            </div>
          </div>
        </Link>
        <Link to="/diet" className="card card-hover group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🥗
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Log Meal</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Track nutrition</div>
            </div>
          </div>
        </Link>
        <Link to="/progress" className="card card-hover group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📈
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Track Progress</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Log measurements</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
