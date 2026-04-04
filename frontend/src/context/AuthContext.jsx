import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('studybuddy_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData, token, isNewUser = false) => {
    setCurrentUser(userData);
    localStorage.setItem('studybuddy_user', JSON.stringify(userData));
    localStorage.setItem('studybuddy_token', token);
    if (isNewUser) {
      localStorage.setItem('studybuddy_new_user', 'true');
    }
  };

  const logout = () => {
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
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated, isNewUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth  = () => useContext(AuthContext);