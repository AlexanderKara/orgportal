import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { X, Award, Crown, Star, Heart, Users, Zap, Calendar, Shuffle, Image } from 'lucide-react';
import { getProportionalPadding } from '../../utils/padding';
import { showNotification } from '../../utils/notifications';

const getAchievementIcon = (icon) => {
  try {
    // Проверяем, что icon является строкой
    if (!icon || typeof icon !== 'string') {
      return <Award className="w-6 h-6 text-primary" />;
    }

  const iconMap = {
    'award': <Award className="w-6 h-6 text-primary" />,
    'star': <Star className="w-6 h-6 text-yellow-500" />,
    'crown': <Crown className="w-6 h-6 text-purple-500" />,
    'heart': <Heart className="w-6 h-6 text-red-500" />,
    'users': <Users className="w-6 h-6 text-blue-500" />,
    'zap': <Zap className="w-6 h-6 text-yellow-400" />,
    'calendar': <Calendar className="w-6 h-6 text-green-500" />
  };
    
    const iconComponent = iconMap[icon];
    if (!iconComponent) {
      return <Award className="w-6 h-6 text-primary" />;
    }
    
    return iconComponent;
  } catch (error) {
    return <Award className="w-6 h-6 text-primary" />;
  }
};

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    minHeight: 40,
    borderColor: state.isFocused ? '#FF8A15' : '#D9D9D9',
    boxShadow: state.isFocused ? '0 0 0 2px #FF8A15' : 'none',
    outline: 'none',
    '&:hover': {
      borderColor: '#FF8A15',
    },
    paddingRight: 0,
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: 8,
    zIndex: 99999,
    minWidth: 'fit-content',
    width: 'auto',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#FF8A15' : state.isFocused ? '#FFE5CC' : '#fff',
    color: state.isSelected ? '#fff' : '#2D2D2D',
    borderRadius: 6,
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#BDBDBD',
    paddingRight: 8,
    paddingLeft: 4,
  }),
};

