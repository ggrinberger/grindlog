import { useEffect, useState } from 'react';
import { routines as routinesApi } from '../services/api';

interface RoutineItem {
  activity: string;
  duration: string;
  reps?: string;
  timing?: string;
  details: string;
  focus: string;
  notes?: string;
}

interface Routine {
  id: string;
  name: string;
  type: 'morning' | 'evening';
  description: string;
  total_duration_minutes: number;
  items: RoutineItem[];
}

interface TodayCompletion {
  id: string;
  routine_id: string;
  routine_name: string;
  routine_type: string;
  completed_at: string;
  items_completed: string[];
}

export default function Routines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<TodayCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [timerActive, setTimerActive] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerActive(null);
            // Play a sound or notification
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const fetchData = async () => {
    try {
      const [routinesRes, todayRes] = await Promise.all([
        routinesApi.getAll(),
        routinesApi.getTodayStatus(),
      ]);
      setRoutines(routinesRes.data);
      setTodayCompletions(todayRes.data);
    } catch (error) {
      console.error('Failed to fetch routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRoutine = (routine: Routine) => {
    setActiveRoutine(routine);
    setCheckedItems(new Set());
  };

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const startTimer = (index: number, durationStr: string) => {
    // Parse duration like "3-5 min" or "5 min" or "30-60 min"
    const match = durationStr.match(/(\d+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      setTimerSeconds(minutes * 60);
      setTimerActive(index);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completeRoutine = async () => {
    if (!activeRoutine) return;
    
    try {
      const completedItems = activeRoutine.items
        .filter((_, idx) => checkedItems.has(idx))
        .map((item) => item.activity);
      
      await routinesApi.complete(activeRoutine.id, { itemsCompleted: completedItems });
      await fetchData();
      setActiveRoutine(null);
      setCheckedItems(new Set());
    } catch (error) {
      console.error('Failed to complete routine:', error);
    }
  };

  const isRoutineCompletedToday = (routineId: string) => {
    return todayCompletions.some((c) => c.routine_id === routineId);
  };

  const morningRoutines = routines.filter((r) => r.type === 'morning');
  const eveningRoutines = routines.filter((r) => r.type === 'evening');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="h-48 skeleton rounded-2xl"></div>
        <div className="h-48 skeleton rounded-2xl"></div>
      </div>
    );
  }

  // Active Routine View
  if (activeRoutine) {
    const completedCount = checkedItems.size;
    const totalCount = activeRoutine.items.length;
    const progressPercent = (completedCount / totalCount) * 100;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className={`card border-0 ${
          activeRoutine.type === 'morning' 
            ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
            : 'bg-gradient-to-r from-indigo-500 to-purple-500'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/80 text-sm font-medium">
                {activeRoutine.type === 'morning' ? '🌅 Morning' : '🌙 Evening'} Routine
              </div>
              <div className="text-2xl font-bold">{activeRoutine.name}</div>
              <div className="text-white/80 text-sm mt-1">
                {completedCount}/{totalCount} activities • ~{activeRoutine.total_duration_minutes} min
              </div>
            </div>
            <button
              onClick={() => setActiveRoutine(null)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all"
            >
              Exit
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

        {/* Timer (if active) */}
        {timerActive !== null && (
          <div className="card bg-slate-900 text-white text-center">
            <div className="text-5xl font-mono font-bold mb-2">{formatTime(timerSeconds)}</div>
            <div className="text-slate-400">{activeRoutine.items[timerActive]?.activity}</div>
            <button
              onClick={() => setTimerActive(null)}
              className="mt-3 text-red-400 hover:text-red-300 text-sm"
            >
              Cancel Timer
            </button>
          </div>
        )}

        {/* Activity Checklist */}
        <div className="space-y-3">
          {activeRoutine.items.map((item, idx) => {
            const isCompleted = checkedItems.has(idx);
            const hasDuration = item.duration && item.duration !== 'N/A';

            return (
              <div
                key={idx}
                className={`card transition-all ${
                  isCompleted 
                    ? activeRoutine.type === 'morning' 
                      ? 'bg-amber-50 border-amber-200' 
                      : 'bg-indigo-50 border-indigo-200'
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleItem(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 mt-1 ${
                      isCompleted
                        ? activeRoutine.type === 'morning'
                          ? 'bg-amber-500 text-white'
                          : 'bg-indigo-500 text-white'
                        : 'border-2 border-slate-300 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Activity Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${
                      isCompleted 
                        ? activeRoutine.type === 'morning' 
                          ? 'text-amber-700' 
                          : 'text-indigo-700'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {item.activity}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.duration && item.duration !== 'N/A' && (
                        <span className="mr-2">⏱️ {item.duration}</span>
                      )}
                      {item.reps && (
                        <span className="mr-2">🔄 {item.reps}</span>
                      )}
                      {item.focus && (
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {item.focus}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.details}</div>
                  </div>

                  {/* Timer Button */}
                  {hasDuration && !isCompleted && (
                    <button
                      onClick={() => startTimer(idx, item.duration)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        timerActive === idx
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {timerActive === idx ? formatTime(timerSeconds) : '⏱️ Timer'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Button */}
        {completedCount === totalCount && (
          <div className={`card text-center py-8 ${
            activeRoutine.type === 'morning' 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-indigo-50 border-indigo-200'
          }`}>
            <div className="text-4xl mb-2">🎉</div>
            <div className={`text-xl font-bold ${
              activeRoutine.type === 'morning' ? 'text-amber-700' : 'text-indigo-700'
            }`}>
              Routine Complete!
            </div>
            <button onClick={completeRoutine} className="btn-primary mt-4">
              Save & Finish
            </button>
          </div>
        )}

        {completedCount > 0 && completedCount < totalCount && (
          <button
            onClick={completeRoutine}
            className="w-full btn-secondary"
          >
            Complete Partially ({completedCount}/{totalCount} done)
          </button>
        )}
      </div>
    );
  }

  // Routine Selection View
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Routines</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Build consistent habits every day</p>
        </div>
      </div>

      {/* Morning Routines */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          🌅 Morning Routines
        </h2>
        <div className="space-y-3">
          {morningRoutines.length === 0 ? (
            <div className="card text-center py-8 text-slate-500 dark:text-slate-400">
              No morning routines set up yet
            </div>
          ) : (
            morningRoutines.map((routine) => {
              const isCompleted = isRoutineCompletedToday(routine.id);
              return (
                <div
                  key={routine.id}
                  className={`card transition-all ${
                    isCompleted ? 'bg-amber-50 border-amber-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isCompleted && (
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className={`font-semibold ${isCompleted ? 'text-amber-700' : 'text-slate-900 dark:text-white'}`}>
                          {routine.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {routine.items.length} activities • ~{routine.total_duration_minutes} min
                        </div>
                      </div>
                    </div>
                    {isCompleted ? (
                      <span className="badge badge-emerald">Done Today ✓</span>
                    ) : (
                      <button
                        onClick={() => startRoutine(routine)}
                        className="btn-primary"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Evening Routines */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          🌙 Evening Routines
        </h2>
        <div className="space-y-3">
          {eveningRoutines.length === 0 ? (
            <div className="card text-center py-8 text-slate-500 dark:text-slate-400">
              No evening routines set up yet
            </div>
          ) : (
            eveningRoutines.map((routine) => {
              const isCompleted = isRoutineCompletedToday(routine.id);
              return (
                <div
                  key={routine.id}
                  className={`card transition-all ${
                    isCompleted ? 'bg-indigo-50 border-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isCompleted && (
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className={`font-semibold ${isCompleted ? 'text-indigo-700' : 'text-slate-900 dark:text-white'}`}>
                          {routine.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {routine.items.length} activities • ~{routine.total_duration_minutes} min
                        </div>
                      </div>
                    </div>
                    {isCompleted ? (
                      <span className="badge badge-emerald">Done Today ✓</span>
                    ) : (
                      <button
                        onClick={() => startRoutine(routine)}
                        className="btn-primary"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Today's Summary */}
      {todayCompletions.length > 0 && (
        <div className="card bg-emerald-50 border-emerald-200">
          <h3 className="font-semibold text-emerald-800 mb-2">Today's Progress</h3>
          <div className="text-sm text-emerald-700">
            {todayCompletions.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <span>✓</span>
                <span>{c.routine_name}</span>
                <span className="text-emerald-500">
                  at {new Date(c.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
