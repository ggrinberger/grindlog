import { useEffect, useState } from 'react';
import { progress, workouts, supplements as supplementsApi, routines as routinesApi } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useThemeStore } from '../store/themeStore';
import { formatWeight } from '../utils/format';

interface Measurement {
  id: string;
  weight: number;
  body_fat_percentage: number;
  measured_at: string;
}

interface Goal {
  id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  achieved: boolean;
  deadline: string;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_group: string;
  is_cardio: boolean;
}

interface ExerciseProgress {
  id: string;
  exercise_id: string;
  exercise_name: string;
  category: string;
  muscle_group: string;
  is_cardio: boolean;
  weight: number | null;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  logged_at: string;
  total_entries: number;
}

interface HistoryEntry {
  id: string;
  weight: number | null;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  logged_at: string;
}

interface SupplementStatus {
  supplement: { id: string; name: string };
  todayLogs: { id: string; taken_at: string }[];
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

interface SupplementLog {
  id: string;
  supplement_name: string;
  taken_at: string;
}

export default function Progress() {
  const { isDark } = useThemeStore();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({ weight: '', bodyFatPercentage: '' });
  const [showLogProgress, setShowLogProgress] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<HistoryEntry[]>([]);
  const [historyExercise, setHistoryExercise] = useState<{ name: string; is_cardio: boolean } | null>(null);
  const [newProgress, setNewProgress] = useState({
    exerciseId: '',
    weight: '',
    sets: '',
    reps: '',
    durationMinutes: '',
    distanceKm: '',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'exercises' | 'body'>('overview');
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ goalType: '', targetValue: '', unit: '', deadline: '' });

  // New tracking data
  const [supplementStatus, setSupplementStatus] = useState<SupplementStatus[]>([]);
  const [supplementHistory, setSupplementHistory] = useState<SupplementLog[]>([]);
  const [routineCompletions, setRoutineCompletions] = useState<RoutineCompletion[]>([]);

  // Chart colors based on theme
  const chartColors = {
    primary: '#10b981',
    secondary: '#8b5cf6',
    tertiary: '#f59e0b',
    grid: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#94a3b8' : '#64748b',
    background: isDark ? '#1e293b' : '#f8fafc',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [measurementsRes, goalsRes, exercisesRes, progressRes, suppStatusRes, suppHistoryRes, routineHistoryRes] = await Promise.all([
        progress.getMeasurements(),
        progress.getGoals(),
        workouts.getExercises(),
        progress.getExercisesOverview(),
        supplementsApi.getTodayStatus(),
        supplementsApi.getHistory(30),
        routinesApi.getHistory(30),
      ]);
      setMeasurements(measurementsRes.data);
      setGoals(goalsRes.data);
      setExercises(exercisesRes.data);
      setExerciseProgress(progressRes.data);
      setSupplementStatus(suppStatusRes.data);
      setSupplementHistory(suppHistoryRes.data);
      setRoutineCompletions(routineHistoryRes.data);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logMeasurement = async () => {
    try {
      await progress.logMeasurements({
        weight: parseFloat(newMeasurement.weight) || null,
        bodyFatPercentage: parseFloat(newMeasurement.bodyFatPercentage) || null,
      });
      setShowMeasurementForm(false);
      setNewMeasurement({ weight: '', bodyFatPercentage: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to log measurement:', error);
    }
  };

  const createGoal = async () => {
    if (!newGoal.goalType || !newGoal.targetValue) return;
    
    try {
      await progress.createGoal({
        goalType: newGoal.goalType,
        targetValue: parseFloat(newGoal.targetValue),
        unit: newGoal.unit || 'units',
        deadline: newGoal.deadline || undefined,
      });
      setShowCreateGoal(false);
      setNewGoal({ goalType: '', targetValue: '', unit: '', deadline: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const logExerciseProgress = async () => {
    if (!selectedExercise) return;
    
    try {
      const data = selectedExercise.is_cardio
        ? {
            durationSeconds: parseFloat(newProgress.durationMinutes) * 60 || undefined,
            distanceMeters: parseFloat(newProgress.distanceKm) * 1000 || undefined,
          }
        : {
            weight: parseFloat(newProgress.weight) || undefined,
            sets: parseInt(newProgress.sets) || undefined,
            reps: parseInt(newProgress.reps) || undefined,
          };
      
      await progress.logExerciseProgress(selectedExercise.id, data);
      setShowLogProgress(false);
      setSelectedExercise(null);
      setNewProgress({ exerciseId: '', weight: '', sets: '', reps: '', durationMinutes: '', distanceKm: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to log exercise progress:', error);
    }
  };

  const viewExerciseHistory = async (exerciseId: string) => {
    try {
      const res = await progress.getExerciseHistory(exerciseId);
      setHistoryExercise(res.data.exercise);
      setExerciseHistory(res.data.history);
    } catch (error) {
      console.error('Failed to fetch exercise history:', error);
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins} min`;
  };

  // Calculate supplement compliance for the week
  const getSupplementCompliance = () => {
    const last7Days: { date: string; count: number; expected: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = supplementHistory.filter(log => 
        log.taken_at.split('T')[0] === dateStr
      );
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayLogs.length,
        expected: supplementStatus.length || 2, // Assume 2 supplements if no data
      });
    }
    
    return last7Days;
  };

  // Calculate routine completion streak
  const getRoutineStreak = () => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayRoutines = routineCompletions.filter(r => 
        r.completed_at.split('T')[0] === dateStr
      );
      
      if (dayRoutines.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  // Calculate supplement streak
  const getSupplementStreak = () => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayLogs = supplementHistory.filter(log => 
        log.taken_at.split('T')[0] === dateStr
      );
      
      if (dayLogs.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  // Calculate workout streak
  const getWorkoutStreak = () => {
    // Based on exercise progress entries
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const uniqueDates = [...new Set(exerciseProgress.map(ep => ep.logged_at.split('T')[0]))].sort().reverse();
    
    for (let i = 0; i < uniqueDates.length && i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (uniqueDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return Math.min(streak, exerciseProgress.length > 0 ? 30 : 0);
  };

  // Format chart data for exercise history
  const getChartData = (data: HistoryEntry[], isCardio: boolean) => {
    return data.map(entry => ({
      date: new Date(entry.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: isCardio ? Math.round((entry.duration_seconds || 0) / 60) : entry.weight || 0,
      fullDate: new Date(entry.logged_at).toLocaleDateString(),
    }));
  };

  // Compute Y-axis domain for exercise chart
  const getExerciseChartDomain = (data: HistoryEntry[], isCardio: boolean): [number, number] => {
    const values = data.map(entry => 
      isCardio ? Math.round((entry.duration_seconds || 0) / 60) : entry.weight || 0
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    return [Math.floor(min - 2), Math.ceil(max + 2)];
  };

  // Format weight chart data
  const getWeightChartData = () => {
    return measurements
      .filter(m => m.weight)
      .slice(0, 30)
      .reverse()
      .map(m => ({
        date: new Date(m.measured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: m.weight,
        bodyFat: m.body_fat_percentage,
        fullDate: new Date(m.measured_at).toLocaleDateString(),
      }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton rounded-2xl"></div>)}
        </div>
        <div className="h-64 skeleton rounded-2xl"></div>
      </div>
    );
  }

  const latestWeight = measurements.find(m => m.weight)?.weight;
  const previousWeight = measurements.slice(1).find(m => m.weight)?.weight;
  const weightChange = latestWeight && previousWeight ? (latestWeight - previousWeight).toFixed(1) : null;

  const supplementCompliance = getSupplementCompliance();
  const supplementsCompleteToday = supplementStatus.filter(s => s.complete).length;
  const totalSupplements = supplementStatus.length;
  const routineStreak = getRoutineStreak();
  const supplementStreak = getSupplementStreak();
  const workoutStreak = getWorkoutStreak();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your fitness journey</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLogProgress(true)} className="btn-primary">
            + Log Exercise
          </button>
          <button onClick={() => setShowMeasurementForm(true)} className="btn-secondary">
            + Body Stats
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'exercises'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Exercise Progress
        </button>
        <button
          onClick={() => setActiveTab('body')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'body'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Body Measurements
        </button>
      </div>

      {/* Log Exercise Progress Modal */}
      {showLogProgress && (
        <div className="card border-emerald-200 dark:border-emerald-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Log Exercise Progress</h3>
          
          {!selectedExercise ? (
            <div>
              <label className="label">Select Exercise</label>
              <select
                className="input w-full"
                value=""
                onChange={(e) => {
                  const ex = exercises.find(x => x.id === e.target.value);
                  if (ex) setSelectedExercise(ex);
                }}
              >
                <option value="">Choose an exercise...</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} {ex.is_cardio ? '(Cardio)' : `(${ex.muscle_group || ex.category})`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">{selectedExercise.name}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${selectedExercise.is_cardio ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'}`}>
                    {selectedExercise.is_cardio ? 'Cardio' : 'Strength'}
                  </span>
                </div>
                <button onClick={() => setSelectedExercise(null)} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Change</button>
              </div>
              
              {selectedExercise.is_cardio ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Duration (minutes)</label>
                    <input
                      type="number"
                      value={newProgress.durationMinutes}
                      onChange={(e) => setNewProgress({ ...newProgress, durationMinutes: e.target.value })}
                      className="input"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="label">Distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newProgress.distanceKm}
                      onChange={(e) => setNewProgress({ ...newProgress, distanceKm: e.target.value })}
                      className="input"
                      placeholder="5.0"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newProgress.weight}
                      onChange={(e) => setNewProgress({ ...newProgress, weight: e.target.value })}
                      className="input"
                      placeholder="80"
                    />
                  </div>
                  <div>
                    <label className="label">Sets</label>
                    <input
                      type="number"
                      value={newProgress.sets}
                      onChange={(e) => setNewProgress({ ...newProgress, sets: e.target.value })}
                      className="input"
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <label className="label">Reps</label>
                    <input
                      type="number"
                      value={newProgress.reps}
                      onChange={(e) => setNewProgress({ ...newProgress, reps: e.target.value })}
                      className="input"
                      placeholder="8"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-4 mt-4">
            <button onClick={logExerciseProgress} className="btn-primary" disabled={!selectedExercise}>Log Progress</button>
            <button onClick={() => { setShowLogProgress(false); setSelectedExercise(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {showMeasurementForm && (
        <div className="card border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Log Body Measurement</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={newMeasurement.weight}
                onChange={(e) => setNewMeasurement({ ...newMeasurement, weight: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                value={newMeasurement.bodyFatPercentage}
                onChange={(e) => setNewMeasurement({ ...newMeasurement, bodyFatPercentage: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button onClick={logMeasurement} className="btn-primary">Log</button>
            <button onClick={() => setShowMeasurementForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Overview Tab - Streaks and Compliance */}
      {activeTab === 'overview' && (
        <>
          {/* Streak Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🏋️</span>
              </div>
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{workoutStreak}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Workout Streak</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">days in a row</div>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">💊</span>
              </div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{supplementStreak}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supplement Streak</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">days consistent</div>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">☀️</span>
              </div>
              <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">{routineStreak}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Routine Streak</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">days completed</div>
            </div>
          </div>

          {/* Today's Supplement Status */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Supplements</h3>
              <span className={`badge ${supplementsCompleteToday === totalSupplements && totalSupplements > 0 ? 'badge-emerald' : 'badge-gray'}`}>
                {supplementsCompleteToday}/{totalSupplements} complete
              </span>
            </div>
            
            {supplementStatus.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                No supplements being tracked
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        status.complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}>
                        {status.complete ? '✓' : '○'}
                      </div>
                      <span className={status.complete ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                        {status.supplement.name}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {status.dosesLogged}/{status.expectedDoses}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Supplement Compliance Chart */}
          {supplementCompliance.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Weekly Supplement Compliance</h3>
              <div className="h-48 chart-container rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplementCompliance}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg, 
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: chartColors.text }}
                    />
                    <Bar dataKey="count" fill={chartColors.secondary} radius={[4, 4, 0, 0]} name="Taken" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Routine Completions */}
          {routineCompletions.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Routine Completions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {routineCompletions.slice(0, 10).map((completion) => (
                  <div key={completion.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${completion.routine_type === 'morning' ? '🌅' : '🌙'}`}>
                        {completion.routine_type === 'morning' ? '🌅' : '🌙'}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">{completion.routine_name}</span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(completion.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Goals</h2>
              <button
                onClick={() => setShowCreateGoal(true)}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
              >
                + Add Goal
              </button>
            </div>
            
            {showCreateGoal && (
              <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
                <div>
                  <label className="label">Goal Type</label>
                  <select
                    value={newGoal.goalType}
                    onChange={(e) => setNewGoal({ ...newGoal, goalType: e.target.value })}
                    className="input"
                  >
                    <option value="">Select goal type...</option>
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="body_fat">Body Fat %</option>
                    <option value="workout_frequency">Workout Frequency</option>
                    <option value="running_distance">Running Distance</option>
                    <option value="strength">Strength Goal</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Target Value</label>
                    <input
                      type="number"
                      value={newGoal.targetValue}
                      onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                      className="input"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <input
                      type="text"
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                      className="input"
                      placeholder="kg, %, km..."
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Deadline (optional)</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={createGoal} className="btn-primary text-sm">Create Goal</button>
                  <button onClick={() => setShowCreateGoal(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}
            
            {goals.length === 0 && !showCreateGoal ? (
              <div className="text-center py-6">
                <p className="text-slate-500 dark:text-slate-400 mb-2">No goals set yet</p>
                <button
                  onClick={() => setShowCreateGoal(true)}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Create your first goal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div key={goal.id} className={`p-4 rounded-xl ${goal.achieved ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-900 dark:text-white capitalize">{goal.goal_type.replace(/_/g, ' ')}</span>
                      {goal.achieved && <span className="text-green-600 dark:text-green-400 text-sm font-medium">✓ Achieved</span>}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {goal.current_value || 0} / {goal.target_value} {goal.unit}
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100)}%` }}
                      />
                    </div>
                    {goal.deadline && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'exercises' && (
        <>
          {/* Section Header with Clear Button */}
          {exerciseProgress.filter(ep => ep.total_entries > 0).length > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Exercise Progress</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Click any exercise to view history</p>
              </div>
              <button
                onClick={async () => {
                  if (confirm('Clear ALL exercise progress data? This cannot be undone.')) {
                    try {
                      await progress.clearAllProgress();
                      setExerciseProgress([]);
                      setHistoryExercise(null);
                      setExerciseHistory([]);
                    } catch (error) {
                      console.error('Failed to clear progress:', error);
                    }
                  }
                }}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Clear All Progress
              </button>
            </div>
          )}

          {/* Exercise History Chart */}
          {historyExercise && exerciseHistory.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{historyExercise.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {exerciseHistory.length} entries • {historyExercise.is_cardio ? 'Duration over time' : 'Weight progression'}
                  </p>
                </div>
                <button 
                  onClick={() => { setHistoryExercise(null); setExerciseHistory([]); }} 
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
              
              <div className="h-64 chart-container rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData(exerciseHistory, historyExercise.is_cardio)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      axisLine={{ stroke: chartColors.grid }}
                      domain={getExerciseChartDomain(exerciseHistory, historyExercise.is_cardio)}
                      unit={historyExercise.is_cardio ? ' min' : ' kg'}
                      type="number"
                      scale="linear"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg, 
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: chartColors.text }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={chartColors.primary} 
                      strokeWidth={2}
                      dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: chartColors.primary, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Exercise Progress Cards */}
          {exerciseProgress.filter(ep => ep.total_entries > 0).length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-5xl mb-3">📈</div>
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">No exercise progress logged yet</div>
              <div className="text-slate-500 dark:text-slate-400 mt-1 mb-4">Start logging your workouts to track progress</div>
              <button onClick={() => setShowLogProgress(true)} className="btn-primary">Log First Exercise</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exerciseProgress.filter(ep => ep.total_entries > 0).map((ep) => (
                <div
                  key={ep.id}
                  className="card card-hover cursor-pointer group"
                  onClick={() => viewExerciseHistory(ep.exercise_id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{ep.exercise_name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{ep.muscle_group || ep.category}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${ep.is_cardio ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                      {ep.is_cardio ? 'Cardio' : 'Strength'}
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    {ep.is_cardio ? (
                      <>
                        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatDuration(ep.duration_seconds)}</span>
                        {ep.distance_meters && (
                          <span className="text-slate-500 dark:text-slate-400">• {(ep.distance_meters / 1000).toFixed(1)}km</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatWeight(ep.weight)}kg</span>
                        <span className="text-slate-500 dark:text-slate-400">• {ep.sets}×{ep.reps}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>{ep.total_entries} entries</span>
                    <span>{new Date(ep.logged_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'body' && (
        <>
          {/* Current Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Weight</div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {latestWeight ? `${latestWeight}` : '—'}
                <span className="text-lg font-normal text-slate-400 ml-1">kg</span>
              </div>
              {weightChange && (
                <div className={`text-sm mt-1 ${parseFloat(weightChange) < 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg from last
                </div>
              )}
            </div>
            <div className="card text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Body Fat</div>
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                {measurements[0]?.body_fat_percentage ? `${measurements[0].body_fat_percentage}` : '—'}
                <span className="text-lg font-normal text-slate-400 ml-1">%</span>
              </div>
            </div>
            <div className="card text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Goals</div>
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                {goals.filter(g => !g.achieved).length}
              </div>
            </div>
          </div>

          {/* Weight Chart */}
          {measurements.filter(m => m.weight).length > 1 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Weight History</h2>
              <div className="h-64 chart-container rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getWeightChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      axisLine={{ stroke: chartColors.grid }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      unit=" kg"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: chartColors.tooltipBg, 
                        border: `1px solid ${chartColors.grid}`,
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: chartColors.text }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke={chartColors.secondary} 
                      strokeWidth={2}
                      dot={{ fill: chartColors.secondary, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: chartColors.secondary, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Measurement History */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Measurements</h2>
            {measurements.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No measurements yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {measurements.slice(0, 10).map((m) => (
                  <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(m.measured_at).toLocaleDateString()}
                    </span>
                    <div className="text-right">
                      {m.weight && <span className="font-medium text-slate-900 dark:text-white">{formatWeight(m.weight)} kg</span>}
                      {m.body_fat_percentage && <span className="text-slate-500 dark:text-slate-400 ml-2">({m.body_fat_percentage}% BF)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
