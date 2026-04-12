import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
});

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

export const syllabusService = {
  getTree: () => API.get('/api/syllabus'),
  addCustomNode: (data) => API.post('/api/syllabus/custom', data),
  editCustomNode: (id, data) => API.put(`/api/syllabus/custom/${id}`, data),
  deleteCustomNode: (id) => API.delete(`/api/syllabus/custom/${id}`),
};

export const debtService = {
  getDebt: () => API.get('/api/debt'),
};

export const quizService = {
  generate: (topicId) => API.get(`/api/quiz/generate/${topicId}`),
  submit: (data) => API.post('/api/quiz/submit', data),
};

export const studentService = {
  getDashboard: () => API.get('/api/student/dashboard'),
  getSwot: () => API.get('/api/student/swot'),
};

export default API;
