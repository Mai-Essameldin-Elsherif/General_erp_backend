import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const DEFAULT_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGUzOTAxZS1jNTIyLTQzZTMtYmMwYi01ZDc0NWNkZjViZGQiLCJlbWFpbCI6ImFkbWluM0BlcnAuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkyNTk1NDE0LCJleHAiOjE3OTI2ODE4MTR9.my-1Az_WXTwz6CFOUrDw-aHrW_SM2qXpYuHcADuQwIA';

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
