import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Award, Crown, Calendar } from 'lucide-react';
import Select from 'react-select';
import Avatar from '../components/ui/Avatar';
import api from '../services/api';
import { getPointsText } from '../utils/dateUtils';

export default function TopRating() {
  const navigate = useNavigate();
  const [topEmployees, setTopEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadTopRating();
  }, [selectedYear]);

  const loadTopRating = async () => {
    try {
      setLoading(true);
      const response = await api.request(`/api/tokens/top?year=${selectedYear}`);
      setTopEmployees(response);
    } catch (error) {
      console.error('Error loading top rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  const getLevel = (points) => {
    if (points >= 1000) return { name: 'Легенда', icon: <Crown className="w-4 h-4" />, color: 'text-purple-600', bgColor: 'bg-purple-100' };
    if (points >= 500) return { name: 'Мастер', icon: <Award className="w-4 h-4" />, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (points >= 200) return { name: 'Эксперт', icon: <Trophy className="w-4 h-4" />, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (points >= 50) return { name: 'Специалист', icon: <Star className="w-4 h-4" />, color: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { name: 'Новичок', icon: <Star className="w-4 h-4" />, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#FF8A15' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #FF8A15' : 'none',
      '&:hover': {
        borderColor: '#FF8A15'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#FF8A15' : state.isFocused ? '#FFF3E0' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:hover': {
        backgroundColor: state.isSelected ? '#FF8A15' : '#FFF3E0'
      }
    })
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

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Header */}
      <div className="flex items-center justify-between py-8 border-b border-gray/30 sticky top-0 bg-white z-10 px-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold font-accent text-primary">Топ рейтинга</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <Select
              value={yearOptions.find(opt => opt.value === selectedYear)}
              onChange={(option) => setSelectedYear(option.value)}
              options={yearOptions}
              styles={customSelectStyles}
              className="w-32"
            />
          </div>
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray/30 transition" title="Назад">
            <ArrowLeft className="w-8 h-8 text-dark" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка рейтинга...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {topEmployees.map((employee, index) => {
              const level = getLevel(employee.totalPoints);
              const position = index + 1;
              
              return (
                <div key={employee.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray/200">
                  <div className="flex items-center gap-4">
                    {/* Позиция */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getPositionColor(position)}`}>
                      {position}
                    </div>

                    {/* Аватар и основная информация */}
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar
                        src={employee.avatar}
                        name={employee.name}
                        size="lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                        <p className="text-xs text-gray-500">{employee.department?.name}</p>
                      </div>
                    </div>

                    {/* Рейтинг и уровень */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${level.color} flex items-center gap-1 text-sm font-medium`}>
                          {level.icon}
                          {level.name}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{getPointsText(employee.totalPoints)}</div>
                      <div className="text-sm text-gray-500">{employee.achievements?.length || 0} достижений</div>
                    </div>
                  </div>

                  {/* Токены */}
                  <div className="mt-4 pt-4 border-t border-gray/100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Токены:</span>
                      <div className="flex items-center gap-4">
                        {employee.employeeTokens
                          ?.sort((a, b) => {
                            // Сортируем по ценности токенов: platinum(1) < yellow(10) < red(100) < gray(1000)
                            const getValue = (name) => {
                              const tokenName = name.toLowerCase();
                              if (tokenName.includes('серый') || tokenName.includes('gray') || tokenName.includes('grey')) return 1000;
                              if (tokenName.includes('красный') || tokenName.includes('red')) return 100;
                              if (tokenName.includes('желтый') || tokenName.includes('yellow')) return 10;
                              return 1;
                            };
                            return getValue(a.tokenType.name) - getValue(b.tokenType.name);
                          })
                          ?.map(token => (
                          <div key={token.tokenTypeId} className="flex items-center gap-1">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              (() => {
                                // Если есть backgroundColor в tokenType, используем его
                                if (token.tokenType?.backgroundColor) {
                                  if (token.tokenType.backgroundColor.startsWith('#')) {
                                    return `bg-gradient-to-br from-[${token.tokenType.backgroundColor}] to-[${getLighterColor(token.tokenType.backgroundColor)}]`;
                                  } else {
                                    return token.tokenType.backgroundColor;
                                  }
                                }
                                
                                // Fallback - определяем по имени
                                const name = token.tokenType.name.toLowerCase();
                                if (name.includes('серый') || name.includes('gray') || name.includes('grey')) return 'bg-gradient-to-br from-dark to-black';
                                if (name.includes('красный') || name.includes('red')) return 'bg-gradient-to-br from-red-500 to-red-700';
                                if (name.includes('желтый') || name.includes('yellow')) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
                                return 'bg-gradient-to-br from-gray to-white';
                              })()
                            }`}>
                              <span className="text-white">{token.tokenType.image}</span>
                            </div>
                            <span className="text-sm font-medium">{token.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Достижения */}
                  {employee.achievements && employee.achievements.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray/100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Достижения:</span>
                        <div className="flex flex-wrap gap-2">
                          {employee.achievements.slice(0, 5).map(achievement => (
                            <div 
                              key={achievement.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                              style={{ backgroundColor: `${achievement.achievement.color}20`, color: achievement.achievement.color }}
                            >
                              <span>{achievement.achievement.icon}</span>
                              <span>{achievement.achievement.name}</span>
                            </div>
                          ))}
                          {employee.achievements.length > 5 && (
                            <span className="text-xs text-gray-500">+{employee.achievements.length - 5} еще</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && topEmployees.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Рейтинг пуст</h3>
            <p className="text-gray-500">В этом году еще нет данных для рейтинга</p>
          </div>
        )}
      </div>
    </div>
  );
} 