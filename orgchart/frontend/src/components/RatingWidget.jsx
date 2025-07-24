import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Award, Star, Target, Eye, HelpCircle, Sparkles } from 'lucide-react';
import api from '../services/api';
import { getPointsText } from '../utils/dateUtils';

export default function RatingWidget({ employeeId }) {
  const [rating, setRating] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRating = async () => {
      try {
        setLoading(true);
        const [tokensResponse, achievementsResponse] = await Promise.all([
          api.request(`/api/tokens/employee/${employeeId}`),
          api.request(`/api/tokens/achievements/${employeeId}`)
        ]);

        setRating(tokensResponse);
        setAchievements(achievementsResponse);
      } catch (error) {
        console.error('Error loading rating:', error);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      loadRating();
    }
  }, [employeeId]);

  if (loading) {
    return (
      <div className="bg-gray/5 rounded-lg p-5">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!rating) {
    return null;
  }

  // Вычисляем общий рейтинг
  const totalPoints = rating.reduce((sum, token) => {
    return sum + (token.count * token.tokenType.value);
  }, 0);

  // Определяем уровень
  const getLevel = (points) => {
    if (points >= 1000) return { 
      name: 'Легенда', 
      icon: <Crown className="w-5 h-5" />, 
      color: 'text-purple-600',
      description: 'Выдающиеся достижения и вклад в команду',
      nextLevel: null
    };
    if (points >= 500) return { 
      name: 'Мастер', 
      icon: <Award className="w-5 h-5" />, 
      color: 'text-yellow-600',
      description: 'Высокий уровень мастерства',
      nextLevel: 1000
    };
    if (points >= 200) return { 
      name: 'Эксперт', 
      icon: <Trophy className="w-5 h-5" />, 
      color: 'text-orange-600',
      description: 'Опытный специалист',
      nextLevel: 500
    };
    if (points >= 50) return { 
      name: 'Специалист', 
      icon: <Star className="w-5 h-5" />, 
      color: 'text-blue-600',
      description: 'Квалифицированный сотрудник',
      nextLevel: 200
    };
    return { 
      name: 'Новичок', 
      icon: <Star className="w-5 h-5" />, 
      color: 'text-gray-600',
      description: 'Начинающий сотрудник',
      nextLevel: 50
    };
  };

  const level = getLevel(totalPoints);

  // Группируем токены по типам
  const tokensByType = rating.reduce((acc, token) => {
    const type = token.tokenType.name;
    if (!acc[type]) acc[type] = 0;
    acc[type] += token.count;
    return acc;
  }, {});

  // Определяем типы токенов с динамическими цветами
  const getTokenTypeInfo = (tokenTypeName) => {
    // Fallback цвета для обратной совместимости
    const fallbackColors = {
      'platinum': { bgColor: 'bg-gradient-to-br from-gray to-white', emoji: '🌟' },
      'yellow': { bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600', emoji: '💪' },
      'red': { bgColor: 'bg-gradient-to-br from-red-500 to-red-700', emoji: '👁️' },
      'gray': { bgColor: 'bg-gradient-to-br from-dark to-black', emoji: '🤝' }
    };

    const name = tokenTypeName.toLowerCase();
    if (name.includes('белый') || name.includes('white') || name.includes('platinum')) {
      return fallbackColors.platinum;
    } else if (name.includes('желтый') || name.includes('yellow')) {
      return fallbackColors.yellow;
    } else if (name.includes('красный') || name.includes('red')) {
      return fallbackColors.red;
    } else if (name.includes('серый') || name.includes('gray') || name.includes('grey')) {
      return fallbackColors.gray;
    }
    return fallbackColors.gray;
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

  // Определяем типы токенов
  const tokenTypes = [
    {
      key: 'platinum',
      name: 'Белые',
      description: 'Базовые токены',
      icon: <Sparkles className="w-4 h-4" />,
      emoji: '🌟',
      getBgColor: () => 'bg-gradient-to-br from-gray to-white'
    },
    {
      key: 'yellow',
      name: 'Желтые',
      description: 'Токены достижений',
      icon: <Target className="w-4 h-4" />,
      emoji: '💪',
      getBgColor: () => 'bg-gradient-to-br from-yellow-400 to-yellow-600'
    },
    {
      key: 'red',
      name: 'Красные',
      description: 'Токены вдохновения',
      icon: <Eye className="w-4 h-4" />,
      emoji: '👁️',
      getBgColor: () => 'bg-gradient-to-br from-red-500 to-red-700'
    },
    {
      key: 'gray',
      name: 'Серые',
      description: 'Легендарные токены',
      icon: <HelpCircle className="w-4 h-4" />,
      emoji: '🤝',
      getBgColor: () => 'bg-gradient-to-br from-dark to-black'
    }
  ];

  return (
    <div className="bg-gray/5 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Мой рейтинг
        <span className={`${level.color} flex items-center gap-1 text-sm font-medium ml-auto`}>
          {level.icon}
          {level.name}
        </span>
      </h3>

      {/* Текущий уровень */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Текущий уровень</span>
          <span className={`${level.color} font-medium`}>{level.name}</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">{level.description}</p>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-700">Общий рейтинг</span>
          <span className="font-bold text-gray-900">{getPointsText(totalPoints)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full" 
            style={{width: `${Math.min((totalPoints / 1000) * 100, 100)}%`}}
          ></div>
        </div>
        {level.nextLevel && (
          <p className="text-xs text-gray-500">
            До следующего уровня: {level.nextLevel - totalPoints} {getPointsText(level.nextLevel - totalPoints).split(' ')[1]}
          </p>
        )}
      </div>

      {/* Типы токенов */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Типы токенов</h4>
        <div className="grid grid-cols-2 gap-3">
          {tokenTypes
            .sort((a, b) => {
              // Сортируем по ценности токенов: platinum(1) < yellow(10) < red(100) < gray(1000)
              const getValue = (key) => {
                switch(key) {
                  case 'platinum': return 1;
                  case 'yellow': return 10;
                  case 'red': return 100;
                  case 'gray': return 1000;
                  default: return 0;
                }
              };
              return getValue(a.key) - getValue(b.key);
            })
            .map((tokenType) => (
            <div key={tokenType.key} className="bg-white rounded-lg p-3 border border-gray/20">
              <div className={`w-full h-16 ${tokenType.getBgColor()} rounded-lg flex items-center justify-center mb-2`}>
                <span className="text-white text-2xl font-bold">{tokenType.emoji}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {tokenType.icon}
                  <span className="text-sm font-medium text-gray-900">{tokenType.name}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{tokenType.description}</p>
                <div className="text-lg font-bold text-gray-900">
                  {tokensByType[tokenType.key] || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Достижения */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Полученные достижения</h4>
          <div className="flex flex-wrap gap-2">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                style={{ backgroundColor: `${achievement.achievement.color}20`, color: achievement.achievement.color }}
              >
                <span>{achievement.achievement.icon}</span>
                <span>{achievement.achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 