"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [employerData, setEmployerData] = useState(null);
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const employerId = localStorage.getItem('employerId');

      if (!token || !employerId) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Verify token with server
      const response = await fetch('https://toc-bac-1.onrender.com/api/auth/verify-employer-token', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setEmployerData(data.employer);
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('employerId');
        setIsAuthenticated(false);
        setEmployerData(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setEmployerData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token, employerId, employer) => {
    localStorage.setItem('token', token);
    localStorage.setItem('employerId', employerId);
    setIsAuthenticated(true);
    setEmployerData(employer);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employerId');
    localStorage.removeItem('companyProfile');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setEmployerData(null);
    setUserData(null);
    router.push('/?view=employerlogin');
  };

  // Candidate authentication functions
  const markLoggedIn = (email, userId) => {
    localStorage.setItem('userId', userId);
    setUserData({ email, userId });
    setIsAuthenticated(true);
  };

  const markSignedUp = (email) => {
    setUserData({ email });
    // Don't set isAuthenticated to true yet - user needs to complete profile setup first
    setIsAuthenticated(false);
  };

  const markProfileSetupCompleted = () => {
    // After profile setup is completed, redirect to login
    setUserData(null); // Clear user data to allow fresh login
    setIsAuthenticated(false);
    router.push('/?view=login');
  };

  const value = {
    isAuthenticated,
    isLoading,
    employerData,
    userData,
    login,
    logout,
    checkAuthStatus,
    markLoggedIn,
    markSignedUp,
    markProfileSetupCompleted,
    // For ProtectedRoute compatibility
    signedUp: !!userData,
    loggedIn: isAuthenticated && !!userData?.userId
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
