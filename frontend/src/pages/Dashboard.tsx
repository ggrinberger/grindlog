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
    
    // Workout completion (30% weight)
    const workoutCount = parseInt(stats?.workouts.workout_count || '0');
    const expectedWorkouts = 20;
    const workoutScore = Math.min((workoutCount / expectedWorkouts) * 100, 100);
    scores.push({ category: 'Workouts', score: workoutScore, weight: 30, icon: '🏋️' });
    
    // Supplement compliance (25% weight)
    const supplementsComplete = supplementStatus.filter(s => s.complete).length;
    const totalSupplements = supplementStatus.length || 1;
    const supplementScore = (supplementsComplete / totalSupplements) * 100;
    scores.push({ category: 'Supplements', score: supplementScore, weight: 25, icon: '💊' });
    
    // Routine completion (25% weight)
    const routinesComplete = routineCompletions.length;
    const expectedRoutines = 2;
    const routineScore = Math.min((routinesComplete / expectedRoutines) * 100, 100);
    scores.push({ category: 'Routines', score: routineScore, weight: 25, icon: '☀️' });
    
    // Nutrition (20% weight)
    const caloriesLogged = parseFloat(todayDiet?.total_calories || '0');
    const targetCalories = 2500;
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
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 skeleton-shimmer rounded-lg"></div>
          <div className="h-5 w-48 skeleton-shimmer rounded-lg"></div>
        </div>
        
        {/* Compliance card skeleton */}
        <div className="h-52 skeleton-shimmer rounded-2xl"></div>
        
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 skeleton-shimmer rounded-2xl" style={{ animationDelay: `${i * 100}ms` }}></div>
          ))}
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 skeleton-shimmer rounded-2xl"></div>
          <div className="h-48 skeleton-shimmer rounded-2xl"></div>
        </div>
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
          <p className="page-subtitle">Here's your fitness overview for the last 30 days.</p>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <div className="card bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-white border-0 overflow-hidden relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-purple-500/10 pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Score Ring */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-700/50"
              />
              {/* Progress circle */}
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${compliance.overall * 2.83} 283`}
                className={`${getScoreRingColor(compliance.overall)} transition-all duration-1000 ease-out`}
                style={{ 
                  filter: 'drop-shadow(0 0 6px currentColor)',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl sm:text-5xl font-bold ${getScoreColor(compliance.overall)} transition-all`}>
                {compliance.overall}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 font-medium">Score</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold mb-4 text-center md:text-left">Daily Compliance</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {compliance.breakdown.map((item, idx) => (
                <div 
                  key={item.category} 
                  className="flex items-center gap-3 stagger-item"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <span className="text-xl sm:text-2xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs sm:text-sm text-slate-300">{item.category}</span>
                      <span className={`text-xs sm:text-sm font-semibold ${getScoreColor(item.score)}`}>
                        {Math.round(item.score)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${getScoreBgColor(item.score)}`}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card stagger-item">
          <div className="stat-icon stat-icon-emerald">🏋️</div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {stats?.workouts.workout_count || 0}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Workouts</div>
          </div>
        </div>

        <div className="stat-card stagger-item">
          <div className="stat-icon stat-icon-blue">🏃</div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {parseFloat(stats?.cardio.total_distance || '0').toFixed(1)}<span className="text-lg font-normal text-slate-400 ml-0.5">km</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Distance</div>
          </div>
        </div>

        <div className="stat-card stagger-item">
          <div className="stat-icon stat-icon-purple">⚖️</div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {stats?.weight.current ? `${stats.weight.current}` : '—'}
              {stats?.weight.current && <span className="text-lg font-normal text-slate-400 ml-0.5">kg</span>}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {stats?.weight.change ? (
                <span className={parseFloat(stats.weight.change) < 0 ? 'text-emerald-500' : 'text-orange-500'}>
                  {parseFloat(stats.weight.change) > 0 ? '+' : ''}{stats.weight.change} kg
                </span>
              ) : (
                'Current kg'
              )}
            </div>
          </div>
        </div>

        <div className="stat-card stagger-item">
          <div className="stat-icon stat-icon-orange">🔥</div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {Math.round(parseFloat(stats?.nutrition.avg_daily_calories || '0'))}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Avg. calories</div>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Supplements */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Supplements</h2>
            <Link to="/supplements" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
              Manage →
            </Link>
          </div>
          {supplementStatus.length === 0 ? (
            <div className="empty-state py-6">
              <span className="empty-state-icon">💊</span>
              <div className="text-slate-500 dark:text-slate-400">No supplements tracked</div>
            </div>
          ) : (
            <div className="space-y-2">
              {supplementStatus.map((status, idx) => (
                <div
                  key={status.supplement.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 stagger-item ${
                    status.complete
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent'
                  }`}
                  style={{ animationDelay: `${(idx + 3) * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`check-circle ${
                      status.complete ? 'check-circle-complete' : 'check-circle-incomplete'
                    }`}>
                      {status.complete && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`font-medium ${status.complete ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {status.supplement.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                    {status.dosesLogged}/{status.expectedDoses}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Routines */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Routines</h2>
            <Link to="/routines" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
              Start →
            </Link>
          </div>
          {routineCompletions.length === 0 ? (
            <div className="empty-state py-6">
              <span className="empty-state-icon">☀️</span>
              <div className="empty-state-title">No routines completed today</div>
              <Link to="/routines" className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 hover:underline font-medium">
                Start a routine
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {routineCompletions.map((completion, idx) => (
                <div
                  key={completion.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 stagger-item"
                  style={{ animationDelay: `${(idx + 3) * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{completion.routine_type === 'morning' ? '🌅' : '🌙'}</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">{completion.routine_name}</span>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">
                    {new Date(completion.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's Nutrition */}
      <div className="card animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Nutrition</h2>
          <Link to="/diet" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
            View details →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700/50">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {Math.round(parseFloat(todayDiet?.total_calories || '0'))}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Calories</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 rounded-xl p-4 text-center border border-red-100 dark:border-red-900/30">
            <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
              {Math.round(parseFloat(todayDiet?.total_protein || '0'))}<span className="text-lg font-normal opacity-75">g</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Protein</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl p-4 text-center border border-amber-100 dark:border-amber-900/30">
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              {Math.round(parseFloat(todayDiet?.total_carbs || '0'))}<span className="text-lg font-normal opacity-75">g</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Carbs</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900/30">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(parseFloat(todayDiet?.total_fat || '0'))}<span className="text-lg font-normal opacity-75">g</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Fat</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link to="/weekly-plan" className="card card-hover group animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/20 flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              🏋️
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Start Workout</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Begin training</div>
            </div>
          </div>
        </Link>
        <Link to="/diet" className="card card-hover group animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/20 flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              🥗
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Log Meal</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Track nutrition</div>
            </div>
          </div>
        </Link>
        <Link to="/progress" className="card card-hover group animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/20 flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              📈
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Track Progress</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Log measurements</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
