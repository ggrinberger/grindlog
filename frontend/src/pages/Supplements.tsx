import { useEffect, useState } from 'react';
import { supplements as supplementsApi } from '../services/api';

interface Supplement {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing_notes: string;
  description: string;
  is_global: boolean;
}

interface SupplementLog {
  id: string;
  supplement_id: string;
  supplement_name: string;
  taken_at: string;
  notes: string;
}

interface TodayStatus {
  supplement: Supplement;
  todayLogs: SupplementLog[];
  dosesLogged: number;
  expectedDoses: number;
  complete: boolean;
}

export default function Supplements() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [todayStatus, setTodayStatus] = useState<TodayStatus[]>([]);
  const [history, setHistory] = useState<SupplementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupplement, setNewSupplement] = useState({
    name: '',
    dosage: '',
    frequency: '',
    timingNotes: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [supplementsRes, todayRes, historyRes] = await Promise.all([
        supplementsApi.getAll(),
        supplementsApi.getTodayStatus(),
        supplementsApi.getHistory(20),
      ]);
      setSupplements(supplementsRes.data);
      setTodayStatus(todayRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to fetch supplements:', error);
    } finally {
      setLoading(false);
    }
  };

  const logSupplement = async (supplementId: string) => {
    try {
      await supplementsApi.log(supplementId);
      await fetchData();
    } catch (error) {
      console.error('Failed to log supplement:', error);
    }
  };

  const addSupplement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supplementsApi.create(newSupplement);
      setNewSupplement({ name: '', dosage: '', frequency: '', timingNotes: '', description: '' });
      setShowAddForm(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to add supplement:', error);
    }
  };

  const deleteSupplement = async (id: string) => {
    if (!confirm('Remove this supplement?')) return;
    try {
      await supplementsApi.delete(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete supplement:', error);
    }
  };

  const allComplete = todayStatus.length > 0 && todayStatus.every((s) => s.complete);
  const completedCount = todayStatus.filter((s) => s.complete).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="h-32 skeleton rounded-2xl"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
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
          <h1 className="page-title">Supplements</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your daily supplements & medications</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Supplement'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={addSupplement} className="card">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Add New Supplement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                required
                value={newSupplement.name}
                onChange={(e) => setNewSupplement({ ...newSupplement, name: e.target.value })}
                className="input"
                placeholder="e.g., Vitamin D3"
              />
            </div>
            <div>
              <label className="label">Dosage</label>
              <input
                type="text"
                value={newSupplement.dosage}
                onChange={(e) => setNewSupplement({ ...newSupplement, dosage: e.target.value })}
                className="input"
                placeholder="e.g., 5000 IU"
              />
            </div>
            <div>
              <label className="label">Frequency</label>
              <input
                type="text"
                value={newSupplement.frequency}
                onChange={(e) => setNewSupplement({ ...newSupplement, frequency: e.target.value })}
                className="input"
                placeholder="e.g., Once daily, 2x daily"
              />
            </div>
            <div>
              <label className="label">Timing Notes</label>
              <input
                type="text"
                value={newSupplement.timingNotes}
                onChange={(e) => setNewSupplement({ ...newSupplement, timingNotes: e.target.value })}
                className="input"
                placeholder="e.g., With breakfast"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description (optional)</label>
              <textarea
                value={newSupplement.description}
                onChange={(e) => setNewSupplement({ ...newSupplement, description: e.target.value })}
                className="input"
                rows={2}
                placeholder="Notes about this supplement..."
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="btn-primary">Add Supplement</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Today's Summary */}
      <div className={`card ${allComplete ? 'bg-emerald-50 border-emerald-200' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Checklist</h2>
          {todayStatus.length > 0 && (
            <span className={`badge ${allComplete ? 'badge-emerald' : 'badge-gray'}`}>
              {completedCount}/{todayStatus.length} complete
            </span>
          )}
        </div>

        {todayStatus.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <div className="text-4xl mb-2">💊</div>
            <div>No supplements tracked yet</div>
            <div className="text-sm">Add supplements to start tracking</div>
          </div>
        ) : (
          <div className="space-y-3">
            {todayStatus.map((status) => (
              <div
                key={status.supplement.id}
                className={`p-4 rounded-xl transition-all ${
                  status.complete
                    ? 'bg-emerald-100 border border-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      status.complete ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-300'
                    }`}>
                      {status.complete ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">
                          {status.dosesLogged}/{status.expectedDoses}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className={`font-medium ${status.complete ? 'text-emerald-700' : 'text-slate-900 dark:text-white'}`}>
                        {status.supplement.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {status.supplement.dosage && <span>{status.supplement.dosage}</span>}
                        {status.supplement.frequency && <span> • {status.supplement.frequency}</span>}
                      </div>
                      {status.supplement.timing_notes && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          ⏰ {status.supplement.timing_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Log buttons */}
                  <div className="flex items-center gap-2">
                    {status.todayLogs.map((log) => (
                      <span
                        key={log.id}
                        className="text-xs bg-emerald-200 text-emerald-700 px-2 py-1 rounded"
                      >
                        {new Date(log.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ))}
                    {!status.complete && (
                      <button
                        onClick={() => logSupplement(status.supplement.id)}
                        className="btn-primary text-sm"
                      >
                        Take {status.dosesLogged > 0 ? `(${status.dosesLogged + 1})` : ''}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Supplements */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">All Supplements</h2>
        {supplements.length === 0 ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400">
            No supplements added yet
          </div>
        ) : (
          <div className="space-y-3">
            {supplements.map((supp) => (
              <div key={supp.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">{supp.name}</span>
                    {supp.is_global && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Default</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {supp.dosage && <span>{supp.dosage}</span>}
                    {supp.frequency && <span> • {supp.frequency}</span>}
                  </div>
                  {supp.description && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{supp.description}</div>
                  )}
                </div>
                {!supp.is_global && (
                  <button
                    onClick={() => deleteSupplement(supp.id)}
                    className="text-red-400 hover:text-red-600 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Logs</h2>
          <div className="space-y-2">
            {history.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">{log.supplement_name}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {new Date(log.taken_at).toLocaleDateString()} at{' '}
                  {new Date(log.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
