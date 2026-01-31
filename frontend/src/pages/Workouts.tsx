import { useEffect, useState } from 'react';
import { workouts, onboarding } from '../services/api';

interface Session {
  id: string;
  name: string;
  plan_name: string;
  started_at: string;
  ended_at: string | null;
  exercise_count: string;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_group: string;
}

interface ScheduleDay {
  id: string;
  day_of_week: number;
  name: string;
  plan_id: string | null;
  plan_name: string | null;
  is_rest_day: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TODAY = new Date().getDay();

export default function Workouts() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editDayName, setEditDayName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, exercisesRes, scheduleRes] = await Promise.all([
        workouts.getSessions(),
        workouts.getExercises(),
        onboarding.getSchedule(),
      ]);
      setSessions(sessionsRes.data);
      setExercises(exercisesRes.data);
      setSchedule(scheduleRes.data);
    } catch (error) {
      console.error('Failed to fetch workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const { data } = await workouts.startSession({ name: sessionName || 'Workout' });
      setSessions([data, ...sessions]);
      setShowNewSession(false);
      setSessionName('');
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      await workouts.endSession(sessionId);
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, ended_at: new Date().toISOString() } : s
      ));
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const startTodayWorkout = () => {
    const todaySchedule = schedule.find(s => s.day_of_week === TODAY);
    if (todaySchedule && !todaySchedule.is_rest_day) {
      setSessionName(todaySchedule.name);
      setShowNewSession(true);
    } else {
      setShowNewSession(true);
    }
  };

  const saveScheduleDay = async (dayOfWeek: number) => {
    try {
      await onboarding.setScheduleDay({
        dayOfWeek,
        name: editDayName,
        isRestDay: editDayName.toLowerCase() === 'rest',
      });
      fetchData();
      setEditingDay(null);
      setEditDayName('');
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

  const getScheduleForDay = (day: number) => {
    return schedule.find(s => s.day_of_week === day);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="h-32 skeleton rounded-2xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 skeleton rounded-2xl"></div>
          <div className="h-64 skeleton rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const todaySchedule = getScheduleForDay(TODAY);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workouts</h1>
          <p className="text-slate-500 mt-1">Track your training sessions</p>
        </div>
        <button onClick={startTodayWorkout} className="btn-primary">
          + Start Workout
        </button>
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
          </div>
          {todaySchedule && !todaySchedule.is_rest_day && (
            <button
              onClick={startTodayWorkout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all"
            >
              Start Now →
            </button>
          )}
        </div>
      </div>

      {showNewSession && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Start New Workout</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Workout name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="input flex-1"
            />
            <button onClick={startSession} className="btn-primary">Start</button>
            <button onClick={() => setShowNewSession(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Weekly Schedule</h2>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, index) => {
            const daySchedule = getScheduleForDay(index);
            const isToday = index === TODAY;
            
            return (
              <div
                key={day}
                className={`p-3 rounded-xl text-center transition-all ${
                  isToday
                    ? 'bg-emerald-100 border-2 border-emerald-500'
                    : daySchedule?.is_rest_day
                    ? 'bg-blue-50 border border-blue-200'
                    : daySchedule
                    ? 'bg-slate-50 border border-slate-200'
                    : 'bg-slate-50 border border-dashed border-slate-300'
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${isToday ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {day.slice(0, 3)}
                </div>
                {editingDay === index ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editDayName}
                      onChange={(e) => setEditDayName(e.target.value)}
                      className="w-full text-xs px-2 py-1 border rounded"
                      placeholder="Workout name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveScheduleDay(index);
                        if (e.key === 'Escape') setEditingDay(null);
                      }}
                    />
                    <button
                      onClick={() => saveScheduleDay(index)}
                      className="text-xs text-emerald-600 hover:text-emerald-700"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingDay(index);
                      setEditDayName(daySchedule?.name || '');
                    }}
                    className="w-full"
                  >
                    {daySchedule ? (
                      <div className={`text-sm font-medium ${
                        daySchedule.is_rest_day ? 'text-blue-600' : 'text-slate-900'
                      }`}>
                        {daySchedule.is_rest_day ? '😴' : daySchedule.name}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 hover:text-slate-600">+ Add</div>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">🏋️</div>
              <div className="empty-state-title">No workouts yet</div>
              <div className="empty-state-text">Start your first workout!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-medium text-slate-900">{session.name || session.plan_name || 'Workout'}</div>
                    <div className="text-sm text-slate-500">
                      {new Date(session.started_at).toLocaleDateString()} • {session.exercise_count} exercises
                    </div>
                  </div>
                  {!session.ended_at ? (
                    <button
                      onClick={() => endSession(session.id)}
                      className="badge badge-emerald"
                    >
                      End Session
                    </button>
                  ) : (
                    <span className="badge badge-gray">Completed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exercise Library */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Exercise Library</h2>
          {exercises.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-title">No exercises yet</div>
              <div className="empty-state-text">Exercises will appear here</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {exercises.slice(0, 20).map((exercise) => (
                <div key={exercise.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="font-medium text-slate-900">{exercise.name}</div>
                  <div className="text-sm text-slate-500">
                    {exercise.category}
                    {exercise.muscle_group && ` • ${exercise.muscle_group}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
