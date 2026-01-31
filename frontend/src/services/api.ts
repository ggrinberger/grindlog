import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; username: string; displayName?: string }) =>
    api.post('/auth/register', data),
};

// Users
export const users = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: { displayName?: string; avatarUrl?: string }) =>
    api.patch('/users/me', data),
  getProfile: () => api.get('/users/me/profile'),
  updateProfile: (data: { displayName?: string; avatarUrl?: string; heightCm?: number; fitnessGoal?: string; experienceLevel?: string; weight?: number }) =>
    api.patch('/users/me/profile', data),
};

// Workouts
export const workouts = {
  getExercises: () => api.get('/workouts/exercises'),
  createExercise: (data: { name: string; category: string; muscleGroup?: string; isCardio?: boolean }) =>
    api.post('/workouts/exercises', data),
  getPlans: () => api.get('/workouts/plans'),
  createPlan: (data: { name: string; description?: string; exercises?: unknown[] }) =>
    api.post('/workouts/plans', data),
  getSessions: (limit = 20, offset = 0) =>
    api.get('/workouts/sessions', { params: { limit, offset } }),
  startSession: (data: { planId?: string; name?: string }) =>
    api.post('/workouts/sessions', data),
  logExercise: (sessionId: string, data: unknown) =>
    api.post(`/workouts/sessions/${sessionId}/log`, data),
  endSession: (sessionId: string) =>
    api.patch(`/workouts/sessions/${sessionId}/end`),
  getCardio: (limit = 20, offset = 0) =>
    api.get('/workouts/cardio', { params: { limit, offset } }),
  logCardio: (data: unknown) =>
    api.post('/workouts/cardio', data),
};

// Diet
export const diet = {
  getFoods: (search?: string) =>
    api.get('/diet/foods', { params: { search } }),
  createFood: (data: unknown) =>
    api.post('/diet/foods', data),
  logFood: (data: unknown) =>
    api.post('/diet/log', data),
  getLogs: (startDate?: string, endDate?: string) =>
    api.get('/diet/log', { params: { startDate, endDate } }),
  getSummary: (date?: string) =>
    api.get('/diet/summary', { params: { date } }),
  getSupplements: () => api.get('/diet/supplements'),
  logSupplement: (data: { supplementId: string; dosage: string }) =>
    api.post('/diet/supplements/log', data),
};

// Progress
export const progress = {
  logMeasurements: (data: unknown) =>
    api.post('/progress/measurements', data),
  getMeasurements: (limit = 30) =>
    api.get('/progress/measurements', { params: { limit } }),
  getGoals: () => api.get('/progress/goals'),
  createGoal: (data: unknown) =>
    api.post('/progress/goals', data),
  updateGoal: (goalId: string, data: unknown) =>
    api.patch(`/progress/goals/${goalId}`, data),
  getStats: (days = 30) =>
    api.get('/progress/stats', { params: { days } }),
  getExerciseProgress: (exerciseId: string, limit = 20) =>
    api.get(`/progress/exercise/${exerciseId}`, { params: { limit } }),
  logExerciseProgress: (exerciseId: string, data: { weight?: number; sets?: number; reps?: number; durationSeconds?: number; distanceMeters?: number; intervals?: number; notes?: string }) =>
    api.post(`/progress/exercise/${exerciseId}/log`, data),
  getExerciseHistory: (exerciseId: string, days = 90) =>
    api.get(`/progress/exercise/${exerciseId}/history`, { params: { days } }),
  getExercisesOverview: () =>
    api.get('/progress/exercises/overview'),
};

// Groups
export const groups = {
  getMyGroups: () => api.get('/groups'),
  create: (data: { name: string; description?: string; isPrivate?: boolean }) =>
    api.post('/groups', data),
  getGroup: (groupId: string) => api.get(`/groups/${groupId}`),
  getMembers: (groupId: string) => api.get(`/groups/${groupId}/members`),
  join: (groupId: string) => api.post(`/groups/${groupId}/join`),
  leave: (groupId: string) => api.post(`/groups/${groupId}/leave`),
  updateSharing: (groupId: string, data: unknown) =>
    api.patch(`/groups/${groupId}/sharing`, data),
  getFeed: (groupId: string, limit = 20) =>
    api.get(`/groups/${groupId}/feed`, { params: { limit } }),
  search: (q: string) => api.get('/groups/search/public', { params: { q } }),
};

// Admin
export const admin = {
  getStats: () => api.get('/admin/stats'),
  getGrowth: (days = 30) => api.get('/admin/stats/growth', { params: { days } }),
  getActivity: (days = 30) => api.get('/admin/stats/activity', { params: { days } }),
  getUsers: (limit = 50, offset = 0, search?: string) =>
    api.get('/admin/users', { params: { limit, offset, search } }),
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  getGroups: (limit = 50, offset = 0) =>
    api.get('/admin/groups', { params: { limit, offset } }),
  getPopularExercises: () => api.get('/admin/stats/exercises'),
  getHealth: () => api.get('/admin/health'),
};

// Workout Templates
export const templates = {
  getAll: () => api.get('/templates'),
  getByDay: (dayOfWeek: number) => api.get(`/templates/day/${dayOfWeek}`),
  getWeekly: () => api.get('/templates/weekly'),
  create: (data: { dayOfWeek: number; dayName: string; section?: string; exercise: string; setsReps?: string; intensity?: string; restSeconds?: string; notes?: string; orderIndex?: number }) =>
    api.post('/templates', data),
  update: (id: string, data: unknown) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
};

