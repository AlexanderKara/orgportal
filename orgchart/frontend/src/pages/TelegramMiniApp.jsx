import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const TelegramMiniApp = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employee, setEmployee] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Функция для извлечения данных пользователя из URL
  const extractUserFromUrl = () => {
    const urlParams = new URLSearchParams(location.hash.substring(1));
    const tgWebAppData = urlParams.get('tgWebAppData');
    
    if (tgWebAppData) {
      try {
        const params = new URLSearchParams(tgWebAppData);
        const userParam = params.get('user');
        if (userParam) {
          const user = JSON.parse(decodeURIComponent(userParam));
          return user;
        }
      } catch (error) {
        console.error('Error parsing user data from URL:', error);
      }
    }
    return null;
  };

  // Функция для логирования на сервер
  const logToServer = (message, data = null) => {
    const logData = {
      timestamp: new Date().toISOString(),
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    fetch('/api/logs/miniapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData)
    }).catch(() => {
      // Fallback: сохраняем в localStorage если сервер недоступен
      const logs = JSON.parse(localStorage.getItem('miniapp_logs') || '[]');
      logs.push(logData);
      localStorage.setItem('miniapp_logs', JSON.stringify(logs));
    });
  };

  const initializeTelegramApp = async () => {
    logToServer('Initializing Telegram WebApp');

    // Проверяем различные способы получения Telegram WebApp
    const tg = window.Telegram?.WebApp || window.TelegramWebApp || window.Telegram;
    
    logToServer('Telegram WebApp found', {
      hasReady: !!tg?.ready,
      hasExpand: !!tg?.expand,
      hasInitDataUnsafe: !!tg?.initDataUnsafe,
      hasInitData: !!tg?.initData,
      hasUser: !!tg?.initDataUnsafe?.user
    });

    let user = null;

    // Пытаемся получить пользователя из Telegram WebApp
    if (tg?.initDataUnsafe?.user) {
      user = tg.initDataUnsafe.user;
      logToServer('User found in initDataUnsafe', user);
    } else if (tg?.initData?.user) {
      user = tg.initData.user;
      logToServer('User found in initData', user);
    } else if (tg?.user) {
      user = tg.user;
      logToServer('User found in tg.user', user);
    } else {
      // Пытаемся извлечь из URL параметров
      user = extractUserFromUrl();
      if (user) {
        logToServer('User extracted from URL', user);
      } else {
        logToServer('No user data found in Telegram WebApp', {
          initDataUnsafe: !!tg?.initDataUnsafe,
          initData: !!tg?.initData,
          user: !!tg?.user
        });
      }
    }

    if (user && user.id) {
      try {
        const employeeData = await api.findEmployeeByTelegramId(user.id);
        if (employeeData) {
          setEmployee(employeeData);
          setLoading(false);
          logToServer('Employee found by Telegram ID', { telegramId: user.id, employeeId: employeeData.id });
        } else {
          setError('Сотрудник с таким Telegram ID не найден в системе');
          setLoading(false);
          logToServer('Employee not found by Telegram ID', { telegramId: user.id });
        }
    } catch (error) {
        setError('Ошибка при поиске сотрудника');
        setLoading(false);
        logToServer('Error finding employee', { error: error.message, telegramId: user.id });
      }
    } else {
      setError('Не удалось получить данные пользователя Telegram. Убедитесь, что приложение открыто в Telegram.');
      setLoading(false);
      logToServer('No valid user data found');
    }
  };

  useEffect(() => {
    initializeTelegramApp();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!employee) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-gray-500 text-4xl mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Сотрудник не найден</h2>
          <p className="text-gray-600">Проверьте правильность ссылки</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
            <h1 className="text-2xl font-bold">Организационная схема</h1>
            <p className="text-red-100 mt-1">A-Team</p>
          </div>

          {/* Информация о сотруднике */}
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {employee.first_name} {employee.last_name}
                </h2>
                <p className="text-gray-600">{employee.position}</p>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3">
              <button 
                onClick={() => navigate(`/employee/${employee.id}`)}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>👤</span>
                <span>Мой профиль</span>
              </button>
              
              <button
                onClick={() => navigate('/home')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>🏢</span>
                <span>Организационная схема</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramMiniApp; 