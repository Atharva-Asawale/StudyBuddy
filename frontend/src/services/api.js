import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('studybuddy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data) => API.post('/api/auth/register', data),
  login: (data) => API.post('/api/auth/login', data),
};

export const onboardingService = {
  save: (data) => API.post('/api/onboarding', data),
  checkStatus: () => API.get('/api/onboarding/status'),
};

export const semesterService = {
  add: (data) => API.post('/api/semesters', data),
  getAll: () => API.get('/api/semesters'),
  update: (id, data) => API.put(`/api/semesters/${id}`, data),
  delete: (id) => API.delete(`/api/semesters/${id}`),
};
export default API;