// Routines
export const routines = {
  getAll: (type?: 'morning' | 'evening') => api.get('/routines', { params: { type } }),
  getById: (id: string) => api.get(`/routines/${id}`),
  create: (data: { name: string; type: 'morning' | 'evening'; description?: string; totalDurationMinutes?: number; items: unknown[] }) =>
    api.post('/routines', data),
  update: (id: string, data: unknown) => api.put(`/routines/${id}`, data),
  complete: (routineId: string, data: { itemsCompleted?: string[]; notes?: string }) =>
    api.post(`/routines/${routineId}/complete`, data),
  getHistory: (limit?: number, offset?: number, startDate?: string, endDate?: string) =>
    api.get('/routines/completions/history', { params: { limit, offset, startDate, endDate } }),
  getTodayStatus: () => api.get('/routines/completions/today'),
};

// Cardio Protocols
export const cardio = {
  getProtocols: () => api.get('/cardio/protocols'),
  getProtocol: (id: string) => api.get(`/cardio/protocols/${id}`),
  createProtocol: (data: { name: string; modality?: string; description?: string; totalMinutes?: number; frequency?: string; hrZoneTarget?: string; instructions?: string; scienceNotes?: string }) =>
    api.post('/cardio/protocols', data),
  updateProtocol: (id: string, data: unknown) => api.put(`/cardio/protocols/${id}`, data),
  logSession: (data: { protocolId: string; durationMinutes?: number; avgHeartRate?: number; maxHeartRate?: number; caloriesBurned?: number; notes?: string }) =>
    api.post('/cardio/log', data),
  getLogs: (limit?: number, offset?: number, startDate?: string, endDate?: string, protocolId?: string) =>
    api.get('/cardio/logs', { params: { limit, offset, startDate, endDate, protocolId } }),
  getWeeklySummary: () => api.get('/cardio/summary/weekly'),
};

// Nutrition (Enhanced)
export const nutrition = {
  getTargets: () => api.get('/nutrition/targets'),
  setTargets: (data: { dailyCalories?: number; proteinG?: number; carbsG?: number; fatG?: number }) =>
    api.put('/nutrition/targets', data),
  logMeal: (data: { mealType: string; items?: unknown[]; notes?: string; loggedAt?: string }) =>
    api.post('/nutrition/meals', data),
  getMeals: (date?: string) => api.get('/nutrition/meals', { params: { date } }),
  getMeal: (id: string) => api.get(`/nutrition/meals/${id}`),
  updateMeal: (id: string, data: unknown) => api.put(`/nutrition/meals/${id}`, data),
  deleteMeal: (id: string) => api.delete(`/nutrition/meals/${id}`),
  getDailySummary: (date?: string) => api.get('/nutrition/summary/daily', { params: { date } }),
  getWeeklySummary: () => api.get('/nutrition/summary/weekly'),
};

// Supplements (Enhanced)
export const supplements = {
  getAll: () => api.get('/supplements'),
  getById: (id: string) => api.get(`/supplements/${id}`),
  create: (data: { name: string; dosage?: string; frequency?: string; timingNotes?: string; description?: string }) =>
    api.post('/supplements', data),
  update: (id: string, data: unknown) => api.put(`/supplements/${id}`, data),
  delete: (id: string) => api.delete(`/supplements/${id}`),
  log: (supplementId: string, data?: { notes?: string; takenAt?: string }) =>
    api.post(`/supplements/${supplementId}/log`, data || {}),
  getHistory: (limit?: number, offset?: number, startDate?: string, endDate?: string, supplementId?: string) =>
    api.get('/supplements/logs/history', { params: { limit, offset, startDate, endDate, supplementId } }),
  getTodayStatus: () => api.get('/supplements/logs/today'),
  deleteLog: (logId: string) => api.delete(`/supplements/logs/${logId}`),
};

// Onboarding
export const onboarding = {
  getStatus: () => api.get('/onboarding/status'),
  saveProfile: (data: { heightCm?: number; weight?: number; fitnessGoal?: string; experienceLevel?: string }) =>
    api.post('/onboarding/profile', data),
  complete: (data: { workoutsSetup?: boolean; menuSetup?: boolean }) =>
    api.post('/onboarding/complete', data),
  getSchedule: () => api.get('/onboarding/schedule'),
  getFullSchedule: () => api.get('/onboarding/schedule/full'),
  setScheduleDay: (data: { dayOfWeek: number; name: string; planId?: string; isRestDay?: boolean; notes?: string }) =>
    api.post('/onboarding/schedule', data),
  deleteScheduleDay: (dayOfWeek: number) =>
    api.delete(`/onboarding/schedule/${dayOfWeek}`),
  getDayExercises: (dayOfWeek: number) =>
    api.get(`/onboarding/schedule/${dayOfWeek}/exercises`),
  addDayExercise: (dayOfWeek: number, data: { exerciseId: string; sets?: number; reps?: number; weight?: number; durationSeconds?: number; intervals?: number; restSeconds?: number; notes?: string }) =>
    api.post(`/onboarding/schedule/${dayOfWeek}/exercises`, data),
  updateDayExercise: (exerciseEntryId: string, data: { sets?: number; reps?: number; weight?: number; durationSeconds?: number; intervals?: number; restSeconds?: number; notes?: string }) =>
    api.patch(`/onboarding/schedule/exercises/${exerciseEntryId}`, data),
  removeDayExercise: (exerciseEntryId: string) =>
    api.delete(`/onboarding/schedule/exercises/${exerciseEntryId}`),
  reorderDayExercises: (dayOfWeek: number, exerciseIds: string[]) =>
    api.patch(`/onboarding/schedule/${dayOfWeek}/reorder`, { exerciseIds }),
  requestAiRecommendation: (type: string, existingData?: unknown) =>
    api.post('/onboarding/ai-recommend', { type, existingData }),
};

export default api;
