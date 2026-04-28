import axios from 'axios';

// In production the backend serves the frontend, so use relative URL.
// In development the proxy in package.json handles it.
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : '/api'
});

// Attach JWT to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — token expired or invalid
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const msg = err.response.data?.message || '';
      if (msg.includes('expired') || msg.includes('Invalid token') || msg.includes('No token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
