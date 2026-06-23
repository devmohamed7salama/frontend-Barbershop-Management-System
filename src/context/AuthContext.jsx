import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, logout as logoutApi, getCurrentUser } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          setToken(storedToken);
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Session restoration failed:", error);
          // Token is probably invalid or expired
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      
      const receivedToken = data.token || data.access_token || (data.data && data.data.token);
      const receivedUser = data.user || (data.data && data.data.user) || data;

      if (receivedToken) {
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
      }
      if (receivedUser) {
        setUser(receivedUser);
      }
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await registerApi(userData);
      
      const receivedToken = data.token || data.access_token || (data.data && data.data.token);
      const receivedUser = data.user || (data.data && data.data.user) || data;

      if (receivedToken) {
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
      }
      if (receivedUser) {
        setUser(receivedUser);
      }
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
