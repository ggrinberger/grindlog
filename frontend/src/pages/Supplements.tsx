import { useEffect, useState } from 'react';
import { supplements as supplementsApi, users } from '../services/api';

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

interface SuggestedSupplement {
  name: string;
  dosage: string;
  frequency: string;
  timingNotes: string;
  description: string;
  goals: string[];
  icon: string;
}

// Goal-based supplement suggestions
const SUPPLEMENT_SUGGESTIONS: SuggestedSupplement[] = [
  {
    name: 'Creatine Monohydrate',
    dosage: '5g',
    frequency: 'Once daily',
    timingNotes: 'Any time of day, with water',
    description: 'Most researched supplement for strength and muscle gains. Take consistently every day.',
    goals: ['build_muscle', 'gain_strength'],
    icon: '💪',
  },
  {
    name: 'Whey Protein',
    dosage: '25-30g',
    frequency: 'As needed',
    timingNotes: 'Post-workout or between meals',
    description: 'Convenient protein source to hit daily protein targets. 20-40g per serving.',
    goals: ['build_muscle', 'gain_strength', 'lose_weight'],
    icon: '🥛',
  },
  {
    name: 'Caffeine',
    dosage: '100-200mg',
    frequency: 'Pre-workout',
    timingNotes: '30-60 min before training, avoid after 2pm',
    description: 'Enhances focus, energy, and performance. Start with lower dose to assess tolerance.',
    goals: ['build_muscle', 'gain_strength', 'improve_endurance', 'lose_weight'],
    icon: '☕',
  },
  {
    name: 'Vitamin D3',
    dosage: '2000-5000 IU',
    frequency: 'Once daily',
    timingNotes: 'With a meal containing fat',
    description: 'Essential for bone health, immune function, and mood. Most people are deficient.',
    goals: ['get_fit', 'build_muscle', 'lose_weight', 'gain_strength', 'improve_endurance'],
    icon: '☀️',
  },
  {
    name: 'Omega-3 Fish Oil',
    dosage: '1-3g EPA/DHA',
    frequency: 'Once daily',
    timingNotes: 'With meals to reduce fishy burps',
    description: 'Supports heart health, reduces inflammation, aids recovery.',
    goals: ['get_fit', 'improve_endurance', 'build_muscle'],
    icon: '🐟',
  },
  {
    name: 'Magnesium',
    dosage: '300-400mg',
    frequency: 'Once daily',
    timingNotes: 'Take 30-60 min before bed',
    description: 'Glycinate or threonate form preferred. Enhances sleep, muscle recovery, reduces cramps.',
    goals: ['get_fit', 'build_muscle', 'gain_strength', 'improve_endurance', 'lose_weight'],
    icon: '😴',
  },
  {
    name: 'Beta-Alanine',
    dosage: '3-5g',
    frequency: 'Once daily',
    timingNotes: 'Any time, tingling sensation is normal',
    description: 'Buffers lactic acid for improved endurance during high-intensity exercise.',
    goals: ['improve_endurance', 'build_muscle'],
    icon: '🏃',
  },
  {
    name: 'Electrolytes',
    dosage: 'Per label',
    frequency: 'During/after exercise',
    timingNotes: 'During long workouts or in hot conditions',
    description: 'Sodium, potassium, magnesium for hydration and performance.',
    goals: ['improve_endurance', 'get_fit'],
    icon: '💧',
  },
  {
    name: 'L-Carnitine',
    dosage: '2-3g',
    frequency: 'Once daily',
    timingNotes: 'Before fasted cardio or with meals',
    description: 'May help with fat metabolism and reduce muscle soreness.',
    goals: ['lose_weight', 'improve_endurance'],
    icon: '🔥',
  },
  {
    name: 'Ashwagandha',
    dosage: '300-600mg',
    frequency: 'Once daily',
    timingNotes: 'Morning or evening',
    description: 'Adaptogen that may reduce stress, improve recovery, and support testosterone.',
    goals: ['build_muscle', 'gain_strength', 'get_fit'],
    icon: '🌿',
  },
];

