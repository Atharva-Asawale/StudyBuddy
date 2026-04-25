import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const DASHBOARD_CACHE_KEY = 'studybuddy_dashboard_cache';
const SWOT_CACHE_KEY = 'studybuddy_swot_cache';
const DEBT_CACHE_KEY = 'studybuddy_debt_cache';
const SYLLABUS_CACHE_KEY = 'studybuddy_syllabus_cache';
const SEMESTERS_CACHE_KEY = 'studybuddy_semesters_cache';
const ADMIN_STATS_CACHE_KEY = 'studybuddy_admin_stats_cache';
const ADMIN_STUDENTS_CACHE_KEY = 'studybuddy_admin_students_cache';
const ADMIN_WEAK_TOPICS_CACHE_KEY = 'studybuddy_admin_weak_topics_cache';

const readSessionCache = (key) => {
  const stored = sessionStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
};

const writeSessionCache = (key, value) => {
  if (value === null || value === undefined) {
    sessionStorage.removeItem(key);
    return;
  }

  sessionStorage.setItem(key, JSON.stringify(value));
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('studybuddy_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [cachedDashboardData, setCachedDashboardData] = useState(() => readSessionCache(DASHBOARD_CACHE_KEY));
  const [cachedSwotData, setCachedSwotData] = useState(() => readSessionCache(SWOT_CACHE_KEY));
  const [cachedDebtData, setCachedDebtData] = useState(() => readSessionCache(DEBT_CACHE_KEY));
  const [cachedSyllabusData, setCachedSyllabusData] = useState(() => readSessionCache(SYLLABUS_CACHE_KEY));
  const [cachedSemestersData, setCachedSemestersData] = useState(() => readSessionCache(SEMESTERS_CACHE_KEY));
  const [cachedAdminStats, setCachedAdminStats] = useState(() => readSessionCache(ADMIN_STATS_CACHE_KEY));
  const [cachedAdminStudents, setCachedAdminStudents] = useState(() => readSessionCache(ADMIN_STUDENTS_CACHE_KEY));
  const [cachedWeakTopics, setCachedWeakTopics] = useState(() => readSessionCache(ADMIN_WEAK_TOPICS_CACHE_KEY));

  const clearAnalyticsCache = () => {
    setCachedDashboardData(null);
    setCachedSwotData(null);
    setCachedDebtData(null);
    setCachedSyllabusData(null);
    setCachedSemestersData(null);
    setCachedAdminStats(null);
    setCachedAdminStudents(null);
    setCachedWeakTopics(null);
    sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
    sessionStorage.removeItem(SWOT_CACHE_KEY);
    sessionStorage.removeItem(DEBT_CACHE_KEY);
    sessionStorage.removeItem(SYLLABUS_CACHE_KEY);
    sessionStorage.removeItem(SEMESTERS_CACHE_KEY);
    sessionStorage.removeItem(ADMIN_STATS_CACHE_KEY);
    sessionStorage.removeItem(ADMIN_STUDENTS_CACHE_KEY);
    sessionStorage.removeItem(ADMIN_WEAK_TOPICS_CACHE_KEY);
    sessionStorage.removeItem('studybuddy_quiz_results');
  };

  const cacheDashboardData = (data) => {
    setCachedDashboardData(data);
    writeSessionCache(DASHBOARD_CACHE_KEY, data);
  };

  const cacheSwotData = (data) => {
    setCachedSwotData(data);
    writeSessionCache(SWOT_CACHE_KEY, data);
  };

  const cacheDebtData = (data) => {
    setCachedDebtData(data);
    writeSessionCache(DEBT_CACHE_KEY, data);
  };

  const cacheSyllabusData = (data) => {
    setCachedSyllabusData(data);
    writeSessionCache(SYLLABUS_CACHE_KEY, data);
  };

  const cacheSemestersData = (data) => {
    setCachedSemestersData(data);
    writeSessionCache(SEMESTERS_CACHE_KEY, data);
  };

  const cacheAdminStats = (data) => {
    setCachedAdminStats(data);
    writeSessionCache(ADMIN_STATS_CACHE_KEY, data);
  };

  const cacheAdminStudents = (data) => {
    setCachedAdminStudents(data);
    writeSessionCache(ADMIN_STUDENTS_CACHE_KEY, data);
  };

  const cacheWeakTopics = (data) => {
    setCachedWeakTopics(data);
    writeSessionCache(ADMIN_WEAK_TOPICS_CACHE_KEY, data);
  };

  const login = (userData, token, isNewUser = false) => {
    clearAnalyticsCache();
    setCurrentUser(userData);
    localStorage.setItem('studybuddy_user', JSON.stringify(userData));
    localStorage.setItem('studybuddy_token', token);
    if (isNewUser) {
      localStorage.setItem('studybuddy_new_user', 'true');
    }
  };
  const updateUser = (updatedFields) => {
    const updated = { ...currentUser, ...updatedFields };
    setCurrentUser(updated);
    localStorage.setItem('studybuddy_user', JSON.stringify(updated));
  };
  const logout = () => {
    clearAnalyticsCache();
    setCurrentUser(null);
    localStorage.removeItem('studybuddy_user');
    localStorage.removeItem('studybuddy_token');
    localStorage.removeItem('studybuddy_new_user');
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('studybuddy_token');
  };

  const isNewUser = () => {
    return localStorage.getItem('studybuddy_new_user') === 'true';
  };

  const isAdmin = () => {
    return currentUser?.role === 'ADMIN';
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated,
      isNewUser,
      isAdmin,
      updateUser,
      cachedDashboardData,
      cachedSwotData,
      cachedDebtData,
      cachedSyllabusData,
      cachedSemestersData,
      cacheDashboardData,
      cacheSwotData,
      cacheDebtData,
      cacheSyllabusData,
      cacheSemestersData,
      cachedAdminStats,
      cachedAdminStudents,
      cachedWeakTopics,
      cacheAdminStats,
      cacheAdminStudents,
      cacheWeakTopics,
      clearAnalyticsCache,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
