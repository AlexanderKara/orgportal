import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, QrCode, Gift, User } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { showNotification } from '../utils/notifications';
import { getPointsText } from '../utils/dateUtils';

export default function ReceiveToken() {
  const { tokenHash } = useParams();
  const navigate = useNavigate();
  const { userData, isAuthenticated, loading: authLoading } = useAuth();
  
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Отслеживаем изменения авторизации
  useEffect(() => {
    if (!authLoading) {
      // Если пользователь не авторизован, показываем prompt
      if (!isAuthenticated || !userData) {
        setShowLoginPrompt(true);
      } else {
        // Если пользователь авторизован, скрываем prompt
        setShowLoginPrompt(false);
      }
    }
  }, [isAuthenticated, userData, authLoading]);

  useEffect(() => {
    const loadToken = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/tokens/${tokenHash}`);
        setToken(response);
        setError(null);
      } catch (err) {
        console.error('Error loading token:', err);
        setError(err.message || 'Токен не найден или недоступен');
      } finally {
        setLoading(false);
      }
    };

    if (tokenHash) {
      loadToken();
    }
  }, [tokenHash]);

  const handleReceiveToken = async () => {
    if (!isAuthenticated || !userData) {
      setShowLoginPrompt(true);
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmReceiveToken = async () => {
    try {
      setProcessing(true);
      const response = await api.post(`/api/tokens/${tokenHash}/receive`, {
        receiverId: userData.id
      });
      
      setSuccess(true);
      setShowConfirmDialog(false);
      
      // Показываем уведомление об успехе
      showNotification('Токен успешно получен!', 'success');
      
      // Очищаем кэш профиля, чтобы обновить данные пользователя
      api.clearProfileCache();
      
      // Перенаправляем через 2 секунды
      setTimeout(() => {
        navigate('/account/profile?view=rating');
      }, 2000);
      
    } catch (err) {
      console.error('Error receiving token:', err);
      const errorMessage = err.message || 'Ошибка при получении токена';
      setError(errorMessage);
      setShowConfirmDialog(false);
      
      // Показываем уведомление об ошибке
      showNotification(errorMessage, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogin = () => {
    navigate(`/auth?redirect=/receive-token/${tokenHash}`);
  };

  // Показываем загрузку, если проверяется авторизация
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка токена...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Основная информация о токене */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Получить токен
            </h1>
            <p className="text-gray-600">
              Вам предлагается получить токен
            </p>
          </div>

          {/* Информация о токене */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Тип токена:</span>
              <span className="text-sm text-gray-900 font-semibold">
                {token.tokenType?.name || token.name}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Ценность:</span>
              <span className="text-sm text-gray-900 font-semibold">
                {getPointsText(token.points || token.tokenType?.value || 1)}
              </span>
            </div>
            {token.description && (
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">Описание:</span>
                <span className="text-sm text-gray-900 text-right max-w-xs">
                  {token.description}
                </span>
              </div>
            )}
          </div>

          {/* Кнопка получения */}
          <button
            onClick={handleReceiveToken}
            disabled={processing}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Обработка...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Получить токен
              </>
            )}
          </button>
        </div>

        {/* Диалог подтверждения */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Подтвердите получение
                </h3>
                <p className="text-gray-600">
                  Вы уверены, что хотите получить этот токен?
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmReceiveToken}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {processing ? 'Обработка...' : 'Подтвердить'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Диалог авторизации */}
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center mb-4">
                <User className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Требуется авторизация
                </h3>
                <p className="text-gray-600">
                  Для получения токена необходимо войти в систему
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleLogin}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Войти
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Успешное получение */}
        {success && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Токен получен!
                </h3>
                <p className="text-gray-600">
                  Токен успешно добавлен в ваш профиль
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 