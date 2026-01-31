import { useEffect, useState } from 'react';
import { cardio as cardioApi } from '../services/api';

interface CardioProtocol {
  id: string;
  name: string;
  modality: string;
  description: string;
  total_minutes: number;
  frequency: string;
  hr_zone_target: string;
  instructions: string;
  science_notes: string;
}

interface CardioLog {
  id: string;
  protocol_id: string;
  protocol_name: string;
  modality: string;
  duration_minutes: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  calories_burned: number;
  notes: string;
  completed_at: string;
}

interface WeeklySummary {
  total_sessions: string;
  total_minutes: string;
  avg_heart_rate: string;
  total_calories: string;
}

export default function Cardio() {
  const [protocols, setProtocols] = useState<CardioProtocol[]>([]);
  const [logs, setLogs] = useState<CardioLog[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState<CardioProtocol | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logForm, setLogForm] = useState({
    durationMinutes: '',
    avgHeartRate: '',
    maxHeartRate: '',
    caloriesBurned: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [protocolsRes, logsRes, summaryRes] = await Promise.all([
        cardioApi.getProtocols(),
        cardioApi.getLogs(20),
        cardioApi.getWeeklySummary(),
      ]);
      setProtocols(protocolsRes.data);
      setLogs(logsRes.data);
      setWeeklySummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch cardio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLogSession = (protocol: CardioProtocol) => {
    setSelectedProtocol(protocol);
    setLogForm({
      durationMinutes: protocol.total_minutes?.toString() || '',
      avgHeartRate: '',
      maxHeartRate: '',
      caloriesBurned: '',
      notes: '',
    });
    setShowLogForm(true);
  };

  const submitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol) return;

    try {
      await cardioApi.logSession({
        protocolId: selectedProtocol.id,
        durationMinutes: parseInt(logForm.durationMinutes) || undefined,
        avgHeartRate: parseInt(logForm.avgHeartRate) || undefined,
        maxHeartRate: parseInt(logForm.maxHeartRate) || undefined,
        caloriesBurned: parseInt(logForm.caloriesBurned) || undefined,
        notes: logForm.notes || undefined,
      });
      setShowLogForm(false);
      setSelectedProtocol(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to log cardio session:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="h-32 skeleton rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cardio & VO2 Max</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your conditioning protocols</p>
        </div>
      </div>

      {/* Weekly Summary */}
      {weeklySummary && (
        <div className="card bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
          <h2 className="text-lg font-semibold mb-4">This Week's Cardio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-3xl font-bold">{weeklySummary.total_sessions || 0}</div>
              <div className="text-red-100 text-sm">Sessions</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{Math.round(Number(weeklySummary.total_minutes) || 0)}</div>
              <div className="text-red-100 text-sm">Minutes</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{Math.round(Number(weeklySummary.avg_heart_rate) || 0) || '—'}</div>
              <div className="text-red-100 text-sm">Avg HR</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{Math.round(Number(weeklySummary.total_calories) || 0) || '—'}</div>
              <div className="text-red-100 text-sm">Calories</div>
            </div>
          </div>
        </div>
      )}

      {/* Protocols */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">VO2 Max Protocols</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {protocols.map((protocol) => (
            <div key={protocol.id} className="card hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{protocol.name}</h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{protocol.modality}</div>
                </div>
                <span className="badge badge-orange">{protocol.total_minutes} min</span>
              </div>
              
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                {protocol.description}
              </div>

              {protocol.hr_zone_target && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 mb-3">
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">HR Zones</div>
                  <div className="text-sm text-red-700 dark:text-red-300">{protocol.hr_zone_target}</div>
                </div>
              )}

              {protocol.frequency && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  📅 {protocol.frequency}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => startLogSession(protocol)}
                  className="btn-primary text-sm flex-1"
                >
                  Log Session
                </button>
                <button
                  onClick={() => setSelectedProtocol(selectedProtocol?.id === protocol.id ? null : protocol)}
                  className="btn-secondary text-sm"
                >
                  Details
                </button>
              </div>

              {/* Expanded Details */}
              {selectedProtocol?.id === protocol.id && !showLogForm && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {protocol.instructions && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Instructions</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{protocol.instructions}</div>
                    </div>
                  )}
                  {protocol.science_notes && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Science</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 italic">{protocol.science_notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Log Session Modal */}
      {showLogForm && selectedProtocol && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Log Cardio Session</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">{selectedProtocol.name}</p>

            <form onSubmit={submitLog} className="space-y-4">
              <div>
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  value={logForm.durationMinutes}
                  onChange={(e) => setLogForm({ ...logForm, durationMinutes: e.target.value })}
                  className="input"
                  placeholder={selectedProtocol.total_minutes?.toString() || '30'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Avg Heart Rate</label>
                  <input
                    type="number"
                    value={logForm.avgHeartRate}
                    onChange={(e) => setLogForm({ ...logForm, avgHeartRate: e.target.value })}
                    className="input"
                    placeholder="145"
                  />
                </div>
                <div>
                  <label className="label">Max Heart Rate</label>
                  <input
                    type="number"
                    value={logForm.maxHeartRate}
                    onChange={(e) => setLogForm({ ...logForm, maxHeartRate: e.target.value })}
                    className="input"
                    placeholder="175"
                  />
                </div>
              </div>

              <div>
                <label className="label">Calories Burned (optional)</label>
                <input
                  type="number"
                  value={logForm.caloriesBurned}
                  onChange={(e) => setLogForm({ ...logForm, caloriesBurned: e.target.value })}
                  className="input"
                  placeholder="300"
                />
              </div>

              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="How did it feel?"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Log Session</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogForm(false);
                    setSelectedProtocol(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {logs.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Sessions</h2>
          <div className="space-y-3">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{log.protocol_name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {log.duration_minutes && <span>{log.duration_minutes} min</span>}
                    {log.avg_heart_rate && <span> • {log.avg_heart_rate} avg HR</span>}
                    {log.calories_burned && <span> • {log.calories_burned} cal</span>}
                  </div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(log.completed_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
