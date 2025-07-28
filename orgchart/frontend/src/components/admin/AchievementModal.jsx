import React, { useState, useEffect } from 'react';
import { X, Award, Star, Heart, Users, Zap, Calendar, Crown, Image, Shuffle, Lock, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { showNotification } from '../../utils/notifications';
import api from '../../services/api';
import Checkbox from '../ui/Checkbox';

const iconOptions = [
  { value: 'award', label: 'Награда', icon: <Award className="w-4 h-4" /> },
  { value: 'star', label: 'Звезда', icon: <Star className="w-4 h-4" /> },
  { value: 'heart', label: 'Сердце', icon: <Heart className="w-4 h-4" /> },
  { value: 'users', label: 'Пользователи', icon: <Users className="w-4 h-4" /> },
  { value: 'zap', label: 'Молния', icon: <Zap className="w-4 h-4" /> },
  { value: 'calendar', label: 'Календарь', icon: <Calendar className="w-4 h-4" /> },
  { value: 'crown', label: 'Корона', icon: <Crown className="w-4 h-4" /> },
];

const getIconComponent = (iconName) => {
  switch (iconName) {
    case 'star': return <Star className="w-4 h-4" />;
    case 'heart': return <Heart className="w-4 h-4" />;
    case 'users': return <Users className="w-4 h-4" />;
    case 'zap': return <Zap className="w-4 h-4" />;
    case 'calendar': return <Calendar className="w-4 h-4" />;
    case 'crown': return <Crown className="w-4 h-4" />;
    default: return <Award className="w-4 h-4" />;
  }
};

// Функция для получения случайной иконки
const getRandomIcon = () => {
  const icons = ['award', 'star', 'heart', 'users', 'zap', 'calendar', 'crown'];
  return icons[Math.floor(Math.random() * icons.length)];
};

export default function AchievementModal({ isOpen, onClose, onSubmit, achievement = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {},
    icon: 'award',
    color: '#3B82F6',
    type: 'social',
    isActive: true,
    is_unique: false,
    is_random: false,
    image: ''
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFolders, setImageFolders] = useState([]);
  const [selectedImageFolder, setSelectedImageFolder] = useState('');
  const [availableImages, setAvailableImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(false);
  const [tokenTypes, setTokenTypes] = useState([]);
  const [departments, setDepartments] = useState([]);

  const typeOptions = [
    { value: 'social', label: 'Социальный' },
    { value: 'activity', label: 'Активность' },
    { value: 'generosity', label: 'Щедрость' },
    { value: 'team', label: 'Команда' },
    { value: 'special', label: 'Особый' },
    { value: 'seasonal', label: 'Сезонный' },
    { value: 'unique', label: 'Уникальный' },
  ];

  useEffect(() => {
    if (achievement) {
      setFormData({
        name: achievement.name || '',
        description: achievement.description || '',
        criteria: achievement.criteria && typeof achievement.criteria === 'object' ? achievement.criteria : {},
        icon: achievement.icon || 'award',
        color: achievement.color || '#3B82F6',
        type: achievement.type || 'social',
        isActive: achievement.isActive !== false,
        is_unique: achievement.is_unique || false,
        is_random: achievement.is_random || false,
        image: achievement.image || ''
      });
    } else {
      // При создании нового достижения назначаем случайную иконку и очищаем изображение
      const randomIcon = getRandomIcon();
      setFormData({
        name: '',
        description: '',
        criteria: {},
        icon: randomIcon,
        color: '#3B82F6',
        type: 'social',
        isActive: true,
        is_unique: false,
        is_random: false,
        image: ''
      });
      // Очищаем состояние изображений для новых записей
      setAvailableImages([]);
      setCurrentImageIndex(0);
      setSelectedImageFolder('');
    }
    setErrors({});
    
    // Загружаем данные с обработкой ошибок
    Promise.all([
        loadImageFolders().catch(() => {}),
        loadTokenTypes().catch(() => {}),
        loadDepartments().catch(() => {})
    ]);
  }, [achievement, isOpen]);

  // Автоматически устанавливаем is_unique при выборе типа "unique"
  useEffect(() => {
    if (formData.type === 'unique') {
      setFormData(prev => ({ ...prev, is_unique: true }));
    }
  }, [formData.type]);

  // Автоматически устанавливаем is_random при изменении поля image
  useEffect(() => {
    if (!formData.image) {
      setFormData(prev => ({ ...prev, is_random: true }));
    } else {
      setFormData(prev => ({ ...prev, is_random: false }));
    }
  }, [formData.image]);

  // Загружаем изображения при изменении папки
  useEffect(() => {
    if (selectedImageFolder) {
      loadImagesFromFolder(selectedImageFolder);
    }
  }, [selectedImageFolder]);

  const loadImageFolders = async () => {
    try {
      const response = await api.getBadgeImages();
      if (response.success) {
        setAvailableImages(response.images);
      }
    } catch (error) {
      // Ошибка загрузки папок изображений
    }
  };

  const loadTokenTypes = async () => {
    try {
      const response = await api.getTokenTypes();
      let typesData = [];
      
      // Обрабатываем разные форматы ответа
      if (Array.isArray(response)) {
        typesData = response;
      } else if (response && response.types) {
        typesData = response.types;
      } else if (response && response.data) {
        typesData = response.data;
      } else if (response && response.success && response.types) {
        typesData = response.types;
      } else {
        typesData = [];
      }
      
      // Извлекаем названия типов токенов
      const tokenTypeNames = typesData.map(type => 
        typeof type === 'string' ? type : type.name || type.type || type
      ).filter(Boolean); // Убираем пустые значения
      
      setTokenTypes(tokenTypeNames.length > 0 ? tokenTypeNames : [
        'login', 'profile_update', 'task_complete', 'team_help', 'innovation', 
        'leadership', 'mentoring', 'training', 'event_participation', 
        'feedback_given', 'feedback_received'
      ]);
    } catch (error) {
      // Fallback к базовым типам
      setTokenTypes(['login', 'profile_update', 'task_complete', 'team_help', 'innovation', 'leadership', 'mentoring', 'training', 'event_participation', 'feedback_given', 'feedback_received']);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.getDepartments();
      let departmentsData = [];
      
      // Обрабатываем разные форматы ответа
      if (Array.isArray(response)) {
        departmentsData = response;
      } else if (response && response.departments) {
        departmentsData = response.departments;
      } else if (response && response.data) {
        departmentsData = response.data;
      } else if (response && response.success && response.departments) {
        departmentsData = response.departments;
      } else {
        departmentsData = [];
      }
      
      // Извлекаем названия отделов
      const departmentNames = departmentsData.map(dept => 
        typeof dept === 'string' ? dept : dept.name || dept
      ).filter(Boolean); // Убираем пустые значения
      
      setDepartments(departmentNames.length > 0 ? departmentNames : [
        'IT', 'HR', 'Marketing', 'Sales', 'Finance', 'Operations', 
        'Support', 'Development', 'Design', 'Analytics'
      ]);
    } catch (error) {
      // Fallback к базовым отделам
      setDepartments(['IT', 'HR', 'Marketing', 'Sales', 'Finance', 'Operations', 'Support', 'Development', 'Design', 'Analytics']);
    }
  };

  const loadImagesFromFolder = async (folderName) => {
    try {
      setLoadingImages(true);
      const response = await api.getBadgeImages();
      
      if (response && response.success && response.images) {
        const folderImages = response.images[folderName] || [];
        setAvailableImages(folderImages);
        
        // Устанавливаем случайное изображение при выборе папки
        if (folderImages.length > 0) {
          const randomIndex = Math.floor(Math.random() * folderImages.length);
          setCurrentImageIndex(randomIndex);
          setFormData(prev => ({ ...prev, image: folderImages[randomIndex].path }));
        }
      } else {
        // Fallback к моковым данным
        const mockImages = [
          { name: 'badge1.png', path: `/uploads/badges/${folderName}/badge1.png` },
          { name: 'badge2.png', path: `/uploads/badges/${folderName}/badge2.png` },
          { name: 'badge3.png', path: `/uploads/badges/${folderName}/badge3.png` },
        ];
        setAvailableImages(mockImages);
        
        if (mockImages.length > 0) {
          const randomIndex = Math.floor(Math.random() * mockImages.length);
          setCurrentImageIndex(randomIndex);
          setFormData(prev => ({ ...prev, image: mockImages[randomIndex].path }));
        }
      }
    } catch (error) {
      setAvailableImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }
    
    if (!formData.color) {
      newErrors.color = 'Цвет обязателен';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      showNotification('Ошибка сохранения достижения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      criteria: {},
      icon: 'award',
      color: '#3B82F6',
      type: 'social',
      isActive: true,
      is_unique: false,
      is_random: false,
      image: ''
    });
    setErrors({});
    setAvailableImages([]);
    setCurrentImageIndex(0);
    onClose();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setCurrentImageIndex(0);
  };

  const getRandomImage = () => {
    if (availableImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableImages.length);
      setCurrentImageIndex(randomIndex);
      setFormData(prev => ({ ...prev, image: availableImages[randomIndex].path }));
    }
  };

  const navigateImage = (direction) => {
    if (availableImages.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentImageIndex + 1) % availableImages.length;
    } else {
      newIndex = currentImageIndex === 0 ? availableImages.length - 1 : currentImageIndex - 1;
    }
    
    setCurrentImageIndex(newIndex);
    setFormData(prev => ({ ...prev, image: availableImages[newIndex].path }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Фиксированный заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20 flex-shrink-0">
          <h2 className="text-xl font-semibold text-dark">
            {achievement ? 'Редактировать достижение' : 'Создать достижение'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Прокручиваемый контент */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Превью бейджа */}
            <div className="flex justify-center">
              <div className="relative">
                <div 
                  className="w-[300px] h-[300px] rounded-full flex items-center justify-center border-4 border-gray/20 relative"
                  style={{ backgroundColor: formData.color + '20' }}
                >
                  {formData.image ? (
                    <>
                      <img 
                        src={formData.image} 
                        alt="Badge preview" 
                        className="w-full h-full rounded-full object-cover"
                      />
                      {/* Навигационные стрелки */}
                      {availableImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => navigateImage('prev')}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition"
                          >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateImage('next')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition"
                          >
                            <ChevronRight className="w-6 h-6 text-gray-700" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-1/2 h-1/2 flex items-center justify-center">
                      {getIconComponent(formData.icon)}
                    </div>
                  )}
                </div>
                {formData.is_unique && (
                  <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Название - во всю ширину */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-[8px] text-sm ${
                    errors.name ? 'border-red-500' : 'border-gray/20'
                  }`}
                  placeholder="Введите название достижения"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Описание - во всю ширину */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm resize-none"
                  placeholder="Введите описание достижения"
                />
              </div>

              {/* Тип и папка с изображениями - два в одной строке */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm bg-white appearance-none cursor-pointer"
                  >
                    {typeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Папка с изображениями
                  </label>
                  <div className="relative">
                    <select
                      value={selectedImageFolder}
                      onChange={(e) => {
                        setSelectedImageFolder(e.target.value);
                        if (e.target.value) {
                          loadImagesFromFolder(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Выберите папку</option>
                      {imageFolders.map(folder => (
                        <option key={folder.value} value={folder.value}>
                          {folder.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Изображение - во всю ширину с красным крестом */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Изображение
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm pr-10"
                    />
                    {formData.image && (
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {!formData.image && availableImages.length > 0 && (
                    <button
                      type="button"
                      onClick={getRandomImage}
                      className="w-full px-3 py-2 bg-gray-500 text-white rounded-[8px] text-sm hover:bg-gray-600 transition"
                    >
                      Случайное изображение
                    </button>
                  )}
                  {loadingImages && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      Загрузка изображений...
                    </div>
                  )}
                  {availableImages.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Доступно изображений: {availableImages.length}
                      {currentImageIndex >= 0 && (
                        <span className="ml-2">
                          Текущее: {currentImageIndex + 1}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Цвет и активный - два в одной строке */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цвет
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleChange('color', e.target.value)}
                      className="w-12 h-10 border border-gray/20 rounded-[8px] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleChange('color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray/20 rounded-[8px] text-sm font-mono"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Статус
                  </label>
                  <Checkbox
                      checked={formData.isActive}
                      onChange={(e) => handleChange('isActive', e.target.checked)}
                    label="Активный"
                    />
                </div>
              </div>
            </div>
          </form>

          {/* Блок редактирования критериев */}
          <div className="p-6 border-t border-gray/20">
            <h3 className="text-lg font-semibold text-dark mb-4">Критерии автоматического назначения</h3>
            
            <div className="space-y-6">
              {/* Период накопления */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Период накопления
                </label>
                <select
                  value={formData.criteria?.periodType || 'day'}
                  onChange={(e) => handleChange('criteria', {
                    ...formData.criteria,
                    periodType: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm bg-white appearance-none cursor-pointer"
                >
                  <option value="day">День</option>
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="quarter">Квартал</option>
                  <option value="half_year">Полгода</option>
                  <option value="year">Год</option>
                </select>
              </div>

              {/* Интервал накопления */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    value={formData.criteria?.startDate || ''}
                    onChange={(e) => handleChange('criteria', {
                      ...formData.criteria,
                      startDate: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата окончания
                  </label>
                  <input
                    type="date"
                    value={formData.criteria?.endDate || ''}
                    onChange={(e) => handleChange('criteria', {
                      ...formData.criteria,
                      endDate: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm"
                  />
                </div>
              </div>

              {/* Месяцы накопления */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Месяцы накопления
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'january', label: 'Январь' },
                    { value: 'february', label: 'Февраль' },
                    { value: 'march', label: 'Март' },
                    { value: 'april', label: 'Апрель' },
                    { value: 'may', label: 'Май' },
                    { value: 'june', label: 'Июнь' },
                    { value: 'july', label: 'Июль' },
                    { value: 'august', label: 'Август' },
                    { value: 'september', label: 'Сентябрь' },
                    { value: 'october', label: 'Октябрь' },
                    { value: 'november', label: 'Ноябрь' },
                    { value: 'december', label: 'Декабрь' }
                  ].map(month => (
                    <Checkbox
                      key={month.value}
                        checked={formData.criteria?.months?.includes(month.value) || false}
                        onChange={(e) => {
                          const currentMonths = formData.criteria?.months || [];
                          const newMonths = e.target.checked
                            ? [...currentMonths, month.value]
                            : currentMonths.filter(m => m !== month.value);
                          handleChange('criteria', {
                            ...formData.criteria,
                            months: newMonths
                          });
                        }}
                      label={month.label}
                      />
                  ))}
                </div>
              </div>

              {/* Типы токенов */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Типы токенов
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray/20 rounded-[8px] p-3">
                  {tokenTypes.map(tokenType => (
                    <Checkbox
                      key={tokenType}
                        checked={formData.criteria?.tokenTypes?.includes(tokenType) || false}
                        onChange={(e) => {
                          const currentTypes = formData.criteria?.tokenTypes || [];
                          const newTypes = e.target.checked
                            ? [...currentTypes, tokenType]
                            : currentTypes.filter(t => t !== tokenType);
                          handleChange('criteria', {
                            ...formData.criteria,
                            tokenTypes: newTypes
                          });
                        }}
                      label={tokenType}
                      />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Список автоматически обновляется при добавлении новых типов токенов
                </p>
              </div>

              {/* Количество отделов */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Минимальное количество отделов
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.criteria?.minDepartments || ''}
                  onChange={(e) => handleChange('criteria', {
                    ...formData.criteria,
                    minDepartments: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Отделы, сотрудники которых прислали бейджи
                </p>
              </div>

              {/* Отделы */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Конкретные отделы
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray/20 rounded-[8px] p-3">
                  {departments.map(department => (
                    <Checkbox
                      key={department}
                        checked={formData.criteria?.departments?.includes(department) || false}
                        onChange={(e) => {
                          const currentDepts = formData.criteria?.departments || [];
                          const newDepts = e.target.checked
                            ? [...currentDepts, department]
                            : currentDepts.filter(d => d !== department);
                          handleChange('criteria', {
                            ...formData.criteria,
                            departments: newDepts
                          });
                        }}
                      label={department}
                      />
                  ))}
                </div>
              </div>

              {/* Количество сотрудников */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Минимальное количество сотрудников
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.criteria?.minEmployees || ''}
                    onChange={(e) => handleChange('criteria', {
                      ...formData.criteria,
                      minEmployees: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Количество сотрудников, приславших бейджи
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Максимальное количество бейджей от одного человека
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.criteria?.maxBadgesPerPerson || ''}
                    onChange={(e) => handleChange('criteria', {
                      ...formData.criteria,
                      maxBadgesPerPerson: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm"
                    placeholder="∞"
                  />
                </div>
              </div>

              {/* Общее количество бейджей */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Минимальное количество бейджей всего
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.criteria?.minTotalBadges || ''}
                    onChange={(e) => handleChange('criteria', {
                      ...formData.criteria,
                      minTotalBadges: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество бейджей со дня трудоустройства
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.criteria?.badgesSinceEmployment || ''}
                    onChange={(e) => handleChange('criteria', {
                      ...formData.criteria,
                      badgesSinceEmployment: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Фиксированный футер */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray/20 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 border border-gray/20 rounded-[8px] text-sm font-medium hover:bg-gray/10 transition"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-[8px] text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : (achievement ? 'Обновить' : 'Создать')}
          </button>
        </div>
      </div>
    </div>
  );
} 