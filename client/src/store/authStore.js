import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('agentflow_token');
    const storedUser = localStorage.getItem('agentflow_user');

    if (token) {
      try {
        set({ token, user: storedUser ? JSON.parse(storedUser) : null, isAuthenticated: true });
        const res = await api.get('/auth/me');
        if (res.data.success) {
          set({ user: res.data.data.user, isAuthenticated: true });
          localStorage.setItem('agentflow_user', JSON.stringify(res.data.data.user));
        }
      } catch (e) {
        localStorage.removeItem('agentflow_token');
        localStorage.removeItem('agentflow_user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
    set({ isLoading: false });
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user, token } = res.data.data;
      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
      return user;
    }
    throw new Error(res.data.error || 'Login failed');
  },

  register: async (name, email, password, role = 'operator') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    if (res.data.success) {
      const { user, token } = res.data.data;
      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
      return user;
    }
    throw new Error(res.data.error || 'Registration failed');
  },

  logout: () => {
    localStorage.removeItem('agentflow_token');
    localStorage.removeItem('agentflow_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
