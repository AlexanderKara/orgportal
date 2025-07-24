import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Award, Star, Target, Eye, HelpCircle, Sparkles, Info } from 'lucide-react';
import api from '../services/api';
import { getPointsText } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { showNotification } from '../utils/notifications';
import TokenCard, { TokenStack } from '../components/TokenCard';
import TokenViewModal from '../components/TokenViewModal';

export default function Rating() {
  const [rating, setRating] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTokenStack, setSelectedTokenStack] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [sending, setSending] = useState(false);
  const { userData } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const ratingResponse = await api.request(`/api/tokens/employee/${userData.id}`);
      
      setTotalAvailableTokens(ratingResponse.available || []);
      setTotalReceivedTokens(ratingResponse.received || []);
      
      // Группируем токены по типам
      const availableByType = groupTokensByType(ratingResponse.available || []);
      const receivedByType = groupTokensByType(ratingResponse.received || []);
      
      setAvailableTokens(availableByType);
      setReceivedTokens(receivedByType);
    } catch (error) {
      console.error('Error loading rating data:', error);
      showNotification('Ошибка загрузки данных рейтинга', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToken = async (token, employeeId) => {
    try {
      setSending(true);
      await api.post('/api/tokens/send', {
        recipientId: employeeId,
        tokenType: token.type,
        amount: 1
      });
      
      showNotification('Токен успешно отправлен!', 'success');
      loadData(); // Перезагружаем данные
    } catch (error) {
      console.error('Error sending token:', error);
      showNotification('Ошибка при отправке токена', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px]">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка системы рейтинга...</p>
          </div>
        </div>
      </div>
    );
  }

  // Вычисляем общий рейтинг
  const totalPoints = rating?.reduce((sum, token) => {
    return sum + (token.count * token.tokenType.value);
  }, 0) || 0;

  // Определяем уровень
  const getLevel = (points) => {
    if (points >= 1000) return { 
      name: 'Легенда', 
      icon: <Crown className="w-6 h-6" />, 
      color: 'text-purple-600',
      description: 'Выдающиеся достижения и вклад в команду',
      nextLevel: null
    };
    if (points >= 500) return { 
      name: 'Мастер', 
      icon: <Award className="w-6 h-6" />, 
      color: 'text-yellow-600',
      description: 'Высокий уровень мастерства',
      nextLevel: 1000
    };
    if (points >= 200) return { 
      name: 'Эксперт', 
      icon: <Trophy className="w-6 h-6" />, 
      color: 'text-orange-600',
      description: 'Опытный специалист',
      nextLevel: 500
    };
    if (points >= 50) return { 
      name: 'Специалист', 
      icon: <Star className="w-6 h-6" />, 
      color: 'text-blue-600',
      description: 'Квалифицированный сотрудник',
      nextLevel: 200
    };
    return { 
      name: 'Новичок', 
      icon: <Star className="w-6 h-6" />, 
      color: 'text-gray-600',
      description: 'Начинающий сотрудник',
      nextLevel: 50
    };
  };

  const level = getLevel(totalPoints);

  // Группируем токены по типам
  const tokensByType = rating?.reduce((acc, token) => {
    const type = token.tokenType.name;
    if (!acc[type]) acc[type] = 0;
    acc[type] += token.count;
    return acc;
  }, {}) || {};

  // Создаем массивы токенов для отображения
  const createTokenArray = (type, count) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `${type}_${index}`,
      type: type,
      count: 1
    }));
  };

  const availableTokens = {
    gray: createTokenArray('gray', tokensByType.gray || 0),
    yellow: createTokenArray('yellow', tokensByType.yellow || 0),
    red: createTokenArray('red', tokensByType.red || 0),
    platinum: createTokenArray('platinum', tokensByType.platinum || 0)
  };

  // Полученные токены (здесь нужно загрузить с сервера)
  const receivedTokens = {
    gray: [],
    yellow: [],
    red: [],
    platinum: []
  };

  const renderTokenStacks = (tokensByType) => {
    const stackComponents = Object.entries(tokensByType)
      .sort(([, a], [, b]) => {
        // Сортируем по ценности токенов: platinum(1) < yellow(10) < red(100) < gray(1000)
        const getValue = (type) => {
          switch(type) {
            case 'platinum': return 1;
            case 'yellow': return 10;
            case 'red': return 100;
            case 'gray': return 1000;
            default: return 0;
          }
        };
        return getValue(a[0]?.type || a.type) - getValue(b[0]?.type || b.type);
      })
      .map(([type, tokens]) => {
        return (
          <div key={type} className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-gray-700 capitalize mb-4 text-center">
              {type === 'gray' ? 'Серые' :
               type === 'yellow' ? 'Желтые' :
               type === 'red' ? 'Красные' : 'Бриллиантовые'}, {
                 type === 'gray' ? '1000' :
                 type === 'yellow' ? '10' :
                 type === 'red' ? '100' : '1'
               } очков ({tokens.length})
            </h3>
            <TokenStack
              tokens={tokens}
              onTokenClick={(clickedToken) => {
                setSelectedToken(clickedToken);
                setShowTokenModal(true);
              }}
              maxVisible={5}
            />
          </div>
        );
      });

    return (
      <div className="flex flex-wrap gap-8 justify-start">
        {stackComponents}
      </div>
    );
  };

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-2 sm:gap-4 md:gap-8 flex-wrap">
        <h1 className="text-[32px] font-bold font-accent text-primary">Система рейтинга</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Левая колонка */}
        <div>
          {/* Текущий уровень */}
          <div className="bg-white rounded-lg p-6 border border-gray/20 mb-8">
            <div className="flex items-center justify-between mb-6 gap-2 sm:gap-4 md:gap-8 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-900">Мой рейтинг</h2>
              <span className="text-blue-600 flex items-center gap-2 text-lg font-medium">
                <Trophy className="w-5 h-5" />
                Новичок
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">Начинающий сотрудник</p>
            
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">Общий рейтинг</span>
              <span className="font-bold text-gray-900">{getPointsText(0)}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full" style={{width: '0%'}}></div>
            </div>
            
            <p className="text-sm text-gray-500">
              До следующего уровня: <span className="font-medium">50</span> {getPointsText(50).split(' ')[1]}
            </p>
          </div>

          {/* У меня есть токены */}
          <div className="bg-white rounded-lg p-6 border border-gray/20 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">У меня есть токены</h2>
            
            <div className="w-full min-h-[200px]">
              {renderTokenStacks(availableTokens)}
            </div>
          </div>

          {/* Я получил токены */}
          <div className="bg-white rounded-lg p-6 border border-gray/20 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Я получил токены</h2>
            
            <div className="w-full min-h-[200px]">
              {renderTokenStacks(receivedTokens)}
              
              {Object.values(receivedTokens).every(tokens => tokens.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Пока нет полученных токенов</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка */}
        <div>
          {/* Информация о системе */}
          <div className="bg-white rounded-lg p-6 border border-gray/20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              О системе рейтинга
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Как работает система</h3>
                <p>Токены можно дарить коллегам за помощь, достижения и вдохновение. Каждый тип токена имеет свою ценность в очках рейтинга.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Конвертация токенов</h3>
                <ul className="space-y-1">
                  <li>• 10 белых = 1 желтый</li>
                  <li>• 10 желтых = 1 красный</li>
                  <li>• Серые токены нельзя конвертировать, только получить от лидов и топов</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Бумажные эквиваленты</h3>
                <p>Токены могут иметь бумажные эквиваленты, которые можно получить в офисе для физического обмена с коллегами.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Пополнение токенов</h3>
                <p>Обычные токены пополняются по графику, Разовые коллекции и тиражи - однократно и внепланово.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Полученные токены</h3>
                <p>Полученные токены остаются в вашей коллекции навсегда.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для просмотра токенов */}
      {showTokenModal && selectedToken && (
        <TokenViewModal
          isOpen={showTokenModal}
          onClose={() => setShowTokenModal(false)}
          token={selectedToken}
          onTokenUpdate={(updatedToken) => {
            if (updatedToken === null) {
              // Токен был отправлен (удален), закрываем модальное окно и перезагружаем данные
              setShowTokenModal(false);
              setSelectedToken(null);
              loadData();
            } else {
              // Токен был обновлен
              setSelectedToken(updatedToken);
              loadData();
            }
          }}
        />
      )}
    </div>
  );
} 