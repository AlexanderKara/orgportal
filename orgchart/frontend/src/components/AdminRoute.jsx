import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from './RoleProvider';
import { useAuth } from '../contexts/AuthContext';

// Move requiredPermissions outside component to prevent recreation
const REQUIRED_PERMISSIONS = ['admin'];

export default function AdminRoute({ children }) {
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { activeRole } = useRole();
  const { userData, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Функция проверки разрешений (синхронная)
  const checkPermission = (userData, permission) => {
    if (permission === 'admin') {
      return userData.adminRoles && userData.adminRoles.length > 0;
    }
    return false;
  };

  // Check admin access
  useEffect(() => {
    let isMounted = true;
    
    const checkAccess = () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        
        // Используем данные из AuthContext
        if (!userData) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        
        // Проверяем каждое разрешение синхронно
        const hasAdminAccess = checkPermission(userData, 'admin');
        
        if (!isMounted) return;
        
        if (!hasAdminAccess) {
          setAccessDenied(true);
        }
        
      } catch (error) {
        if (!isMounted) return;
        setAccessDenied(true);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Проверяем доступ только если пользователь авторизован
    if (isAuthenticated && userData) {
      checkAccess();
    } else if (isAuthenticated === false) {
      // Если пользователь не авторизован, показываем ошибку доступа
      setAccessDenied(true);
      setLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [userData, isAuthenticated]);

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have admin access
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[15px] shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-6">
            У вас нет прав для доступа к административной панели. 
            Переключитесь на административную роль в профиле.
          </p>
          <button
            onClick={() => navigate('/home/hello')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  // Render children if access is granted
  return children;
} 