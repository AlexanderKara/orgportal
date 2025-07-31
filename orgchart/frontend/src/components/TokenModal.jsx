import React, { useState, useEffect } from 'react';
import { X, Upload, Image, Type, Save, Plus, Minus } from 'lucide-react';
import { getPointsText } from '../utils/dateUtils';
import api from '../services/api';
import { showNotification } from '../utils/notifications';
import Checkbox from './ui/Checkbox';

const periodOptions = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'half_year', label: 'Полгода' },
  { value: 'year', label: 'Год' }
];

// Убираем статичный список папок - используем только динамический

export default function TokenModal({ isOpen, onClose, onSubmit, token = null }) {
  const [formData, setFormData] = useState({
    name: '',
    points: 1,
    conversionAmount: null,
    conversionTargetId: null,
    backgroundColor: 'from-gray-400 to-gray-600',
    textColor: 'text-white',
    image: '',
    imageFolder: 'grey',
    description: '',
    autoDistribution: false,
    autoDistributionPeriod: 'month',
    autoDistributionAmount: 1
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [existingTokens, setExistingTokens] = useState([]);
  const [availableFolders, setAvailableFolders] = useState([]);

  const generateRandomImage = async (folderOverride = null) => {
    // Динамическое получение изображений из папок
    let folder = folderOverride || formData.imageFolder || 'grey';
    
    // Исправляем неправильные значения
    if (folder === 'folders' || folder === 'gray') {
      folder = 'grey';
    }
    
    console.log('generateRandomImage вызвана с папкой:', folder);
    
    try {
      // Получаем список изображений из папки
      console.log(`Запрашиваем изображения из папки: ${folder}`);
      
      const response = await fetch(`/api/tokens/images/${folder}`);
      
      if (response.ok) {
        const images = await response.json();
        console.log(`Получено ${images.length} изображений из папки ${folder}:`, images);
        
        if (images.length > 0) {
          // Выбираем случайное изображение из списка
          const randomIndex = Math.floor(Math.random() * images.length);
          const selectedImage = images[randomIndex];
          console.log(`Выбрано изображение: ${selectedImage}`);
          return selectedImage;
        } else {
          console.log(`Нет изображений в папке ${folder}, возвращаем null для эмодзи`);
          return null; // Возвращаем null для показа эмодзи
        }
      } else {
        console.log(`Ошибка API: ${response.status} ${response.statusText}`);
        return null; // Возвращаем null для показа эмодзи
      }
    } catch (error) {
      console.log('Не удалось получить список изображений из папки:', folder, error);
      return null; // Возвращаем null для показа эмодзи
    }
  };

  const generateRandomDescription = () => {
    const descriptions = [
      "Посмотрите на мою лапку.",
      "Смотрю на мир с другого ракурса.",
      "Покоряю новые высоты!",
      "Высоко сижу, далеко гляжу.",
      "Скоро эта походка покорит не по росту.",
      "Время дегустации!",
      "Открываю огромные возможности!",
      "Первое слово.",
      "Первый зубик.",
      "Догоняй! Сейчас убегу!"
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const loadExistingTokens = async () => {
    try {
      const response = await api.getAdminTokens();
      const tokens = response.data || response || [];
      // Исключаем текущий токен из списка конверсии
      const filteredTokens = token ? tokens.filter(t => t.id !== token.id) : tokens;
      setExistingTokens(filteredTokens);
    } catch (error) {
      console.error('Error loading existing tokens:', error);
      // При ошибке используем пустой массив
      setExistingTokens([]);
    }
  };

  const loadAvailableFolders = async () => {
    try {
      const response = await fetch('/api/tokens/images/folders');
      if (response.ok) {
        const folders = await response.json();
        console.log('Загруженные папки:', folders);
        
        // Используем реальные названия папок
        setAvailableFolders(folders.map(folder => ({
          value: folder,
          label: folder
        })));
      } else {
        console.warn('Не удалось загрузить папки, используем резервные');
        setAvailableFolders([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки папок:', error);
      setAvailableFolders([]);
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

  const createGradientStyle = (baseColor) => {
    const lighterColor = getLighterColor(baseColor);
    return {
      background: `linear-gradient(135deg, ${baseColor} 0%, ${lighterColor} 100%)`
    };
  };

  const extractColorFromGradient = (gradientString) => {
    // Если это уже простой цвет, возвращаем его
    if (gradientString.startsWith('#')) {
      return gradientString;
    }
    // Извлекаем цвет из строки типа "bg-gradient-to-br from-[#6B7280] to-[#9CA3AF]"
    const match = gradientString.match(/from-\[#([A-Fa-f0-9]{6})\]/);
    return match ? `#${match[1]}` : '#6B7280';
  };

  const extractColorFromText = (textString) => {
    // Извлекаем цвет из строки типа "text-[#FFFFFF]"
    const match = textString.match(/text-\[#([A-Fa-f0-9]{6})\]/);
    return match ? `#${match[1]}` : '#FFFFFF';
  };

  // Состояние для отображения цветов в полях
  const [displayBackgroundColor, setDisplayBackgroundColor] = useState('#6B7280');
  const [displayTextColor, setDisplayTextColor] = useState('#FFFFFF');

  // Загружаем данные токена при открытии модального окна
  useEffect(() => {
    const initializeForm = async () => {
      if (isOpen) {
        // Загружаем существующие токены и папки
        await Promise.all([
          loadExistingTokens(),
          loadAvailableFolders()
        ]);

        if (token) {
          // Редактирование существующего токена
          const bgColor = extractColorFromGradient(token.backgroundColor || 'from-gray-400 to-gray-600');
          const txtColor = extractColorFromText(token.textColor || 'text-white');
          
          // Исправляем неправильное значение imageFolder
          let correctedImageFolder = token.imageFolder;
          if (correctedImageFolder === 'folders' || correctedImageFolder === 'gray') {
            correctedImageFolder = 'grey';
          }
          
          setFormData({
            name: token.name || '',
            points: token.points || 1,
            conversionAmount: token.conversionAmount || null,
            conversionTargetId: token.conversionTargetId || null,
            backgroundColor: token.backgroundColor || '#9CA3AF',
            textColor: token.textColor || 'text-white',
            image: token.image || '🐱',
            imageFolder: correctedImageFolder,
            description: token.description || '',
            autoDistribution: token.autoDistribution || false,
            autoDistributionPeriod: token.autoDistributionPeriod || 'month',
            autoDistributionAmount: token.autoDistributionAmount || 1
          });
          
          setDisplayBackgroundColor(bgColor);
          setDisplayTextColor(txtColor);
        } else {
          // Создание нового токена
          const randomImage = await generateRandomImage('grey');
          setFormData({
            name: '',
            points: 1,
            conversionAmount: null,
            conversionTargetId: null,
            backgroundColor: '#9CA3AF',
            textColor: 'text-white',
            image: randomImage || '🎯', // Если null, используем эмодзи
            imageFolder: 'grey',
            description: generateRandomDescription(),
            autoDistribution: false,
            autoDistributionPeriod: 'month',
            autoDistributionAmount: 1
          });
          
          setDisplayBackgroundColor('#6B7280');
          setDisplayTextColor('#FFFFFF');
        }
      }
    };
    
    initializeForm();
  }, [isOpen, token]);

  const getTokenTypeInfo = (formData) => {
    return {
      name: formData.name || 'Неизвестный',
      points: formData.points || 1,
      backgroundColor: formData.backgroundColor || '#9CA3AF',
      textColor: formData.textColor || 'text-white'
    };
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('File selected for upload:', file);
    console.log('File type:', file.type);
    console.log('File size:', file.size);

    // Проверяем размер файла (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showNotification(`Файл слишком большой. Максимальный размер: 10MB. Текущий размер: ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`, 'error');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      console.log('FormData created with file');
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await api.uploadTokenImage(formData);
      console.log('Upload response:', response);
      
      // Обрабатываем разные форматы ответа
      let imageUrl;
      if (response.data?.imageUrl) {
        imageUrl = response.data.imageUrl;
      } else if (response.imageUrl) {
        imageUrl = response.imageUrl;
      } else if (typeof response === 'string') {
        imageUrl = response;
      } else {
        throw new Error('Неверный формат ответа от сервера');
      }

      console.log('Final image URL:', imageUrl);

      setFormData(prev => ({
        ...prev,
        image: imageUrl
      }));

      showNotification('Изображение загружено!', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotification('Ошибка загрузки изображения: ' + error.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Подготавливаем данные для отправки в базу
      const tokenData = {
        name: formData.name,
        points: formData.points,
        value: formData.points, // Используем points как value
        color: 'gray', // Используем стандартный цвет
        conversionAmount: formData.conversionAmount,
        conversionTargetId: formData.conversionTargetId,
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        image: formData.image,
        imageFolder: formData.imageFolder,
        description: formData.description,
        autoDistribution: formData.autoDistribution,
        autoDistributionPeriod: formData.autoDistributionPeriod,
        autoDistributionAmount: formData.autoDistributionAmount
      };
      
      if (token?.id) {
        // Обновление существующего токена
        await api.updateAdminToken(token.id, tokenData);
        showNotification('Токен обновлен!', 'success');
      } else {
        // Создание нового токена
        await api.createAdminToken(tokenData);
        showNotification('Новый токен создан!', 'success');
      }
      
      // Очищаем кэш для токенов
      api.clearCacheFor('/admin/tokens');
      
      onSubmit?.();
      onClose();
    } catch (error) {
      console.error('Error saving token:', error);
      showNotification('Ошибка сохранения токена', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {token ? 'Редактировать токен' : 'Создать новый токен'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="token-form" className="space-y-4" onSubmit={handleSubmit}>
            {/* Превью токена */}
            <div className="flex justify-center mb-6">
              <div className="w-full flex flex-col items-center shadow-lg" style={{ 
                aspectRatio: '1/1.414', 
                height: 'auto', 
                borderRadius: '0.5rem', 
                maxWidth: '320px',
                ...createGradientStyle(formData.backgroundColor)
              }}>
                {formData.image && formData.image !== '🎯' && (formData.image.startsWith('http') || formData.image.startsWith('/uploads/')) ? (
                  <img 
                    src={formData.image.startsWith('http') ? formData.image : `${formData.image}`}
                    alt="Token preview" 
                    style={{ 
                      margin: '2rem',
                      border: '2px solid rgba(255, 255, 255, 0.8)',
                      borderRadius: '0.5rem',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      width: 'calc(100% - 4rem)',
                      aspectRatio: '1/1',
                      objectFit: 'contain'
                    }}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      // При ошибке загрузки изображения заменяем на эмодзи
                      e.target.style.display = 'none';
                      const emojiDiv = e.target.nextSibling;
                      if (emojiDiv) {
                        emojiDiv.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    margin: '2rem',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    width: 'calc(100% - 4rem)',
                    aspectRatio: '1/1',
                    fontSize: '10rem',
                    display: formData.image && formData.image !== '🎯' && (formData.image.startsWith('http') || formData.image.startsWith('/uploads/')) ? 'none' : 'flex'
                  }}
                >
                  {formData.image && !formData.image.startsWith('http') && !formData.image.startsWith('/uploads/') ? formData.image : '🎯'}
                </div>
                <div className="w-full flex flex-col flex-1">
                  {formData.description && (
                    <div className="flex-1 flex items-center justify-center" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                      <h3 
                        className="font-bold leading-tight text-center" 
                        style={{ 
                          fontSize: '1.3rem', 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden',
                          color: formData.textColor && formData.textColor.startsWith('#') ? formData.textColor : 
                                 formData.textColor === 'text-white' ? '#ffffff' : 
                                 formData.textColor === 'text-black' ? '#000000' : '#ffffff'
                        }}
                      >
                        {formData.description}
                      </h3>
                    </div>
                  )}
                  <div className="flex items-center justify-center" style={{ paddingLeft: '4px', paddingRight: '4px', paddingBottom: '2rem' }}>
                    <h2 
                      className="font-bold" 
                      style={{ 
                        fontSize: '1.5rem',
                        color: formData.textColor && formData.textColor.startsWith('#') ? formData.textColor : 
                               formData.textColor === 'text-white' ? '#ffffff' : 
                               formData.textColor === 'text-black' ? '#000000' : '#ffffff'
                      }}
                    >
                      {getPointsText(formData.points)}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Название токена и количество очков */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название токена *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Введите название токена"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Количество очков *</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Конверсия */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Количество для конверсии</label>
                <input
                  type="number"
                  value={formData.conversionAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, conversionAmount: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  min="1"
                  placeholder="Не указано"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Конвертировать в</label>
                <select
                  value={formData.conversionTargetId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, conversionTargetId: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Не выбрано</option>
                  {existingTokens.map(token => (
                    <option key={token.id} value={token.id}>
                      {token.name} ({getPointsText(token.points || token.value)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Цвета */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Цвет фона</label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayBackgroundColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setDisplayBackgroundColor(color);
                      setFormData(prev => ({ 
                        ...prev, 
                        backgroundColor: color
                      }));
                    }}
                    className="w-full px-3 py-2 pr-10 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="#6B7280"
                  />
                  <input
                    type="color"
                    value={displayBackgroundColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setDisplayBackgroundColor(color);
                      setFormData(prev => ({ 
                        ...prev, 
                        backgroundColor: color
                      }));
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 border border-gray/300 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Цвет текста</label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayTextColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setDisplayTextColor(color);
                      setFormData(prev => ({ 
                        ...prev, 
                        textColor: `text-[${color}]` 
                      }));
                    }}
                    className="w-full px-3 py-2 pr-10 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="#FFFFFF"
                  />
                  <input
                    type="color"
                    value={displayTextColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setDisplayTextColor(color);
                      setFormData(prev => ({ 
                        ...prev, 
                        textColor: `text-[${color}]` 
                      }));
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 border border-gray/300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Папка иллюстраций */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Папка иллюстраций</label>
              <select
                value={formData.imageFolder}
                onChange={async (e) => {
                  const selectedFolder = e.target.value;
                  setFormData(prev => ({ ...prev, imageFolder: selectedFolder }));
                  
                  // Генерируем новое изображение для новой папки
                  const randomImage = await generateRandomImage(selectedFolder);
                  setFormData(prev => ({ 
                    ...prev, 
                    image: randomImage || '🎯'
                  }));
                }}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {availableFolders.length > 0 ? (
                  availableFolders.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                ) : (
                  <option value="">Загрузка папок...</option>
                )}
              </select>
            </div>

            {/* Изображение */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
              <p className="text-xs text-gray-500 mb-2">Максимальный размер файла: 10MB</p>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="token-image-upload"
                />
                <label
                  htmlFor="token-image-upload"
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-[8px] hover:bg-gray-200 cursor-pointer flex items-center justify-center gap-2 transition-colors"
                >
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Загрузить изображение
                    </>
                  )}
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    console.log('Кнопка "Случайное" нажата');
                    console.log('Текущая папка:', formData.imageFolder);
                    const randomImage = await generateRandomImage(formData.imageFolder);
                    console.log('Получено случайное изображение:', randomImage);
                    setFormData(prev => ({ 
                      ...prev, 
                      image: randomImage || '🎯' // Если null, используем эмодзи
                    }));
                  }}
                  className="px-3 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
                >
                  Случайное
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    console.log('Тестирование структуры папок...');
                    try {
                      const response = await fetch('/api/tokens/images-test');
                      const data = await response.json();
                      console.log('Структура папок:', data);
                    } catch (error) {
                      console.error('Ошибка тестирования:', error);
                    }
                  }}
                  className="px-3 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
                >
                  Тест
                </button>
              </div>
            </div>

            {/* Автоматическое распределение */}
            <div className="border border-gray/20 rounded-lg p-4">
              <div className="mb-4">
                <Checkbox
                  id="auto-distribution"
                  checked={formData.autoDistribution}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoDistribution: e.target.checked }))}
                  label="Автоматическое распределение"
                />
              </div>
              
              {formData.autoDistribution && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
                    <input
                      type="number"
                      value={formData.autoDistributionAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, autoDistributionAmount: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Периодичность</label>
                    <select
                      value={formData.autoDistributionPeriod}
                      onChange={(e) => setFormData(prev => ({ ...prev, autoDistributionPeriod: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {periodOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание (необязательно)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Введите описание токена (необязательно)..."
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, description: generateRandomDescription() }))}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Случайное описание
              </button>
            </div>
          </form>
        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="token-form"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Сохранение...' : (token ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 