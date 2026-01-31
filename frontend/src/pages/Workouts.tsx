import { useEffect, useState, useRef } from 'react';
import { workouts, onboarding, progress } from '../services/api';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_group: string;
  is_cardio: boolean;
}

interface ScheduleExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  category: string;
  muscle_group: string;
  is_cardio: boolean;
  sets: number;
  reps: number;
  weight: number | null;
  duration_seconds: number | null;
  intervals: number | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
}

interface ScheduleDay {
  id: string;
  day_of_week: number;
  name: string;
  plan_id: string | null;
  plan_name: string | null;
  is_rest_day: boolean;
  exercises: ScheduleExercise[];
}

interface Session {
  id: string;
  name: string;
  plan_name: string;
  started_at: string;
  ended_at: string | null;
  exercise_count: string;
}

interface ActiveWorkout {
  dayOfWeek: number;
  dayName: string;
  exercises: ScheduleExercise[];
  completedExercises: Set<string>;
  startedAt: Date;
}

interface LoggingExercise {
  exercise: ScheduleExercise;
  usePlanned: boolean;
  customValues: {
    sets: string;
    reps: string;
    weight: string;
    durationMinutes: string;
    intervals: string;
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TODAY = new Date().getDay();

export default function Workouts() {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(TODAY);
  const [editingDayName, setEditingDayName] = useState<number | null>(null);
  const [dayNameInput, setDayNameInput] = useState('');
  const [showExerciseSearch, setShowExerciseSearch] = useState<number | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [draggedExercise, setDraggedExercise] = useState<string | null>(null);
  
  // Active workout state
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [loggingExercise, setLoggingExercise] = useState<LoggingExercise | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showExerciseSearch !== null && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showExerciseSearch]);

