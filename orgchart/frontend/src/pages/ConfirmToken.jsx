import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { showNotification } from '../utils/notifications';
import api from '../services/api';
import { getPointsText } from '../utils/dateUtils';

export default function ConfirmToken() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [token, setToken] = useState(null);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const confirmToken = async () => {
      try {
        // Получаем информацию о токене
        const tokenResponse = await api.getAdminToken(tokenId);
        setToken(tokenResponse);

        // Получаем информацию о текущем сотруднике
        const employeeResponse = await api.getMe();
        setEmployee(employeeResponse);

        // Добавляем токен сотруднику
        await api.assignTokenToEmployee(parseInt(tokenId), employeeResponse.id);

        setStatus('success');
        showNotification('Токен успешно добавлен!', 'success');
      } catch (error) {
        console.error('Ошибка подтверждения токена:', error);
        setStatus('error');
        showNotification('Ошибка при добавлении токена', 'error');
      }
    };

    confirmToken();
  }, [tokenId]);

  const getTokenTypeInfo = (token) => {
    if (!token) return { name: 'Неизвестный', color: 'bg-gradient-gray', value: 1000 };
    
    // Если есть backgroundColor в tokenType, используем его
    if (token.tokenType?.backgroundColor) {
      if (token.tokenType.backgroundColor.startsWith('#')) {
        return { 
          name: token.tokenType.name || 'Неизвестный', 
          color: `bg-gradient-to-br from-[${token.tokenType.backgroundColor}] to-[${getLighterColor(token.tokenType.backgroundColor)}]`, 
          value: token.tokenType.value || 1 
        };
      } else {
        return { 
          name: token.tokenType.name || 'Неизвестный', 
          color: token.tokenType.backgroundColor, 
          value: token.tokenType.value || 1 
        };
      }
    }
    
    // Fallback - используем поле name из tokenType для определения цвета и значения
    const tokenTypeName = token.tokenType?.name || 'Неизвестный';
    switch (tokenTypeName.toLowerCase()) {
      case 'серый':
      case 'gray':
      case 'grey':
        return { name: 'Серый', color: 'bg-gradient-to-br from-dark to-black', value: 1000 };
      case 'красный':
      case 'red':
        return { name: 'Красный', color: 'bg-gradient-to-br from-red-500 to-red-700', value: 100 };
      case 'желтый':
      case 'yellow':
        return { name: 'Желтый', color: 'bg-gradient-to-br from-yellow-400 to-yellow-600', value: 10 };
      case 'белый':
      case 'platinum':
      case 'white':
        return { name: 'Белый', color: 'bg-gradient-to-br from-gray to-white', value: 1 };
      default:
        return { name: 'Неизвестный', color: 'bg-gradient-to-br from-dark to-black', value: 1000 };
    }
  };

  const getLighterColor = (hexColor) => {
    // Убираем # если есть
    const hex = hexColor.replace('#', '');
    
    // Конвертируем в RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Осветляем на 30%
    const lighterR = Math.min(255, Math.round(r + (255 - r) * 0.3));
    const lighterG = Math.min(255, Math.round(g + (255 - g) * 0.3));
    const lighterB = Math.min(255, Math.round(b + (255 - b) * 0.3));
    
    // Конвертируем обратно в HEX
    const lighterHex = `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
    
    return lighterHex;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Подтверждение токена</h2>
            <p className="text-gray-600 text-center">Обработка запроса...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка</h2>
            <p className="text-gray-600 text-center mb-6">
              Не удалось добавить токен. Возможно, токен уже был использован или произошла ошибка.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Токен добавлен!</h2>
          
          {token && employee && (
            <div className="w-full space-y-4 mt-6">
              {/* Информация о токене */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Информация о токене</h3>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${getTokenTypeInfo(token).color} rounded-lg flex items-center justify-center text-white text-xl`}>
                    {token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? (
                      <img 
                        src={token.image.startsWith('http') ? token.image : `${token.image}`}
                        alt="Token" 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          // При ошибке загрузки изображения заменяем на эмодзи
                          e.target.style.display = 'none';
                          const emojiSpan = e.target.nextSibling;
                          if (emojiSpan) {
                            emojiSpan.style.display = 'inline';
                          }
                        }}
                      />
                    ) : null}
                    <span className="text-xl" style={{ display: token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? 'none' : 'inline' }}>
                                                    {token.image && !token.image.startsWith('http') && !token.image.startsWith('/uploads/') ? token.image : '🎯'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{getTokenTypeInfo(token).name}</p>
                    <p className="text-sm text-gray-600">{getPointsText(getTokenTypeInfo(token).value)}</p>
                    <p className="text-sm text-gray-500">{token.description}</p>
                  </div>
                </div>
              </div>

              {/* Информация о сотруднике */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Сотрудник</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                    {employee.firstName?.[0]}{employee.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3 w-full">
            <button
              onClick={() => navigate('/profile')}
              className="w-full px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Перейти в профиль
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 