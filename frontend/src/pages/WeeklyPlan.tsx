import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { templates as templatesApi, cardio as cardioApi, progress as progressApi } from '../services/api';

interface WorkoutTemplate {
  id: string;
  day_of_week: number;
  day_name: string;
  section: string | null;
  exercise: string;
  sets_reps: string;
  intensity: string;
  rest_seconds: string;
  notes: string;
  order_index: number;
}

interface WeeklyPlan {
  weeklyPlan: Record<number, WorkoutTemplate[]>;
  dayNames: Record<number, string>;
}

interface CardioProtocol {
  id: string;
  name: string;
  modality: string;
  description: string;
  total_minutes: number;
  frequency: string;
  hr_zone_target: string;
}

interface ActiveWorkout {
  dayOfWeek: number;
  dayName: string;
  exercises: WorkoutTemplate[];
  completedExercises: Set<string>;
  startedAt: Date;
}

interface EditingExercise {
  exercise: WorkoutTemplate;
  sets: string;
  reps: string;
  weight: string;
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY = new Date().getDay();

// Cardio mapping by day
const CARDIO_BY_DAY: Record<number, { name: string; description: string }> = {
  1: { name: '4x4 Protocol', description: '4 rounds of 4 min max effort + 4 min recovery' },
  2: { name: 'Zone 2 Aerobic', description: '15-20 min easy pace after pull workout' },
  4: { name: '3 Min Intervals', description: '5 rounds of 3 min hard + 2 min easy' },
  5: { name: 'Tabata (Optional)', description: '8 rounds of 20 sec max + 10 sec rest' },
};

const DAY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Recovery': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  'Lower Power': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  'Upper Push': { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  'Pull': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  'Hypertrophy': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  'Upper Pull': { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  'Home': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
};

