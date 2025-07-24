import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAuth = true, requireAdmin = false }) {
  const { isAuthenticated, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Если требуется авторизация, но пользователь не авторизован
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/home/hello" replace />;
  }

  // Проверяем административные права
  if (requireAdmin && userData) {
    const hasAdminAccess = userData.adminRoles && userData.adminRoles.length > 0;
    
    if (!hasAdminAccess) {
      return <Navigate to="/home/hello" replace />;
    }
  }

  if (!requireAuth && isAuthenticated) {
    // Если пользователь авторизован и пытается зайти на публичную страницу
    // Перенаправляем на дашборд
    return <Navigate to="/home/hello" replace />;
  }

  return children;
} 