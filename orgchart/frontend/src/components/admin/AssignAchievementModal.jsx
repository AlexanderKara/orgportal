import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { X, Award, Crown, Star, Heart, Users, Zap, Calendar, Shuffle, Image } from 'lucide-react';
import { getProportionalPadding } from '../../utils/padding';
import { showNotification } from '../../utils/notifications';

const getAchievementIcon = (icon) => {
  const iconMap = {
    'award': <Award className="w-6 h-6 text-primary" />,
    'star': <Star className="w-6 h-6 text-yellow-500" />,
    'crown': <Crown className="w-6 h-6 text-purple-500" />,
    'heart': <Heart className="w-6 h-6 text-red-500" />,
    'users': <Users className="w-6 h-6 text-blue-500" />,
    'zap': <Zap className="w-6 h-6 text-yellow-400" />,
    'calendar': <Calendar className="w-6 h-6 text-green-500" />
  };
  return iconMap[icon] || <Award className="w-6 h-6 text-primary" />;
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
  const [selectedImage, setSelectedImage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSelectedAchievement(null);
      setSelectedImage('');
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
      newErrors.achievement = 'Выберите достижение';
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
      employee_id: employee.id,
      achievement_id: selectedAchievement.value,
      image: selectedImage || null
    };
    
    onSubmit(assignmentData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[15px] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <div>
            <h2 className="text-xl font-semibold text-dark">
              Назначить достижение
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Выберите достижение для сотрудника {employee?.name}
            </p>
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
          {/* Выбор достижения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите достижение *
            </label>
            <Select
              value={selectedAchievement}
              onChange={setSelectedAchievement}
              options={achievementOptions}
              styles={customSelectStyles}
              formatOptionLabel={({ label, achievement }) => (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"
                    style={{ padding: `${getProportionalPadding(32)}px` }}
                  >
                    {getAchievementIcon(achievement.icon)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-dark">{label}</div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                  </div>
                  {achievement.is_unique && (
                    <Crown className="w-4 h-4 text-purple-500" />
                  )}
                </div>
              )}
              placeholder="Выберите достижение..."
              isClearable
            />
            {errors.achievement && (
              <p className="text-red-500 text-sm mt-1">{errors.achievement}</p>
            )}
          </div>

          {/* Предварительный просмотр */}
          {selectedAchievement && (
            <div className="bg-gray-50 rounded-[12px] p-4 border border-gray/20">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Предварительный просмотр</h3>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"
                  style={{ padding: `${getProportionalPadding(48)}px` }}
                >
                  {getAchievementIcon(selectedAchievement.achievement.icon)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-dark">{selectedAchievement.achievement.name}</h4>
                  <p className="text-sm text-gray-600">{selectedAchievement.achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedAchievement.achievement.criteria}</p>
                </div>
                {selectedAchievement.achievement.is_unique && (
                  <div className="flex items-center gap-1">
                    <Crown className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-purple-600">Уникальное</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Настройки изображения */}
          {selectedAchievement && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Настройки изображения</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="imageType"
                    value="icon"
                    checked={!selectedImage}
                    onChange={() => setSelectedImage('')}
                    className="w-4 h-4 text-primary border-gray/20 focus:ring-primary"
                  />
                  <Award className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Использовать иконку</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="imageType"
                    value="random"
                    checked={selectedImage === 'random'}
                    onChange={() => setSelectedImage('random')}
                    className="w-4 h-4 text-primary border-gray/20 focus:ring-primary"
                  />
                  <Shuffle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Случайное изображение</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="imageType"
                    value="custom"
                    checked={selectedImage && selectedImage !== 'random'}
                    onChange={() => setSelectedImage('')}
                    className="w-4 h-4 text-primary border-gray/20 focus:ring-primary"
                  />
                  <Image className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Указать URL изображения</span>
                </label>
              </div>
              
              {selectedImage && selectedImage !== 'random' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL изображения
                  </label>
                  <input
                    type="url"
                    value={selectedImage}
                    onChange={(e) => setSelectedImage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray/20 rounded-[8px] text-sm transition focus:border-primary focus:ring-primary"
                    placeholder="https://example.com/image.png"
                  />
                </div>
              )}
            </div>
          )}

          {/* Информация о сотруднике */}
          <div className="bg-blue-50 rounded-[12px] p-4 border border-blue/20">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Информация о сотруднике</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {employee?.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-dark">{employee?.name}</p>
                <p className="text-sm text-gray-600">{employee?.email}</p>
                <p className="text-xs text-gray-500">{employee?.position}</p>
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
            Назначить достижение
          </button>
        </div>
      </div>
    </div>
  );
} 