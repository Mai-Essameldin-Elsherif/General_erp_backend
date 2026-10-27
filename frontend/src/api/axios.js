import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const DEFAULT_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzQyYmRmYy03ZWIzLTRlMGItYmM3YS04NGNjMWRkM2UyN2MiLCJlbWFpbCI6ImFkbWluQGVycC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTI5NDk3OTYsImV4cCI6MTc5MzAzNjE5Nn0.PL3_O9jTAiVP7DFflNLvItgOe7iF407h8hKTF4L9_OY';

// ── Request interceptor — inject Bearer token automatically ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || DEFAULT_ADMIN_TOKEN;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't clear credentials or redirect if the request was the login call itself
      if (!url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
