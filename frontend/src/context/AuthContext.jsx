import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('dental_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token is valid on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (response.success && response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Session verify failed:', err.message);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, [token]);

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.success && response.token) {
        localStorage.setItem('dental_token', response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      }
      return response;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (name, email, password, phone) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/signup', { name, email, password, phone });
      if (response.success && response.token) {
        localStorage.setItem('dental_token', response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      }
      return response;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dental_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleGoogleLogin = async (idToken) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/google', { idToken });
      if (response.success && response.token) {
        localStorage.setItem('dental_token', response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      }
      return response;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (email, code) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-code', { email, code });
      if (response.success && response.token) {
        localStorage.setItem('dental_token', response.token);
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      }
      return response;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (email) => {
    try {
      return await api.post('/auth/resend-code', { email });
    } catch (err) {
      throw err;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      if (response.success && response.user) {
        setUser(response.user);
        return response;
      }
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        googleLogin: handleGoogleLogin,
        googleVerify: handleVerifyCode,
        googleResend: handleResendCode,
        verifyCode: handleVerifyCode,
        resendCode: handleResendCode,
        updateProfile
      }}
    >
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