export default function AssignAchievementModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  employee, 
  achievements = [],
  existingAchievements = []
}) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSelectedAchievement(null);
      setErrors({});
    }
  }, [isOpen]);

  const availableAchievements = achievements.filter(achievement => 
    !existingAchievements.includes(achievement.id)
  );

  const achievementOptions = availableAchievements.map(achievement => ({
    value: achievement.id,
    label: achievement.name,
    achievement: achievement
  }));

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedAchievement) {
      newErrors.achievement = 'Выберите бейдж';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const assignmentData = {
      employeeId: employee.id,
      achievementId: selectedAchievement.value
    };
    
    onSubmit(assignmentData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999] p-4 overflow-hidden">
      <div className="bg-white rounded-[15px] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <div>
            <h2 className="text-xl font-semibold text-dark">
              Отправить бейдж
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Выбор бейджа */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите бейдж *
            </label>
            <Select
              value={selectedAchievement}
              onChange={(option) => {
                setSelectedAchievement(option);
                if (option) {
                  setErrors(prev => ({ ...prev, achievement: null }));
                }
              }}
              options={achievementOptions}
              styles={customSelectStyles}
                             formatOptionLabel={({ label, achievement }) => {
                 // Проверяем, что achievement существует и является объектом
                 if (!achievement || typeof achievement !== 'object') {
                   return <div className="text-red-500">Ошибка загрузки данных</div>;
                 }

                 // Проверяем, что label является строкой
                 if (typeof label !== 'string') {
                   return <div className="text-red-500">Ошибка загрузки данных</div>;
                 }

                 // Проверяем, что description является строкой или null/undefined
                 const description = achievement.description;
                 if (description !== null && description !== undefined && typeof description !== 'string') {
                   return <div className="text-red-500">Ошибка загрузки данных</div>;
                 }

                return (
                <div className="flex items-center gap-3">
                    {achievement.image ? (
                  <div 
                        className="w-8 h-8 rounded-full overflow-hidden"
                    style={{ padding: `${getProportionalPadding(32)}px` }}
                  >
                        <img 
                          src={achievement.image} 
                          alt={achievement.name || 'Бейдж'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: achievement.color || '#f3f4f6',
                          padding: `${getProportionalPadding(32)}px`
                        }}
                      >
                                               {(() => {
                         try {
                           return achievement.icon ? getAchievementIcon(achievement.icon) : <Award className="w-4 h-4 text-primary" />;
                         } catch (error) {
                           return <Award className="w-4 h-4 text-primary" />;
                         }
                       })()}
                  </div>
                    )}
                  <div className="flex-1">
                      <div className="font-medium text-dark">{String(label)}</div>
                      <div className="text-sm text-gray-600">{String(description || '')}</div>
                  </div>
                    {achievement.is_unique === true && (
                    <Crown className="w-4 h-4 text-purple-500" />
                  )}
                </div>
                );
              }}
              placeholder="Выберите бейдж..."
              isClearable
              noOptionsMessage={() => "Бейджи не найдены"}
              loadingMessage={() => "Загрузка..."}
            />
            {errors.achievement && (
              <p className="text-red-500 text-sm mt-1">{errors.achievement}</p>
            )}
          </div>

          {/* Предварительный просмотр */}
          {selectedAchievement && selectedAchievement.achievement && (
            <div className="bg-gray-50 rounded-[12px] p-4 border border-gray/20">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Предварительный просмотр</h3>
              <div className="flex items-center gap-3">
                {selectedAchievement.achievement.image ? (
                <div 
                    className="w-12 h-12 rounded-full overflow-hidden"
                  style={{ padding: `${getProportionalPadding(48)}px` }}
                >
                    <img 
                      src={selectedAchievement.achievement.image} 
                      alt={selectedAchievement.achievement.name || 'Бейдж'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: selectedAchievement.achievement.color || '#f3f4f6',
                      padding: `${getProportionalPadding(48)}px`
                    }}
                  >
                                         {(() => {
                       try {
                         return selectedAchievement.achievement.icon ? getAchievementIcon(selectedAchievement.achievement.icon) : <Award className="w-6 h-6 text-primary" />;
                       } catch (error) {
                         return <Award className="w-6 h-6 text-primary" />;
                       }
                     })()}
                </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-dark">{String(selectedAchievement.achievement.name || 'Бейдж')}</h4>
                  <p className="text-sm text-gray-600">{String(selectedAchievement.achievement.description || '')}</p>
                                     {(() => {
                     const criteria = selectedAchievement.achievement.criteria;
                     if (criteria && typeof criteria === 'string' && criteria.trim() !== '') {
                       return <p className="text-xs text-gray-500 mt-1">{String(criteria)}</p>;
                     } else if (criteria && typeof criteria === 'object') {
                       return null;
                     }
                     return null;
                   })()}
                </div>
                {selectedAchievement.achievement.is_unique === true && (
                  <div className="flex items-center gap-1">
                    <Crown className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-purple-600">Уникальное</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Информация о сотруднике */}
          <div className="bg-blue-50 rounded-[12px] p-4 border border-blue/20">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Информация о сотруднике</h3>
            <div className="flex items-center gap-3">
              {employee?.avatar ? (
                <img 
                  src={employee.avatar} 
                  alt={employee.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold">
                    {(() => {
                      const firstName = employee?.first_name || employee?.firstName || employee?.name?.split(' ')[0] || '';
                      const lastName = employee?.last_name || employee?.lastName || employee?.name?.split(' ')[1] || '';
                      return firstName && lastName 
                        ? `${firstName.charAt(0)}${lastName.charAt(0)}`
                        : employee?.name?.charAt(0) || employee?.full_name?.charAt(0) || '?'
                    })()}
                </span>
              </div>
              )}
              <div>
                <p className="font-medium text-dark">
                  {(() => {
                    const firstName = employee?.first_name || employee?.firstName || '';
                    const lastName = employee?.last_name || employee?.lastName || '';
                    const fullName = employee?.name || employee?.full_name || '';
                    
                    if (firstName && lastName) {
                      return `${String(firstName)} ${String(lastName)}`;
                    } else if (fullName) {
                      return String(fullName);
                    } else {
                      return 'Неизвестный сотрудник';
                    }
                  })()}
                </p>
                <p className="text-sm text-gray-600">{String(employee?.department?.name || employee?.email || 'Отдел не указан')}</p>
                <p className="text-xs text-gray-500">{String(employee?.position || 'Должность не указана')}</p>
              </div>
            </div>
          </div>
        </form>

        {/* Кнопки */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray/20 rounded-[8px] text-sm font-medium transition hover:bg-gray/10"
          >
            Отмена
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedAchievement}
            className="px-4 py-2 bg-primary text-white rounded-[8px] text-sm font-medium transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отправить бейдж
          </button>
        </div>
      </div>
    </div>
  );
} 