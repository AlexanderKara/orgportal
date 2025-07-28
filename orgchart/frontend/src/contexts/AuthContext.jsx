import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default function AuthProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isCheckingRef = useRef(false);
  const hasCheckedRef = useRef(false);
  const lastCheckRef = useRef(0);

  // Загружаем кэшированные данные при инициализации
  useEffect(() => {
    try {
      const cachedAuth = localStorage.getItem('auth_context_cache');
      if (cachedAuth) {
        const parsed = JSON.parse(cachedAuth);
        const now = Date.now();
        const age = now - parsed.timestamp;
        
        // Кэш действителен 10 минут
        if (age < 600000) {
          setUserData(parsed.userData);
          setIsAuthenticated(parsed.isAuthenticated);
          hasCheckedRef.current = true;
          setLoading(false);
        } else {
          localStorage.removeItem('auth_context_cache');
        }
      }
    } catch (error) {
      console.warn('Error loading cached auth data:', error);
    }
  }, []);

  const checkAuth = async (force = false) => {
    // Защита от множественных одновременных вызовов
    if (isCheckingRef.current) {
      return;
    }
    
    // Защита от повторных проверок после успешной авторизации
    if (!force && hasCheckedRef.current && isAuthenticated !== null) {
      return;
    }
    
    // Защита от слишком частых запросов - увеличиваем до 5 минут
    const now = Date.now();
    if (!force && (now - lastCheckRef.current) < 300000) { // 5 минут между проверками
      return;
    }
    
    lastCheckRef.current = now;
    isCheckingRef.current = true;
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setUserData(null);
        setError(null);
        hasCheckedRef.current = true;
        localStorage.removeItem('auth_context_cache');
        return;
      }

      // Проверяем токен через API с кэшированием
      const response = await api.getMe();
      const employee = response.employee || response;
      setUserData(employee);
      setIsAuthenticated(true);
      setError(null);
      hasCheckedRef.current = true;
      
      // Сохраняем в кэш
      try {
        localStorage.setItem('auth_context_cache', JSON.stringify({
          userData: employee,
          isAuthenticated: true,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Error saving auth cache:', error);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      
      // При сетевых ошибках не сбрасываем состояние, если у нас есть токен
      if (error.status === 0 || error.status === 429) {
        setError('Ошибка сети, попробуйте позже');
        // Не сбрасываем состояние при сетевых ошибках
      } else {
        setError('Ошибка проверки авторизации');
        setIsAuthenticated(false);
        setUserData(null);
        // Очищаем кэш при ошибке авторизации
        localStorage.removeItem('auth_context_cache');
      }
      hasCheckedRef.current = true;
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('auth_context_cache');
    setUserData(null);
    setIsAuthenticated(false);
    hasCheckedRef.current = false;
    setError(null);
  };

  const login = async (token, userData = null) => {
    localStorage.setItem('token', token);
    
    // Если данные пользователя не переданы, загружаем их
    if (!userData) {
      try {
        const response = await api.getMe();
        userData = response.employee || response;
      } catch (error) {
        console.error('Error loading user data:', error);
        // Если не удалось загрузить данные, устанавливаем базовое состояние
        setUserData(null);
        setIsAuthenticated(true);
        hasCheckedRef.current = true;
        setError(null);
        return;
      }
    }
    
    setUserData(userData);
    setIsAuthenticated(true);
    hasCheckedRef.current = true;
    setError(null);
    
    // Сохраняем в кэш
    try {
      localStorage.setItem('auth_context_cache', JSON.stringify({
        userData,
        isAuthenticated: true,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Error saving auth cache:', error);
    }
  };

  // Только одна проверка при монтировании
  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    userData,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 