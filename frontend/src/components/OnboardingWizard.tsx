import { useState } from 'react';
import { onboarding } from '../services/api';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FITNESS_GOALS = [
  { value: 'lose_weight', label: 'Lose Weight', icon: '🔥' },
  { value: 'build_muscle', label: 'Build Muscle', icon: '💪' },
  { value: 'get_fit', label: 'Get Fit & Healthy', icon: '❤️' },
  { value: 'gain_strength', label: 'Gain Strength', icon: '🏋️' },
  { value: 'improve_endurance', label: 'Improve Endurance', icon: '🏃' },
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'New to fitness' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-3 years of training' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years of training' },
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Basic info
  const [heightCm, setHeightCm] = useState('');
  const [weight, setWeight] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  
  // Step 2: Weekly schedule
  const [schedule, setSchedule] = useState<{ [key: number]: { name: string; isRestDay: boolean } }>({});
  
  // Step 3: AI preference
  const [wantAiWorkout, setWantAiWorkout] = useState<boolean | null>(null);
  const [wantAiMenu, setWantAiMenu] = useState<boolean | null>(null);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await onboarding.saveProfile({
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        fitnessGoal,
        experienceLevel,
      });
      setStep(2);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    setLoading(true);
    try {
      for (const [day, data] of Object.entries(schedule)) {
        await onboarding.setScheduleDay({
          dayOfWeek: parseInt(day),
          name: data.name,
          isRestDay: data.isRestDay,
        });
      }
      setStep(3);
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Request AI recommendations if wanted
      if (wantAiWorkout) {
        await onboarding.requestAiRecommendation('workout');
      }
      if (wantAiMenu) {
        await onboarding.requestAiRecommendation('diet');
      }
      
      await onboarding.complete({
        workoutsSetup: Object.keys(schedule).length > 0,
        menuSetup: false,
      });
      
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateScheduleDay = (day: number, name: string, isRestDay: boolean) => {
    if (!name && !isRestDay) {
      const newSchedule = { ...schedule };
      delete newSchedule[day];
      setSchedule(newSchedule);
    } else {
      setSchedule({ ...schedule, [day]: { name, isRestDay } });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Progress bar */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Step {step} of 3</span>
            <span className="text-sm text-slate-400">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">👋</div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome to GrindLog!</h2>
                <p className="text-slate-500 mt-1">Let's set up your profile</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="input"
                    placeholder="175"
                  />
                </div>
                <div>
                  <label className="label">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="input"
                    placeholder="70"
                  />
                </div>
              </div>

              <div>
                <label className="label">What's your fitness goal?</label>
                <div className="grid grid-cols-1 gap-2">
                  {FITNESS_GOALS.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setFitnessGoal(goal.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        fitnessGoal === goal.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="mr-2">{goal.icon}</span>
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Experience level</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setExperienceLevel(level.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        experienceLevel === level.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{level.label}</div>
                      <div className="text-xs text-slate-500">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading || !fitnessGoal || !experienceLevel}
                className="w-full btn-primary"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 2: Weekly Schedule */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">📅</div>
                <h2 className="text-2xl font-bold text-slate-900">Weekly Schedule</h2>
                <p className="text-slate-500 mt-1">Plan your training week</p>
              </div>

              <div className="space-y-3">
                {DAYS.map((day, index) => (
                  <div key={day} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-24 font-medium text-slate-700">{day}</div>
                    <input
                      type="text"
                      placeholder={schedule[index]?.isRestDay ? 'Rest Day' : 'e.g., Push Day, Leg Day'}
                      value={schedule[index]?.name || ''}
                      onChange={(e) => updateScheduleDay(index, e.target.value, schedule[index]?.isRestDay || false)}
                      disabled={schedule[index]?.isRestDay}
                      className="input flex-1 !py-2"
                    />
                    <button
                      onClick={() => updateScheduleDay(index, 'Rest', !schedule[index]?.isRestDay)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        schedule[index]?.isRestDay
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      😴 Rest
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 btn-secondary">
                  Back
                </button>
                <button onClick={handleSaveSchedule} disabled={loading} className="flex-1 btn-primary">
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: AI Recommendations */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🤖</div>
                <h2 className="text-2xl font-bold text-slate-900">AI Assistance</h2>
                <p className="text-slate-500 mt-1">Would you like AI-powered recommendations?</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 border-2 border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-slate-900">🏋️ Workout Plan</div>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">
                    {Object.keys(schedule).length > 0
                      ? 'Want AI to review your schedule and suggest improvements?'
                      : 'Want AI to create a personalized workout plan based on your goals?'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWantAiWorkout(true)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        wantAiWorkout === true
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                          : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                      }`}
                    >
                      Yes please!
                    </button>
                    <button
                      onClick={() => setWantAiWorkout(false)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        wantAiWorkout === false
                          ? 'bg-slate-200 text-slate-700 border-2 border-slate-400'
                          : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                      }`}
                    >
                      No thanks
                    </button>
                  </div>
                </div>

                <div className="p-4 border-2 border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-slate-900">🥗 Nutrition Plan</div>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">
                    Want AI to create a personalized meal plan based on your goals?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWantAiMenu(true)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        wantAiMenu === true
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                          : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                      }`}
                    >
                      Yes please!
                    </button>
                    <button
                      onClick={() => setWantAiMenu(false)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        wantAiMenu === false
                          ? 'bg-slate-200 text-slate-700 border-2 border-slate-400'
                          : 'bg-slate-100 text-slate-600 border-2 border-transparent'
                      }`}
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 btn-secondary">
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading || wantAiWorkout === null || wantAiMenu === null}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'Finishing...' : 'Get Started! 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
