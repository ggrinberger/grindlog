import { useEffect, useState } from 'react';
import { workouts } from '../services/api';

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

export default function Workouts() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [sessionName, setSessionName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, exercisesRes] = await Promise.all([
          workouts.getSessions(),
          workouts.getExercises(),
        ]);
        setSessions(sessionsRes.data);
        setExercises(exercisesRes.data);
      } catch (error) {
        console.error('Failed to fetch workouts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        <button onClick={() => setShowNewSession(true)} className="btn-primary">
          + New Workout
        </button>
      </div>

      {showNewSession && (
        <div className="card">
          <h3 className="font-semibold mb-4">Start New Workout</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Workout name (optional)"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="input flex-1"
            />
            <button onClick={startSession} className="btn-primary">Start</button>
            <button onClick={() => setShowNewSession(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500">No workouts yet. Start your first one!</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{session.name || session.plan_name || 'Workout'}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(session.started_at).toLocaleDateString()} • {session.exercise_count} exercises
                    </div>
                  </div>
                  {!session.ended_at ? (
                    <button
                      onClick={() => endSession(session.id)}
                      className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full"
                    >
                      End Session
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">Completed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Exercise Library</h2>
          {exercises.length === 0 ? (
            <p className="text-gray-500">No exercises yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="p-2 hover:bg-gray-50 rounded">
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-sm text-gray-500">
                    {exercise.category} {exercise.muscle_group && `• ${exercise.muscle_group}`}
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
