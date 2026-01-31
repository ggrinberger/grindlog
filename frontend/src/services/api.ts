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

export default api;
