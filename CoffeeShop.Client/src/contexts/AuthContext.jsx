import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (err) {
      console.error('Error restoring session:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return null;
  });
  const [loading] = useState(false);

  const login = async (username, password) => {
    const res = await authApi.login({ username, password });
    if (res && res.data) {
      const { token, ...userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error('Dữ liệu đăng nhập không hợp lệ');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Staff' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isStaff, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
