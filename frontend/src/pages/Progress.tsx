import { useEffect, useState } from 'react';
import { progress, workouts } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useThemeStore } from '../store/themeStore';

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
  const [activeTab, setActiveTab] = useState<'body' | 'exercises'>('exercises');

  // Chart colors based on theme
  const chartColors = {
    primary: '#10b981',
    secondary: '#8b5cf6',
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
      const [measurementsRes, goalsRes, exercisesRes, progressRes] = await Promise.all([
        progress.getMeasurements(),
        progress.getGoals(),
        workouts.getExercises(),
        progress.getExercisesOverview(),
      ]);
      setMeasurements(measurementsRes.data);
      setGoals(goalsRes.data);
      setExercises(exercisesRes.data);
      setExerciseProgress(progressRes.data);
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

  // Format chart data for exercise history
  const getChartData = (data: HistoryEntry[], isCardio: boolean) => {
    return data.map(entry => ({
      date: new Date(entry.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: isCardio ? Math.round((entry.duration_seconds || 0) / 60) : entry.weight || 0,
      fullDate: new Date(entry.logged_at).toLocaleDateString(),
    }));
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label, isCardio }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; isCardio?: boolean }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`px-3 py-2 rounded-lg shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isCardio ? `${payload[0].value} min` : `${payload[0].value} kg`}
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        </div>
      );
    }
    return null;
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

      {activeTab === 'exercises' && (
        <>
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
                  <AreaChart data={getChartData(exerciseHistory, historyExercise.is_cardio)}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <YAxis 
                      tick={{ fill: chartColors.text, fontSize: 12 }}
                      axisLine={{ stroke: chartColors.grid }}
                      unit={historyExercise.is_cardio ? ' min' : ' kg'}
                    />
                    <Tooltip content={<CustomTooltip isCardio={historyExercise.is_cardio} />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={chartColors.primary} 
                      strokeWidth={2}
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Exercise Progress Cards */}
          {exerciseProgress.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-5xl mb-3">📈</div>
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">No exercise progress logged yet</div>
              <div className="text-slate-500 dark:text-slate-400 mt-1 mb-4">Start logging your workouts to track progress</div>
              <button onClick={() => setShowLogProgress(true)} className="btn-primary">Log First Exercise</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exerciseProgress.map((ep) => (
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
                        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{ep.weight}kg</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        {m.weight && <span className="font-medium text-slate-900 dark:text-white">{m.weight} kg</span>}
                        {m.body_fat_percentage && <span className="text-slate-500 dark:text-slate-400 ml-2">({m.body_fat_percentage}% BF)</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Goals */}
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Goals</h2>
              {goals.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No goals set yet.</p>
              ) : (
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div key={goal.id} className={`p-4 rounded-xl ${goal.achieved ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-white capitalize">{goal.goal_type.replace('_', ' ')}</span>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
