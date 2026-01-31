import { useEffect, useState } from 'react';
import { progress } from '../services/api';

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

export default function Progress() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({ weight: '', bodyFatPercentage: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [measurementsRes, goalsRes] = await Promise.all([
        progress.getMeasurements(),
        progress.getGoals(),
      ]);
      setMeasurements(measurementsRes.data);
      setGoals(goalsRes.data);
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  const latestWeight = measurements.find(m => m.weight)?.weight;
  const previousWeight = measurements.slice(1).find(m => m.weight)?.weight;
  const weightChange = latestWeight && previousWeight ? (latestWeight - previousWeight).toFixed(1) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <button onClick={() => setShowMeasurementForm(true)} className="btn-primary">
          + Log Measurement
        </button>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-sm text-gray-500">Current Weight</div>
          <div className="text-4xl font-bold text-purple-600">
            {latestWeight ? `${latestWeight} kg` : '—'}
          </div>
          {weightChange && (
            <div className={`text-sm ${parseFloat(weightChange) < 0 ? 'text-green-500' : 'text-red-500'}`}>
              {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg from last
            </div>
          )}
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500">Body Fat</div>
          <div className="text-4xl font-bold text-orange-600">
            {measurements[0]?.body_fat_percentage ? `${measurements[0].body_fat_percentage}%` : '—'}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500">Active Goals</div>
          <div className="text-4xl font-bold text-emerald-600">
            {goals.filter(g => !g.achieved).length}
          </div>
        </div>
      </div>

      {showMeasurementForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Log Measurement</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Measurement History */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Measurement History</h2>
          {measurements.length === 0 ? (
            <p className="text-gray-500">No measurements yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {measurements.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm text-gray-500">
                    {new Date(m.measured_at).toLocaleDateString()}
                  </span>
                  <div className="text-right">
                    {m.weight && <span className="font-medium">{m.weight} kg</span>}
                    {m.body_fat_percentage && <span className="text-gray-500 ml-2">({m.body_fat_percentage}% BF)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Goals</h2>
          {goals.length === 0 ? (
            <p className="text-gray-500">No goals set yet.</p>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className={`p-3 rounded-lg ${goal.achieved ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{goal.goal_type.replace('_', ' ')}</span>
                    {goal.achieved && <span className="text-green-600">✓ Achieved</span>}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {goal.current_value || 0} / {goal.target_value} {goal.unit}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100)}%` }}
                    />
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
