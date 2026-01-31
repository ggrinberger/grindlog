import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { onboarding } from './services/api';
import Layout from './components/Layout';
import OnboardingWizard from './components/OnboardingWizard';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import WeeklyPlan from './pages/WeeklyPlan';
import Routines from './pages/Routines';
import Cardio from './pages/Cardio';
import Nutrition from './pages/Nutrition';
import Supplements from './pages/Supplements';
import Diet from './pages/Diet';
import Progress from './pages/Progress';
import Groups from './pages/Groups';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" />;
}

function AppContent() {
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkOnboardingStatus();
    } else {
      setCheckingOnboarding(false);
    }
  }, [isAuthenticated, user]);

  const checkOnboardingStatus = async () => {
    try {
      const { data } = await onboarding.getStatus();
      if (!data.onboarding_completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    updateUser({ onboardingCompleted: true });
  };

  if (checkingOnboarding && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="weekly-plan" element={<WeeklyPlan />} />
          <Route path="routines" element={<Routines />} />
          <Route path="cardio" element={<Cardio />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="supplements" element={<Supplements />} />
          <Route path="diet" element={<Diet />} />
          <Route path="progress" element={<Progress />} />
          <Route path="groups" element={<Groups />} />
          <Route path="profile" element={<Profile />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return <AppContent />;
}
