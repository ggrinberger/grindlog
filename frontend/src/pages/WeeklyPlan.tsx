import { useEffect, useState } from 'react';
import { templates as templatesApi } from '../services/api';

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

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY = new Date().getDay();

const DAY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Recovery': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Lower Power': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Upper Push': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Pull': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Hypertrophy': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Upper Pull': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Home': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

const getColorForDay = (dayName: string) => {
  for (const [key, colors] of Object.entries(DAY_COLORS)) {
    if (dayName.includes(key)) return colors;
  }
  return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
};

export default function WeeklyPlan() {
  const [weeklyPlan, setWeeklyPlan] = useState<Record<number, WorkoutTemplate[]>>({});
  const [dayNames, setDayNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(TODAY);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await templatesApi.getWeekly();
      setWeeklyPlan(response.data.weeklyPlan || {});
      setDayNames(response.data.dayNames || {});
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
          
          return (
            <button
              key={day}
              onClick={() => setExpandedDay(expandedDay === day ? null : day)}
              className={`p-2 rounded-xl text-center transition-all ${
                isToday ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
              } ${
                expandedDay === day
                  ? `${colors.bg} ${colors.border} border-2`
                  : hasWorkout
                    ? 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'bg-slate-100/50 dark:bg-slate-800/30'
              }`}
            >
              <div className={`text-xs font-medium ${isToday ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}>
                {DAY_SHORT[day]}
              </div>
              <div className={`text-sm font-semibold truncate ${
                expandedDay === day ? colors.text : 'text-slate-900 dark:text-white'
              }`}>
                {dayName.split(':')[0]?.replace(DAY_LABELS[day] + ': ', '') || '—'}
              </div>
              {hasWorkout && (
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {weeklyPlan[day].filter(e => !e.section || e.section === null).length} exercises
                </div>
              )}
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
            <div className={`px-3 py-1 rounded-full ${getColorForDay(dayNames[expandedDay]).bg} ${getColorForDay(dayNames[expandedDay]).text} text-sm font-medium`}>
              {DAY_LABELS[expandedDay]}
            </div>
          </div>

          {/* Grouped by section */}
          <div className="space-y-6">
            {groupBySection(weeklyPlan[expandedDay]).map((group, groupIdx) => (
              <div key={groupIdx}>
                {group.section && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      group.section === 'WARM-UP' ? 'bg-orange-100 text-orange-700' :
                      group.section === 'VO2' ? 'bg-red-100 text-red-700' :
                      group.section === 'FINISHER' ? 'bg-blue-100 text-blue-700' :
                      group.section === 'THRESHOLD' ? 'bg-purple-100 text-purple-700' :
                      group.section === 'CONDITIONING' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {group.section}
                    </div>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                )}

                <div className="space-y-2">
                  {group.exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-medium flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">{ex.exercise}</span>
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
                        </div>
                      </div>
                    </div>
                  ))}
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
            
            return (
              <div
                key={day}
                className={`flex items-center justify-between p-3 rounded-xl ${colors.bg} ${colors.border} border`}
              >
                <div className="flex items-center gap-3">
                  <div className={`font-medium ${colors.text}`}>
                    {DAY_LABELS[day]}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {dayName.split(':')[1]?.trim() || dayName.split(':')[0] || '—'}
                  </div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {mainExercises.length > 0 ? `${mainExercises.length} exercises` : 'Rest'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