  const fetchData = async () => {
    try {
      const [scheduleRes, exercisesRes, sessionsRes] = await Promise.all([
        onboarding.getFullSchedule(),
        workouts.getExercises(),
        workouts.getSessions(),
      ]);
      setSchedule(scheduleRes.data);
      setExercises(exercisesRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForDay = (day: number): ScheduleDay | undefined => {
    return schedule.find(s => s.day_of_week === day);
  };

  const saveDayName = async (dayOfWeek: number) => {
    if (!dayNameInput.trim()) {
      setEditingDayName(null);
      return;
    }
    
    try {
      await onboarding.setScheduleDay({
        dayOfWeek,
        name: dayNameInput,
        isRestDay: dayNameInput.toLowerCase() === 'rest',
      });
      await fetchData();
      setEditingDayName(null);
      setDayNameInput('');
    } catch (error) {
      console.error('Failed to save day name:', error);
    }
  };

  const addExerciseToDay = async (dayOfWeek: number, exercise: Exercise) => {
    try {
      if (exercise.is_cardio) {
        await onboarding.addDayExercise(dayOfWeek, {
          exerciseId: exercise.id,
          durationSeconds: 1800,
          intervals: 1,
        });
      } else {
        await onboarding.addDayExercise(dayOfWeek, {
          exerciseId: exercise.id,
          sets: 3,
          reps: 10,
        });
      }
      await fetchData();
      setShowExerciseSearch(null);
      setExerciseSearch('');
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  };

  const updateExercise = async (exerciseEntryId: string, data: { sets?: number; reps?: number; weight?: number; durationSeconds?: number; intervals?: number; restSeconds?: number }) => {
    try {
      await onboarding.updateDayExercise(exerciseEntryId, data);
      await fetchData();
    } catch (error) {
      console.error('Failed to update exercise:', error);
    }
  };

  const removeExercise = async (exerciseEntryId: string) => {
    try {
      await onboarding.removeDayExercise(exerciseEntryId);
      await fetchData();
    } catch (error) {
      console.error('Failed to remove exercise:', error);
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins} min`;
  };

  const parseDuration = (str: string): number => {
    if (str.includes(':')) {
      const [mins, secs] = str.split(':').map(Number);
      return (mins || 0) * 60 + (secs || 0);
    }
    return (parseInt(str) || 0) * 60;
  };

  const handleDragStart = (e: React.DragEvent, exerciseId: string) => {
    setDraggedExercise(exerciseId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetExerciseId: string, dayOfWeek: number) => {
    e.preventDefault();
    if (!draggedExercise || draggedExercise === targetExerciseId) {
      setDraggedExercise(null);
      return;
    }

    const daySchedule = getScheduleForDay(dayOfWeek);
    if (!daySchedule) return;

    const exerciseIds = daySchedule.exercises.map(ex => ex.id);
    const draggedIndex = exerciseIds.indexOf(draggedExercise);
    const targetIndex = exerciseIds.indexOf(targetExerciseId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedExercise(null);
      return;
    }

    exerciseIds.splice(draggedIndex, 1);
    exerciseIds.splice(targetIndex, 0, draggedExercise);

    try {
      await onboarding.reorderDayExercises(dayOfWeek, exerciseIds);
      await fetchData();
    } catch (error) {
      console.error('Failed to reorder exercises:', error);
    }

    setDraggedExercise(null);
  };

  // Start workout for a day
  const startWorkout = (dayOfWeek: number) => {
    const daySchedule = getScheduleForDay(dayOfWeek);
    if (!daySchedule || daySchedule.is_rest_day || daySchedule.exercises.length === 0) return;
    
    setActiveWorkout({
      dayOfWeek,
      dayName: daySchedule.name,
      exercises: [...daySchedule.exercises],
      completedExercises: new Set(),
      startedAt: new Date(),
    });
  };

  // Mark exercise as done - opens the logging modal
  const markExerciseDone = (exercise: ScheduleExercise) => {
    setLoggingExercise({
      exercise,
      usePlanned: true,
      customValues: {
        sets: exercise.sets?.toString() || '3',
        reps: exercise.reps?.toString() || '10',
        weight: exercise.weight?.toString() || '',
        durationMinutes: exercise.duration_seconds ? Math.floor(exercise.duration_seconds / 60).toString() : '30',
        intervals: exercise.intervals?.toString() || '1',
      },
    });
  };

  // Confirm logging the exercise
  const confirmExerciseLog = async () => {
    if (!loggingExercise || !activeWorkout) return;
    
    const { exercise, usePlanned, customValues } = loggingExercise;
    
    try {
      if (exercise.is_cardio) {
        const durationSeconds = usePlanned 
          ? exercise.duration_seconds 
          : parseInt(customValues.durationMinutes) * 60;
        const intervals = usePlanned ? exercise.intervals : parseInt(customValues.intervals);
        
        await progress.logExerciseProgress(exercise.exercise_id, {
          durationSeconds: durationSeconds || undefined,
          intervals: intervals || undefined,
        });
      } else {
        const sets = usePlanned ? exercise.sets : parseInt(customValues.sets);
        const reps = usePlanned ? exercise.reps : parseInt(customValues.reps);
        const weight = usePlanned ? exercise.weight : parseFloat(customValues.weight);
        
        await progress.logExerciseProgress(exercise.exercise_id, {
          sets: sets || undefined,
          reps: reps || undefined,
          weight: weight || undefined,
        });
      }
      
      // Mark as completed
      const newCompleted = new Set(activeWorkout.completedExercises);
      newCompleted.add(exercise.id);
      setActiveWorkout({ ...activeWorkout, completedExercises: newCompleted });
      setLoggingExercise(null);
    } catch (error) {
      console.error('Failed to log exercise:', error);
    }
  };

  // End workout
  const endWorkout = async () => {
    if (!activeWorkout) return;
    
    try {
      // Create a workout session record
      await workouts.startSession({ name: activeWorkout.dayName });
      // Immediately end it (for now - could enhance to track during workout)
      const sessionsRes = await workouts.getSessions();
      if (sessionsRes.data.length > 0 && !sessionsRes.data[0].ended_at) {
        await workouts.endSession(sessionsRes.data[0].id);
      }
      await fetchData();
    } catch (error) {
      console.error('Failed to end workout:', error);
    }
    
    setActiveWorkout(null);
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    ex.category?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    ex.muscle_group?.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="h-32 skeleton rounded-2xl"></div>
        <div className="space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const todaySchedule = getScheduleForDay(TODAY);

  // Active Workout View
  if (activeWorkout) {
    const completedCount = activeWorkout.completedExercises.size;
    const totalCount = activeWorkout.exercises.length;
    const progressPercent = (completedCount / totalCount) * 100;
    const elapsedMinutes = Math.floor((Date.now() - activeWorkout.startedAt.getTime()) / 60000);

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

        {/* Exercise Checklist */}
        <div className="space-y-3">
          {activeWorkout.exercises.map((ex, idx) => {
            const isCompleted = activeWorkout.completedExercises.has(ex.id);
            
            return (
              <div
                key={ex.id}
                className={`card transition-all ${isCompleted ? 'bg-emerald-50 border-emerald-200' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => !isCompleted && markExerciseDone(ex)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-slate-300 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="font-bold">{idx + 1}</span>
                    )}
                  </button>

                  {/* Exercise Info */}
                  <div className="flex-1">
                    <div className={`font-medium ${isCompleted ? 'text-emerald-700 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {ex.exercise_name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                      {ex.is_cardio ? (
                        <>
                          {formatDuration(ex.duration_seconds)}
                          {ex.intervals && ex.intervals > 1 && ` × ${ex.intervals} intervals`}
                        </>
                      ) : (
                        <>
                          {ex.sets} × {ex.reps}
                          {ex.weight && ` @ ${ex.weight}kg`}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mark Done Button */}
                  {!isCompleted && (
                    <button
                      onClick={() => markExerciseDone(ex)}
                      className="btn-primary text-sm"
                    >
                      Done ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* All done message */}
        {completedCount === totalCount && (
          <div className="card bg-emerald-50 border-emerald-200 text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-xl font-bold text-emerald-700">Workout Complete!</div>
            <div className="text-emerald-600 mt-1">Great job finishing {activeWorkout.dayName}</div>
            <button onClick={endWorkout} className="btn-primary mt-4">
              Finish & Save
            </button>
          </div>
        )}

        {/* Logging Modal */}
        {loggingExercise && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Log Exercise</h3>
              <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-4">{loggingExercise.exercise.exercise_name}</p>
              
              {/* Planned values display */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1">Planned</div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {loggingExercise.exercise.is_cardio ? (
                    <>
                      {formatDuration(loggingExercise.exercise.duration_seconds)}
                      {loggingExercise.exercise.intervals && loggingExercise.exercise.intervals > 1 && 
                        ` × ${loggingExercise.exercise.intervals} intervals`}
                    </>
                  ) : (
                    <>
                      {loggingExercise.exercise.sets} sets × {loggingExercise.exercise.reps} reps
                      {loggingExercise.exercise.weight && ` @ ${loggingExercise.exercise.weight}kg`}
                    </>
                  )}
                </div>
              </div>

              {/* Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setLoggingExercise({ ...loggingExercise, usePlanned: true })}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                    loggingExercise.usePlanned
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Use Planned
                </button>
                <button
                  onClick={() => setLoggingExercise({ ...loggingExercise, usePlanned: false })}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                    !loggingExercise.usePlanned
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Log Different
                </button>
              </div>

              {/* Custom values form */}
              {!loggingExercise.usePlanned && (
                <div className="space-y-3 mb-4">
                  {loggingExercise.exercise.is_cardio ? (
                    <>
                      <div>
                        <label className="label">Duration (minutes)</label>
                        <input
                          type="number"
                          value={loggingExercise.customValues.durationMinutes}
                          onChange={(e) => setLoggingExercise({
                            ...loggingExercise,
                            customValues: { ...loggingExercise.customValues, durationMinutes: e.target.value }
                          })}
                          className="input"
                        />
                      </div>
                      {loggingExercise.exercise.intervals && loggingExercise.exercise.intervals > 1 && (
                        <div>
                          <label className="label">Intervals</label>
                          <input
                            type="number"
                            value={loggingExercise.customValues.intervals}
                            onChange={(e) => setLoggingExercise({
                              ...loggingExercise,
                              customValues: { ...loggingExercise.customValues, intervals: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="label">Sets</label>
                          <input
                            type="number"
                            value={loggingExercise.customValues.sets}
                            onChange={(e) => setLoggingExercise({
                              ...loggingExercise,
                              customValues: { ...loggingExercise.customValues, sets: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">Reps</label>
                          <input
                            type="number"
                            value={loggingExercise.customValues.reps}
                            onChange={(e) => setLoggingExercise({
                              ...loggingExercise,
                              customValues: { ...loggingExercise.customValues, reps: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">Weight (kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={loggingExercise.customValues.weight}
                            onChange={(e) => setLoggingExercise({
                              ...loggingExercise,
                              customValues: { ...loggingExercise.customValues, weight: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={confirmExerciseLog} className="btn-primary flex-1">
                  Log & Complete ✓
                </button>
                <button onClick={() => setLoggingExercise(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal Schedule View
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Training</h1>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Plan your workout week</p>
        </div>
      </div>

      {/* Today's Workout Banner */}
      <div className={`card ${todaySchedule?.is_rest_day ? 'bg-blue-50 border-blue-200' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-sm font-medium ${todaySchedule?.is_rest_day ? 'text-blue-600' : 'text-emerald-100'}`}>
              Today • {DAYS[TODAY]}
            </div>
            <div className={`text-2xl font-bold ${todaySchedule?.is_rest_day ? 'text-blue-900' : 'text-white'}`}>
              {todaySchedule 
                ? (todaySchedule.is_rest_day ? '😴 Rest Day' : todaySchedule.name)
                : 'No workout scheduled'}
            </div>
            {todaySchedule && !todaySchedule.is_rest_day && todaySchedule.exercises.length > 0 && (
              <div className={`text-sm mt-1 ${todaySchedule?.is_rest_day ? 'text-blue-600' : 'text-emerald-100'}`}>
                {todaySchedule.exercises.length} exercises planned
              </div>
            )}
          </div>
          {todaySchedule && !todaySchedule.is_rest_day && todaySchedule.exercises.length > 0 && (
            <button
              onClick={() => startWorkout(TODAY)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all"
            >
              Start Workout →
            </button>
          )}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-3">
        {DAYS.map((dayName, dayIndex) => {
          const daySchedule = getScheduleForDay(dayIndex);
          const isToday = dayIndex === TODAY;
          const isExpanded = expandedDay === dayIndex;

          return (
            <div
              key={dayName}
              className={`card transition-all ${
                isToday ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
              } ${daySchedule?.is_rest_day ? 'bg-blue-50/50' : ''}`}
            >
              {/* Day Header */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedDay(isExpanded ? null : dayIndex)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    isToday 
                      ? 'bg-emerald-500 text-white' 
                      : daySchedule?.is_rest_day 
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}>
                    {dayName.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isToday ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>
                        {dayName}
                      </span>
                      {isToday && (
                        <span className="badge badge-emerald text-xs">Today</span>
                      )}
                    </div>
                    {editingDayName === dayIndex ? (
                      <input
                        type="text"
                        value={dayNameInput}
                        onChange={(e) => setDayNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveDayName(dayIndex);
                          if (e.key === 'Escape') setEditingDayName(null);
                        }}
                        onBlur={() => saveDayName(dayIndex)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-lg font-semibold bg-white border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Workout name"
                        autoFocus
                      />
                    ) : (
                      <div
                        className={`text-lg font-semibold ${
                          daySchedule?.is_rest_day ? 'text-blue-600' : 'text-slate-900 dark:text-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDayName(dayIndex);
                          setDayNameInput(daySchedule?.name || '');
                        }}
                      >
                        {daySchedule 
                          ? (daySchedule.is_rest_day ? '😴 Rest Day' : daySchedule.name)
                          : <span className="text-slate-400 dark:text-slate-500 text-base">Click to set workout...</span>
                        }
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {daySchedule && !daySchedule.is_rest_day && daySchedule.exercises.length > 0 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startWorkout(dayIndex);
                        }}
                        className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-all font-medium"
                      >
                        Start
                      </button>
                      <span className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                        {daySchedule.exercises.length} exercise{daySchedule.exercises.length !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                  <svg
                    className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && !daySchedule?.is_rest_day && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Exercises List */}
                  {daySchedule?.exercises && daySchedule.exercises.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {daySchedule.exercises.map((ex, idx) => (
                        <div
                          key={ex.id}
                          className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group transition-all ${
                            draggedExercise === ex.id ? 'opacity-50' : ''
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ex.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, ex.id, dayIndex)}
                        >
                          {/* Drag Handle */}
                          <div className="cursor-grab text-slate-300 hover:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                          
                          {/* Order Number */}
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium flex items-center justify-center">
                            {idx + 1}
                          </div>

                          {/* Exercise Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 dark:text-white truncate">{ex.exercise_name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{ex.muscle_group || ex.category}</div>
                          </div>

                          {/* Sets/Reps/Weight for strength OR Duration/Intervals for cardio */}
                          {editingExercise === ex.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {ex.is_cardio ? (
                                <>
                                  <input
                                    type="text"
                                    defaultValue={ex.duration_seconds ? `${Math.floor(ex.duration_seconds / 60)}` : ''}
                                    placeholder="30"
                                    className="w-14 text-center text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
                                    onBlur={(e) => updateExercise(ex.id, { durationSeconds: parseDuration(e.target.value) })}
                                  />
                                  <span className="text-xs text-slate-400 dark:text-slate-500">min</span>
                                  {(ex.intervals && ex.intervals > 1) || ex.category?.toLowerCase().includes('interval') || ex.category?.toLowerCase().includes('hiit') ? (
                                    <>
                                      <span className="text-slate-400 dark:text-slate-500 mx-1">×</span>
                                      <input
                                        type="number"
                                        defaultValue={ex.intervals || 1}
                                        min={1}
                                        className="w-12 text-center text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
                                        onBlur={(e) => updateExercise(ex.id, { intervals: parseInt(e.target.value) || 1 })}
                                      />
                                      <span className="text-xs text-slate-400 dark:text-slate-500">intervals</span>
                                    </>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <input
                                    type="number"
                                    defaultValue={ex.sets}
                                    min={1}
                                    className="w-14 text-center text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
                                    onBlur={(e) => updateExercise(ex.id, { sets: parseInt(e.target.value) || ex.sets })}
                                  />
                                  <span className="text-slate-400 dark:text-slate-500">×</span>
                                  <input
                                    type="number"
                                    defaultValue={ex.reps}
                                    min={1}
                                    className="w-14 text-center text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
                                    onBlur={(e) => updateExercise(ex.id, { reps: parseInt(e.target.value) || ex.reps })}
                                  />
                                  <span className="text-slate-400 dark:text-slate-500">@</span>
                                  <input
                                    type="number"
                                    defaultValue={ex.weight || ''}
                                    placeholder="—"
                                    className="w-16 text-center text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1"
                                    onBlur={(e) => updateExercise(ex.id, { weight: parseFloat(e.target.value) || undefined })}
                                  />
                                  <span className="text-xs text-slate-400 dark:text-slate-500">kg</span>
                                </>
                              )}
                              <button
                                onClick={() => setEditingExercise(null)}
                                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium ml-2"
                              >
                                Done
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingExercise(ex.id);
                              }}
                              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-white bg-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-all"
                            >
                              {ex.is_cardio ? (
                                <>
                                  <span className="font-medium">{formatDuration(ex.duration_seconds)}</span>
                                  {ex.intervals && ex.intervals > 1 && (
                                    <>
                                      <span className="text-slate-400 dark:text-slate-500 ml-1">×</span>
                                      <span className="font-medium">{ex.intervals}</span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="font-medium">{ex.sets}</span>
                                  <span className="text-slate-400 dark:text-slate-500">×</span>
                                  <span className="font-medium">{ex.reps}</span>
                                  {ex.weight && (
                                    <>
                                      <span className="text-slate-400 dark:text-slate-500 ml-1">@</span>
                                      <span className="font-medium">{ex.weight}kg</span>
                                    </>
                                  )}
                                </>
                              )}
                            </button>
                          )}

                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExercise(ex.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 dark:text-slate-500 mb-4">
                      No exercises added yet
                    </div>
                  )}

                  {/* Add Exercise */}
                  {showExerciseSearch === dayIndex ? (
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search exercises..."
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
                        className="input w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowExerciseSearch(null);
                            setExerciseSearch('');
                          }
                        }}
                      />
                      {exerciseSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto">
                          {filteredExercises.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500">No exercises found</div>
                          ) : (
                            filteredExercises.slice(0, 10).map((ex) => (
                              <button
                                key={ex.id}
                                onClick={() => addExerciseToDay(dayIndex, ex)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-900 dark:text-white">{ex.name}</span>
                                  {ex.is_cardio && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Cardio</span>}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                                  {ex.category}
                                  {ex.muscle_group && ` • ${ex.muscle_group}`}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setShowExerciseSearch(null);
                          setExerciseSearch('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowExerciseSearch(dayIndex)}
                      className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Exercise
                    </button>
                  )}
                </div>
              )}

              {/* Rest Day Expanded */}
              {isExpanded && daySchedule?.is_rest_day && (
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">😴</div>
                    <div className="text-blue-600 font-medium">Rest and Recovery</div>
                    <div className="text-sm text-blue-500 mt-1">
                      Rest days are important for muscle growth
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDayName(dayIndex);
                      setDayNameInput('');
                    }}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
                  >
                    Change to workout day
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Sessions</h2>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{session.name || session.plan_name || 'Workout'}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    {new Date(session.started_at).toLocaleDateString()} • {session.exercise_count} exercises
                  </div>
                </div>
                <span className="badge badge-gray">Completed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
