import { useEffect, useState } from 'react';
import { users } from '../services/api';
import { formatWeight } from '../utils/format';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  height_cm: number | null;
  fitness_goal: string | null;
  experience_level: string | null;
  current_weight: number | null;
  created_at: string;
}

const FITNESS_GOALS = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'improve_endurance', label: 'Improve Endurance' },
  { value: 'general_fitness', label: 'General Fitness' },
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner (< 1 year)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'advanced', label: 'Advanced (3+ years)' },
];

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [form, setForm] = useState({
    displayName: '',
    heightCm: '',
    weight: '',
    fitnessGoal: '',
    experienceLevel: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await users.getProfile();
      setProfile(res.data);
      setForm({
        displayName: res.data.display_name || '',
        heightCm: res.data.height_cm?.toString() || '',
        weight: res.data.current_weight?.toString() || '',
        fitnessGoal: res.data.fitness_goal || '',
        experienceLevel: res.data.experience_level || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await users.updateProfile({
        displayName: form.displayName || undefined,
        heightCm: form.heightCm ? parseFloat(form.heightCm) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        fitnessGoal: form.fitnessGoal || undefined,
        experienceLevel: form.experienceLevel || undefined,
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      fetchProfile();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg"></div>
        <div className="h-96 skeleton rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account and fitness preferences</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="input bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="label">Username</label>
              <input
                type="text"
                value={profile?.username || ''}
                disabled
                className="input bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="label">Display Name</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="input"
                placeholder="How you want to be called"
              />
            </div>
          </div>
        </div>

        {/* Body Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Body Stats</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Height (cm)</label>
              <input
                type="number"
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                className="input"
                placeholder="175"
              />
            </div>

            <div>
              <label className="label">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="input"
                placeholder="75"
              />
              {profile?.current_weight && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Last recorded: {formatWeight(profile.current_weight)} kg
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Fitness Profile */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Fitness Profile</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Fitness Goal</label>
              <select
                value={form.fitnessGoal}
                onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}
                className="input"
              >
                <option value="">Select a goal...</option>
                {FITNESS_GOALS.map(goal => (
                  <option key={goal.value} value={goal.value}>{goal.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Experience Level</label>
              <select
                value={form.experienceLevel}
                onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                className="input"
              >
                <option value="">Select your experience...</option>
                {EXPERIENCE_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Member Since */}
        <div className="card bg-slate-50 dark:bg-slate-800/50">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