export default function Supplements() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [todayStatus, setTodayStatus] = useState<TodayStatus[]>([]);
  const [history, setHistory] = useState<SupplementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userGoal, setUserGoal] = useState<string>('');
  const [addingSupp, setAddingSupp] = useState<string | null>(null);
  const [newSupplement, setNewSupplement] = useState({
    name: '',
    dosage: '',
    frequency: '',
    timingNotes: '',
    description: '',
  });
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);
  const [editValues, setEditValues] = useState({
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
      const [supplementsRes, todayRes, historyRes, profileRes] = await Promise.all([
        supplementsApi.getAll(),
        supplementsApi.getTodayStatus(),
        supplementsApi.getHistory(20),
        users.getProfile(),
      ]);
      setSupplements(supplementsRes.data);
      setTodayStatus(todayRes.data);
      setHistory(historyRes.data);
      setUserGoal(profileRes.data.fitness_goal || '');
    } catch (error) {
      console.error('Failed to fetch supplements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedSupplements = () => {
    if (!userGoal) {
      // Show all suggestions if no goal set
      return SUPPLEMENT_SUGGESTIONS;
    }
    // Prioritize supplements matching user's goal, then show others
    const matching = SUPPLEMENT_SUGGESTIONS.filter(s => s.goals.includes(userGoal));
    const others = SUPPLEMENT_SUGGESTIONS.filter(s => !s.goals.includes(userGoal));
    return [...matching, ...others];
  };

  const isSupplementAdded = (name: string) => {
    return supplements.some(s => s.name.toLowerCase() === name.toLowerCase());
  };

  const addSuggestedSupplement = async (suggestion: SuggestedSupplement) => {
    setAddingSupp(suggestion.name);
    try {
      await supplementsApi.create({
        name: suggestion.name,
        dosage: suggestion.dosage,
        frequency: suggestion.frequency,
        timingNotes: suggestion.timingNotes,
        description: suggestion.description,
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to add supplement:', error);
    } finally {
      setAddingSupp(null);
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

  const startEditSupplement = (supp: Supplement) => {
    setEditingSupplement(supp);
    setEditValues({
      name: supp.name,
      dosage: supp.dosage || '',
      frequency: supp.frequency || '',
      timingNotes: supp.timing_notes || '',
      description: supp.description || '',
    });
  };

  const saveEditSupplement = async () => {
    if (!editingSupplement) return;
    try {
      await supplementsApi.update(editingSupplement.id, editValues);
      setEditingSupplement(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to update supplement:', error);
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
          <div className="text-center py-8">
            <div className="text-5xl mb-3">💊</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No supplements set up yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Add supplements you take regularly to track your daily intake
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowSuggestions(true)}
                className="btn-primary"
              >
                ✨ View Suggestions
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-secondary"
              >
                + Add Custom
              </button>
            </div>
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

      {/* Suggested Supplements */}
      {(showSuggestions || supplements.length === 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                ✨ Suggested Supplements
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {userGoal 
                  ? `Based on your goal: ${userGoal.replace('_', ' ')}`
                  : 'Popular supplements for fitness'
                }
              </p>
            </div>
            {supplements.length > 0 && (
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getSuggestedSupplements().map((sugg) => {
              const alreadyAdded = isSupplementAdded(sugg.name);
              const isMatching = userGoal && sugg.goals.includes(userGoal);
              
              return (
                <div
                  key={sugg.name}
                  className={`p-4 rounded-xl border transition-all ${
                    alreadyAdded
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : isMatching
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl">{sugg.icon}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{sugg.name}</span>
                        {isMatching && !alreadyAdded && (
                          <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                            Recommended
                          </span>
                        )}
                        {alreadyAdded && (
                          <span className="text-xs bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                            ✓ Added
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {sugg.dosage} • {sugg.frequency}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {sugg.description}
                      </div>
                    </div>
                    {!alreadyAdded && (
                      <button
                        onClick={() => addSuggestedSupplement(sugg)}
                        disabled={addingSupp === sugg.name}
                        className="flex-shrink-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-all disabled:opacity-50"
                        title="Add to my supplements"
                      >
                        {addingSupp === sugg.name ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              + Add a custom supplement not listed here
            </button>
          </div>
        </div>
      )}

      {/* Show Suggestions Button (when hidden and user has supplements) */}
      {!showSuggestions && supplements.length > 0 && (
        <button
          onClick={() => setShowSuggestions(true)}
          className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
        >
          ✨ View Supplement Suggestions
        </button>
      )}

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
                <div className="flex items-center gap-1">
                  {/* Edit button */}
                  <button
                    onClick={() => startEditSupplement(supp)}
                    className="text-slate-400 hover:text-emerald-600 p-2"
                    title="Edit supplement"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {/* Delete button */}
                  {!supp.is_global && (
                    <button
                      onClick={() => deleteSupplement(supp.id)}
                      className="text-red-400 hover:text-red-600 p-2"
                      title="Delete supplement"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
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

      {/* Edit Supplement Modal */}
      {editingSupplement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Edit Supplement
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={editValues.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Vitamin D3"
                />
              </div>
              
              <div>
                <label className="label">Dosage / Amount</label>
                <input
                  type="text"
                  value={editValues.dosage}
                  onChange={(e) => setEditValues({ ...editValues, dosage: e.target.value })}
                  className="input"
                  placeholder="e.g., 5000 IU, 500mg, 2 capsules"
                />
              </div>
              
              <div>
                <label className="label">Frequency</label>
                <input
                  type="text"
                  value={editValues.frequency}
                  onChange={(e) => setEditValues({ ...editValues, frequency: e.target.value })}
                  className="input"
                  placeholder="e.g., Once daily, 2x daily"
                />
              </div>
              
              <div>
                <label className="label">Timing Notes</label>
                <input
                  type="text"
                  value={editValues.timingNotes}
                  onChange={(e) => setEditValues({ ...editValues, timingNotes: e.target.value })}
                  className="input"
                  placeholder="e.g., With breakfast, before bed"
                />
              </div>
              
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  value={editValues.description}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Notes about this supplement..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingSupplement(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={saveEditSupplement}
                className="btn-primary flex-1"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
