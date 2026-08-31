import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

const API = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('studybuddy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('studybuddy_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getSemesters = () =>
  API.get('/api/semesters', {
    headers: getAuthHeaders(),
  });

export const addSemester = (data) =>
  API.post('/api/semesters', data, {
    headers: getAuthHeaders(),
  });

export const updateSemester = (id, data) =>
  API.put(`/api/semesters/${id}`, data, {
    headers: getAuthHeaders(),
  });

export const deleteSemester = (id) =>
  API.delete(`/api/semesters/${id}`, {
    headers: getAuthHeaders(),
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
  add: addSemester,
  getAll: getSemesters,
  update: updateSemester,
  delete: deleteSemester,
};

export const syllabusService = {
  getTree: (semester) => API.get(`/api/syllabus${semester ? `?semester=${semester}` : ''}`),
  addCustomNode: (data) => API.post('/api/syllabus/custom', data),
  editCustomNode: (id, data) => API.put(`/api/syllabus/custom/${id}`, data),
  deleteCustomNode: (id) => API.delete(`/api/syllabus/custom/${id}`),
};

export const debtService = {
  getGraph: () => API.get('/api/debt/graph'),
  getHierarchy: () => API.get('/api/learning-debt/graph'),
  analyzeGraph: () => API.post('/api/debt/analyze'),
};

export const resourceService = {
  getChapterResources: (chapterId) => API.get(`/api/resources/chapter/${chapterId}`),
};


export const quizService = {
  generate: (topicId, file, easy = 5, medium = 3, hard = 2) => {
    const params = { easyCount: easy, mediumCount: medium, hardCount: hard };
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      return axios.post(`${API_BASE}/api/quiz/generate/${topicId}`, formData, {
        params,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000
      });
    }
    return API.post(`/api/quiz/generate/${topicId}`, null, { params });
  },
  submit: (data) => API.post('/api/quiz/submit', data),
};

export const studentService = {
  getDashboard: () => API.get('/api/student/dashboard'),
  getSwot: () => API.get('/api/student/swot'),
  getSwotAnalysis: () => API.get('/api/swot'),
};
export const profileService = {
  get: () => {
    const token = localStorage.getItem('studybuddy_token');
    return axios.get(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  update: (data) => {
    const token = localStorage.getItem('studybuddy_token');
    return axios.put(`${API_BASE}/api/profile`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export const streakService = {
  getStreak: () => API.get('/api/streak'),
};

export const passwordResetService = {
  sendOtp: (email) => 
    axios.post(`${API_BASE}/api/auth/forgot-password`, { email }),
  
  verifyOtp: (email, otp) => 
    axios.post(`${API_BASE}/api/auth/verify-otp`, { email, otp }),
  
  resetPassword: (verificationToken, newPassword) => 
    axios.post(`${API_BASE}/api/auth/reset-password`, 
      { verificationToken, newPassword })
};

export const adminService = {
  getStats: () => API.get('/api/admin/stats'),
  getStudents: (params = {}) => API.get('/api/admin/students', { params }),
  getStudentDetail: (userId) => API.get(`/api/admin/students/${userId}`),
  getWeakTopics: () => API.get('/api/admin/weak-topics'),
  getAdmins: () => API.get('/api/admin/manage/list'),
  addAdmin: (data) => API.post('/api/admin/manage/add', data),
  deleteAdmin: (id) => API.delete(`/api/admin/manage/${id}`),
  deleteStudent: (id) => API.delete(`/api/admin/students/${id}`)
};

export const customQuizService = {
  generate: (formData) =>
    axios.post(`${API_BASE}/api/custom-test/generate-from-file`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000
    }),
  submit: (payload) =>
    API.post('/api/custom-test/submit', payload),
  getHistory: () =>
    API.get('/api/custom-test/history'),
  deleteHistory: (id) =>
    API.delete(`/api/custom-test/history/${id}`)
};

export default API;
