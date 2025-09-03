

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType } from '../types';
import * as api from '../services/api';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAwaiting2FA, setIsAwaiting2FA] = useState<boolean>(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const handleSuccessfulLogin = async (accessToken: string, refreshToken: string): Promise<User> => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    const userData = await api.getProfile();
    setUser(userData);
    setIsAuthenticated(true);
    setIsAdmin(userData.role === 'admin');
    setIsAwaiting2FA(false);
    setTempUserId(null);
    return userData;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await api.getProfile();
          setUser(userData);
          setIsAuthenticated(true);
          setIsAdmin(userData.role === 'admin');
        } catch (error) {
          console.error("Session check failed", error);
          logout(); // Token is invalid or expired
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setIsAwaiting2FA(false);
    try {
      const response = await api.login(email, pass);
      if ('two_factor_required' in response && response.two_factor_required) {
        setIsAwaiting2FA(true);
        setTempUserId(response.user_id);
        return { twoFactorRequired: true, userId: response.user_id };
      } else if ('access' in response) {
        await handleSuccessfulLogin(response.access, response.refresh);
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const adminLogin = async (email: string, pass: string) => {
    setIsLoading(true);
    setIsAwaiting2FA(false);
    try {
        const response = await api.login(email, pass);
        if ('two_factor_required' in response && response.two_factor_required) {
            setIsAwaiting2FA(true);
            setTempUserId(response.user_id);
            return { twoFactorRequired: true, userId: response.user_id };
        } else if ('access' in response) {
            const loggedInUser = await handleSuccessfulLogin(response.access, response.refresh);
            if (loggedInUser.role !== 'admin') {
                logout();
                throw new Error("Access denied. User is not an administrator.");
            }
        }
    } catch(error) {
        logout();
        console.error(error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  }

  const verifyTwoFactor = async (userId: string, token: string): Promise<User> => {
      setIsLoading(true);
      try {
          const response = await api.verifyTwoFactor(userId, token);
          const loggedInUser = await handleSuccessfulLogin(response.access, response.refresh);
          return loggedInUser;
      } catch (error) {
          console.error(error);
          throw error;
      } finally {
          setIsLoading(false);
      }
  }

  const signup = async (details: any): Promise<void> => {
      setIsLoading(true);
      try {
        // Backend API registers and returns a user object directly.
        // The frontend's multi-step payment flow is not supported by the backend docs.
        await api.register(details);
        // After successful registration, log the user in.
        await login(details.email, details.password);
      } catch (error) {
        console.error(error);
        throw error instanceof Error ? error : new Error('An unknown error occurred during signup.');
      } finally {
          setIsLoading(false);
      }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAwaiting2FA(false);
    setTempUserId(null);
    setIsAdmin(false);
  };
  
  const updateUser = useCallback((newUser: Partial<User>) => {
    setUser(prevUser => {
      if (prevUser) {
        return { ...prevUser, ...newUser };
      }
      return prevUser;
    });
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    isAdmin,
    login,
    adminLogin,
    verifyTwoFactor,
    isAwaiting2FA,
    logout,
    signup,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};