const getColorForDay = (dayName: string) => {
  for (const [key, colors] of Object.entries(DAY_COLORS)) {
    if (dayName.includes(key)) return colors;
  }
  return { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' };
};

// Get exercise tag based on section and position
const getExerciseTag = (section: string | null, _exercise: string): { label: string; color: string } | null => {
  if (section === 'WARM-UP') {
    return { label: 'WARM-UP', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' };
  }
  if (section === 'VO2' || section === 'CONDITIONING') {
    return { label: 'FINISHER', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' };
  }
  if (section === 'FINISHER' || section === 'THRESHOLD') {
    return { label: 'FINISHER', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' };
  }
  // Main workout exercises (no section or main section)
  if (!section) {
    return { label: 'WORKOUT', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' };
  }
  return null;
};

export default function WeeklyPlan() {
  const [weeklyPlan, setWeeklyPlan] = useState<Record<number, WorkoutTemplate[]>>({});
  const [dayNames, setDayNames] = useState<Record<number, string>>({});
  const [cardioProtocols, setCardioProtocols] = useState<CardioProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(TODAY);
  const [lastWeights, setLastWeights] = useState<Record<string, { weight: number; sets: number; reps: number; logged_at: string }>>({});
  
  // Active workout state
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [editingExercise, setEditingExercise] = useState<EditingExercise | null>(null);
  const [savingExercise, setSavingExercise] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [response, cardioRes] = await Promise.all([
        templatesApi.getWeekly(),
        cardioApi.getProtocols(),
      ]);
      const plan = response.data.weeklyPlan || {};
      setWeeklyPlan(plan);
      setDayNames(response.data.dayNames || {});
      setCardioProtocols(cardioRes.data || []);
      
      // Fetch last weights for all exercises
      const allExercises = Object.values(plan).flat() as WorkoutTemplate[];
      const allExerciseNames = allExercises
        .map(t => t.exercise)
        .filter((name, index, arr) => arr.indexOf(name) === index); // unique
      
      if (allExerciseNames.length > 0) {
        try {
          const weightsRes = await progressApi.getLastWeights(allExerciseNames);
          setLastWeights(weightsRes.data || {});
        } catch {
          // Ignore if endpoint doesn't exist yet
        }
      }
    } catch (error) {
      console.error('Failed to fetch weekly plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupBySection = (exercises: WorkoutTemplate[]) => {
    const groups: { section: string | null; exercises: WorkoutTemplate[] }[] = [];
    let currentSection: string | null = null;
    let currentGroup: WorkoutTemplate[] = [];

    for (const ex of exercises) {
      if (ex.section !== currentSection) {
        if (currentGroup.length > 0) {
          groups.push({ section: currentSection, exercises: currentGroup });
        }
        currentSection = ex.section;
        currentGroup = [ex];
      } else {
        currentGroup.push(ex);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({ section: currentSection, exercises: currentGroup });
    }
    return groups;
  };

  // Start workout for a day
  const startWorkout = (dayOfWeek: number) => {
    const exercises = weeklyPlan[dayOfWeek];
    const dayName = dayNames[dayOfWeek];
    if (!exercises || exercises.length === 0) return;
    
    setActiveWorkout({
      dayOfWeek,
      dayName,
      exercises,
      completedExercises: new Set(),
      startedAt: new Date(),
    });
  };

  // Mark exercise complete
  const markExerciseComplete = (exerciseId: string) => {
    if (!activeWorkout) return;
    const newCompleted = new Set(activeWorkout.completedExercises);
    if (newCompleted.has(exerciseId)) {
      newCompleted.delete(exerciseId);
    } else {
      newCompleted.add(exerciseId);
    }
    setActiveWorkout({ ...activeWorkout, completedExercises: newCompleted });
  };

  // Get last weight for an exercise
  const getLastWeight = (exerciseName: string): { weight: number; sets: number; reps: number } | null => {
    const key = exerciseName.toLowerCase();
    return lastWeights[key] || null;
  };

  // Open exercise editor
  const openExerciseEditor = (exercise: WorkoutTemplate) => {
    // Parse sets_reps like "4x3-5" or "3x8-10"
    const match = exercise.sets_reps?.match(/(\d+)\s*[x×]\s*(\d+)/);
    const sets = match ? match[1] : '3';
    const reps = match ? match[2] : '10';
    
    // Get last weight if available
    const last = getLastWeight(exercise.exercise);
    
    setEditingExercise({
      exercise,
      sets: last?.sets?.toString() || sets,
      reps: last?.reps?.toString() || reps,
      weight: last?.weight?.toString() || '',
    });
  };

  // Log exercise with custom values
  const logExercise = async () => {
    if (!editingExercise) return;
    
    const { exercise, sets, reps, weight } = editingExercise;
    setSavingExercise(true);
    
    try {
      // Log to backend
      await progressApi.logExerciseByName({
        exerciseName: exercise.exercise,
        weight: weight ? parseFloat(weight) : undefined,
        sets: sets ? parseInt(sets) : undefined,
        reps: reps ? parseInt(reps) : undefined,
      });
      
      // Update local lastWeights cache
      if (weight) {
        setLastWeights(prev => ({
          ...prev,
          [exercise.exercise.toLowerCase()]: {
            weight: parseFloat(weight),
            sets: parseInt(sets) || 0,
            reps: parseInt(reps) || 0,
            logged_at: new Date().toISOString(),
          }
        }));
      }
      
      // Mark complete in active workout
      if (activeWorkout) {
        markExerciseComplete(exercise.id);
      }
      setEditingExercise(null);
    } catch (error) {
      console.error('Failed to log exercise:', error);
    } finally {
      setSavingExercise(false);
    }
  };

  // End workout
  const endWorkout = () => {
    setActiveWorkout(null);
    setEditingExercise(null);
  };

  // Get cardio for a day
  const getCardioForDay = (day: number) => {
    const cardioInfo = CARDIO_BY_DAY[day];
    if (!cardioInfo) return null;
    
    // Find matching protocol
    const protocol = cardioProtocols.find(p => 
      p.name.toLowerCase().includes(cardioInfo.name.split(' ')[0].toLowerCase()) ||
      cardioInfo.name.toLowerCase().includes(p.name.split(' ')[0].toLowerCase())
    );
    
    return { ...cardioInfo, protocol };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl"></div>
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Active Workout View
  if (activeWorkout) {
    const completedCount = activeWorkout.completedExercises.size;
    const totalCount = activeWorkout.exercises.length;
    const progressPercent = (completedCount / totalCount) * 100;
    const elapsedMinutes = Math.floor((Date.now() - activeWorkout.startedAt.getTime()) / 60000);
    const groups = groupBySection(activeWorkout.exercises);
    const dayCardio = getCardioForDay(activeWorkout.dayOfWeek);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="card bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-emerald-100 text-sm font-medium">Active Workout</div>
              <div className="text-2xl font-bold">{activeWorkout.dayName}</div>
              <div className="text-emerald-100 text-sm mt-1">
                {elapsedMinutes} min • {completedCount}/{totalCount} exercises
              </div>
            </div>
            <button
              onClick={endWorkout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all"
            >
              End Workout
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Day's Cardio */}
        {dayCardio && (
          <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500">❤️</span>
                  <span className="font-semibold text-red-700 dark:text-red-400">{dayCardio.name}</span>
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">{dayCardio.description}</div>
              </div>
              <Link to="/cardio" className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium">
                View Protocol →
              </Link>
            </div>
          </div>
        )}

        {/* Exercise Checklist by Section */}
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-3">
            {group.section && (
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  group.section === 'WARM-UP' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                  group.section === 'VO2' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                  group.section === 'FINISHER' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                  group.section === 'THRESHOLD' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                  group.section === 'CONDITIONING' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {group.section}
                </div>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              </div>
            )}

            {group.exercises.map((ex, idx) => {
              const isCompleted = activeWorkout.completedExercises.has(ex.id);
              const tag = getExerciseTag(ex.section, ex.exercise);

              return (
                <div
                  key={ex.id}
                  className={`card transition-all ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => markExerciseComplete(ex.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-slate-300 dark:border-slate-600 text-slate-300 dark:text-slate-600 hover:border-emerald-500 hover:text-emerald-500'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="font-bold text-sm">{idx + 1}</span>
                      )}
                    </button>

                    {/* Exercise Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                          {ex.exercise}
                        </span>
                        {tag && !ex.section && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag.color}`}>
                            {tag.label}
                          </span>
                        )}
                      </div>
                      {ex.notes && (
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{ex.notes}</div>
                      )}
                    </div>

                    {/* Sets/Reps/Intensity + Last Weight */}
                    <div className="text-right flex-shrink-0">
                      {ex.sets_reps && ex.sets_reps !== 'N/A' && (
                        <div className="font-semibold text-slate-900 dark:text-white">{ex.sets_reps}</div>
                      )}
                      {ex.intensity && ex.intensity !== 'N/A' && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">{ex.intensity}</div>
                      )}
                      {getLastWeight(ex.exercise) && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          Last: {getLastWeight(ex.exercise)!.weight}kg
                        </div>
                      )}
                    </div>

                    {/* Edit Button */}
                    {!isCompleted && (
                      <button
                        onClick={() => openExerciseEditor(ex)}
                        className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* All done message */}
        {completedCount === totalCount && (
          <div className="card bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Workout Complete!</div>
            <div className="text-emerald-600 dark:text-emerald-500 mt-1">Great job finishing {activeWorkout.dayName}</div>
            <button onClick={endWorkout} className="btn-primary mt-4">
              Finish & Save
            </button>
          </div>
        )}

        {/* Edit Exercise Modal */}
        {editingExercise && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Log Exercise</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">{editingExercise.exercise.exercise}</p>
              
              {/* Planned values + Last weight */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Planned</div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {editingExercise.exercise.sets_reps}
                      {editingExercise.exercise.intensity && editingExercise.exercise.intensity !== 'N/A' && (
                        <span className="text-slate-500 dark:text-slate-400 ml-2">@ {editingExercise.exercise.intensity}</span>
                      )}
                    </div>
                  </div>
                  {getLastWeight(editingExercise.exercise.exercise) && (
                    <div className="text-right">
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Last Set</div>
                      <div className="font-medium text-emerald-600 dark:text-emerald-400">
                        {getLastWeight(editingExercise.exercise.exercise)!.weight}kg
                        <span className="text-slate-400 dark:text-slate-500 text-sm ml-1">
                          ({getLastWeight(editingExercise.exercise.exercise)!.sets}×{getLastWeight(editingExercise.exercise.exercise)!.reps})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom values */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="label">Sets</label>
                  <input
                    type="number"
                    value={editingExercise.sets}
                    onChange={(e) => setEditingExercise({ ...editingExercise, sets: e.target.value })}
                    className="input"
                    min={1}
                  />
                </div>
                <div>
                  <label className="label">Reps</label>
                  <input
                    type="number"
                    value={editingExercise.reps}
                    onChange={(e) => setEditingExercise({ ...editingExercise, reps: e.target.value })}
                    className="input"
                    min={1}
                  />
                </div>
                <div>
                  <label className="label">Weight (kg)</label>
                  <input
                    type="number"
                    value={editingExercise.weight}
                    onChange={(e) => setEditingExercise({ ...editingExercise, weight: e.target.value })}
                    className="input"
                    placeholder="Enter weight"
                    step="0.5"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={logExercise} className="btn-primary flex-1" disabled={savingExercise}>
                  {savingExercise ? 'Saving...' : 'Save & Complete ✓'}
                </button>
                <button onClick={() => setEditingExercise(null)} className="btn-secondary" disabled={savingExercise}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal View
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Training Plan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Your complete training program</p>
        </div>
      </div>

      {/* Week Overview */}
      <div className="grid grid-cols-7 gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const dayName = dayNames[day] || '';
          const isToday = day === TODAY;
          const colors = getColorForDay(dayName);
          const hasWorkout = weeklyPlan[day] && weeklyPlan[day].length > 0;
          const dayCardio = getCardioForDay(day);
          
          return (
            <button
              key={day}
              onClick={() => setExpandedDay(expandedDay === day ? null : day)}
              className={`p-2 rounded-xl text-center transition-all ${
                isToday ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''
              } ${
                expandedDay === day
                  ? `${colors.bg} ${colors.border} border-2`
                  : hasWorkout
                    ? 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'bg-slate-100/50 dark:bg-slate-800/30'
              }`}
            >
              <div className={`text-xs font-medium ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {DAY_SHORT[day]}
              </div>
              <div className={`text-sm font-semibold truncate ${
                expandedDay === day ? colors.text : 'text-slate-900 dark:text-white'
              }`}>
                {dayName.split(':')[0]?.replace(DAY_LABELS[day] + ': ', '') || '—'}
              </div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                {hasWorkout && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {weeklyPlan[day].filter(e => !e.section || e.section === null).length} ex
                  </span>
                )}
                {dayCardio && <span className="text-xs">❤️</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Day Details */}
      {expandedDay !== null && weeklyPlan[expandedDay] && weeklyPlan[expandedDay].length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{dayNames[expandedDay]}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {weeklyPlan[expandedDay].length} total exercises
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full ${getColorForDay(dayNames[expandedDay]).bg} ${getColorForDay(dayNames[expandedDay]).text} text-sm font-medium`}>
                {DAY_LABELS[expandedDay]}
              </div>
              <button
                onClick={() => startWorkout(expandedDay)}
                className="btn-primary"
              >
                Start Workout →
              </button>
            </div>
          </div>

          {/* Day's Cardio Protocol */}
          {getCardioForDay(expandedDay) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">❤️</span>
                    <span className="font-semibold text-red-700 dark:text-red-400">{getCardioForDay(expandedDay)!.name}</span>
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">{getCardioForDay(expandedDay)!.description}</div>
                </div>
                <Link to="/cardio" className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium">
                  Full Details →
                </Link>
              </div>
            </div>
          )}

          {/* Grouped by section */}
          <div className="space-y-6">
            {groupBySection(weeklyPlan[expandedDay]).map((group, groupIdx) => (
              <div key={groupIdx}>
                {group.section && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      group.section === 'WARM-UP' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                      group.section === 'VO2' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      group.section === 'FINISHER' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                      group.section === 'THRESHOLD' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                      group.section === 'CONDITIONING' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {group.section}
                    </div>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                )}

                <div className="space-y-2">
                  {group.exercises.map((ex, idx) => {
                    const tag = getExerciseTag(ex.section, ex.exercise);
                    
                    return (
                      <div
                        key={ex.id}
                        className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">{ex.exercise}</span>
                              {tag && !ex.section && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag.color}`}>
                                  {tag.label}
                                </span>
                              )}
                            </div>
                            {ex.notes && (
                              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-8">
                                {ex.notes}
                              </div>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0">
                            {ex.sets_reps && ex.sets_reps !== 'N/A' && (
                              <div className="font-semibold text-slate-900 dark:text-white">{ex.sets_reps}</div>
                            )}
                            {ex.intensity && ex.intensity !== 'N/A' && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">{ex.intensity}</div>
                            )}
                            {ex.rest_seconds && ex.rest_seconds !== 'N/A' && (
                              <div className="text-xs text-slate-400 dark:text-slate-500">Rest: {ex.rest_seconds}s</div>
                            )}
                            {getLastWeight(ex.exercise) && (
                              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                Last: {getLastWeight(ex.exercise)!.weight}kg
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No workout for selected day */}
      {expandedDay !== null && (!weeklyPlan[expandedDay] || weeklyPlan[expandedDay].length === 0) && (
        <div className="card text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <div className="text-slate-500 dark:text-slate-400">
            No training plan for {DAY_LABELS[expandedDay]}
          </div>
        </div>
      )}

      {/* Quick Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Week at a Glance</h3>
        <div className="space-y-2">
          {[6, 0, 1, 2, 3, 4, 5].map((day) => {
            const dayName = dayNames[day] || '';
            const exercises = weeklyPlan[day] || [];
            const mainExercises = exercises.filter(e => !e.section);
            const colors = getColorForDay(dayName);
            const dayCardio = getCardioForDay(day);
            
            return (
              <div
                key={day}
                className={`flex items-center justify-between p-3 rounded-xl ${colors.bg} ${colors.border} border cursor-pointer hover:shadow-md transition-all`}
                onClick={() => setExpandedDay(day)}
              >
                <div className="flex items-center gap-3">
                  <div className={`font-medium ${colors.text}`}>
                    {DAY_LABELS[day]}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {dayName.split(':')[1]?.trim() || dayName.split(':')[0] || '—'}
                  </div>
                  {dayCardio && (
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                      ❤️ {dayCardio.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {mainExercises.length > 0 ? `${mainExercises.length} exercises` : 'Rest'}
                  </span>
                  {exercises.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startWorkout(day);
                      }}
                      className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg font-medium transition-all"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
