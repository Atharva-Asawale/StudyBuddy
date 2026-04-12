import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const DASHBOARD_CACHE_KEY = 'studybuddy_dashboard_cache';
const SWOT_CACHE_KEY = 'studybuddy_swot_cache';
const DEBT_CACHE_KEY = 'studybuddy_debt_cache';

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

  const clearAnalyticsCache = () => {
    setCachedDashboardData(null);
    setCachedSwotData(null);
    setCachedDebtData(null);
    sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
    sessionStorage.removeItem(SWOT_CACHE_KEY);
    sessionStorage.removeItem(DEBT_CACHE_KEY);
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

  const login = (userData, token, isNewUser = false) => {
    clearAnalyticsCache();
    setCurrentUser(userData);
    localStorage.setItem('studybuddy_user', JSON.stringify(userData));
    localStorage.setItem('studybuddy_token', token);
    if (isNewUser) {
      localStorage.setItem('studybuddy_new_user', 'true');
    }
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

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated,
      isNewUser,
      cachedDashboardData,
      cachedSwotData,
      cachedDebtData,
      cacheDashboardData,
      cacheSwotData,
      cacheDebtData,
      clearAnalyticsCache,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth  = () => useContext(AuthContext);
