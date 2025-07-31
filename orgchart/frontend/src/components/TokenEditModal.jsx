import React, { useState, useEffect } from 'react';
import { X, Upload, Image, Type, Save, Plus, Minus } from 'lucide-react';
import { getPointsText } from '../utils/dateUtils';
import api from '../services/api';
import { showNotification } from '../utils/notifications';
import Checkbox from './ui/Checkbox';

export default function TokenEditModal({ isOpen, onClose, onSubmit, token = null }) {
  const [formData, setFormData] = useState({
    name: '',
    points: 1,
    conversionAmount: null,
    conversionTargetId: null,
    backgroundColor: '#9CA3AF',
    textColor: 'text-white',
    image: '🎯',
    imageFolder: 'gray',
    description: '',
    autoDistribution: false,
    autoDistributionPeriod: 'month',
    autoDistributionAmount: 1
  });
  
  const [displayBackgroundColor, setDisplayBackgroundColor] = useState('#9CA3AF');
  const [displayTextColor, setDisplayTextColor] = useState('#FFFFFF');
  const [existingTokens, setExistingTokens] = useState([]);
  const [availableFolders, setAvailableFolders] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const periodOptions = [
    { value: 'week', label: 'Еженедельно' },
    { value: 'month', label: 'Ежемесячно' },
    { value: 'quarter', label: 'Ежеквартально' },
    { value: 'half_year', label: 'Раз в полгода' },
    { value: 'year', label: 'Ежегодно' }
  ];

  // Убираем статичный список папок - теперь используем только динамический

  const generateRandomImage = async (folderOverride = null) => {
    try {
      const folder = folderOverride || formData.imageFolder || 'grey';
      
      // Исправляем папку grey на правильное название
      const correctedFolder = folder === 'grey' ? 'grey' : folder;
      
      const response = await api.get(`/api/tokens/random-image?folder=${correctedFolder}`);
      if (response && response.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: response.imageUrl }));
      }
    } catch (error) {
      console.error('Ошибка при генерации случайного изображения:', error);
    }
  };

  const generateRandomDescription = () => {
    const descriptions = [
      "Отличная работа!",
      "Превосходно!",
      "Молодец!",
      "Так держать!",
      "Выдающийся результат!",
      "Блестяще!",
      "Потрясающе!",
      "Фантастика!",
      "Невероятно!",
      "Превосходно!"
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const loadExistingTokens = async () => {
    try {
      const response = await api.getAdminTokens();
      setExistingTokens(response);
    } catch (error) {
      console.error('Error loading existing tokens:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await api.get('/api/tokens/folders');
      const folders = response || [];
      
      const mappedFolders = folders.map(folder => ({
        value: folder,
        label: folder.charAt(0).toUpperCase() + folder.slice(1)
      }));
      
      setAvailableFolders(mappedFolders);
    } catch (error) {
      console.error('Ошибка при загрузке папок:', error);
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

  useEffect(() => {
    const initializeForm = () => {
      if (token) {
        // Исправляем неправильные значения imageFolder
        let correctedImageFolder = token.imageFolder;
        if (correctedImageFolder === 'folders' || correctedImageFolder === 'gray') {
          correctedImageFolder = 'grey';
        }
        
        const formDataToSet = {
          name: token.name || '',
          description: token.description || '',
          points: token.points || 0,
          color: token.color || '#E42E0F',
          textColor: token.textColor || 'text-white',
          imageUrl: token.imageUrl || '',
          imageFolder: correctedImageFolder || 'grey',
          tokenType: token.tokenType || 'regular',
          isActive: token.isActive !== undefined ? token.isActive : true
        };
        
        setFormData(formDataToSet);
      } else {
        const newFormData = {
          name: '',
          description: '',
          points: 0,
          color: '#E42E0F',
          textColor: 'text-white',
          imageUrl: '',
          imageFolder: 'grey',
          tokenType: 'regular',
          isActive: true
        };
        
        setFormData(newFormData);
      }
    };

    if (isOpen) {
      initializeForm();
      loadExistingTokens();
      loadFolders();
    }
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

      const response = await api.uploadTokenImage(formData);
      
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

  const handleClearImage = () => {
    setFormData(prev => ({
      ...prev,
      image: '🎯'
    }));
  };

  const handleRandomImage = async (folder) => {
    const randomImage = await generateRandomImage(folder);
    setFormData(prev => ({ 
      ...prev, 
      image: randomImage || '🎯' // Если null, используем эмодзи
    }));
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

  const handleClose = () => {
    // Очищаем данные формы при закрытии
    setFormData({
      name: '',
      points: 1,
      conversionAmount: null,
      conversionTargetId: null,
      backgroundColor: '#9CA3AF',
      textColor: 'text-white',
      image: '🎯',
      imageFolder: 'grey',
      description: '',
      autoDistribution: false,
      autoDistributionPeriod: 'month',
      autoDistributionAmount: 1
    });
    setDisplayBackgroundColor('#9CA3AF');
    setDisplayTextColor('#FFFFFF');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {token ? 'Редактировать токен' : 'Создать новый токен'}
          </h3>
          <button
            onClick={handleClose}
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
                    alt="" 
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
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
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
                        textColor: color
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
                        textColor: color
                      }));
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 border border-gray/300 rounded cursor-pointer"
                  />
                </div>
              </div>
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
                {formData.image && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Очистить изображение"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Случайные изображения */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Случайное изображение</label>
              <div className="grid grid-cols-3 gap-2">
                {availableFolders.map(folder => (
                  <button
                    key={folder.value}
                    type="button"
                    onClick={() => handleRandomImage(folder.value)}
                    className="px-3 py-2 text-sm border border-gray/20 rounded-[8px] hover:bg-gray/10 transition-colors capitalize"
                  >
                    {folder.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Введите описание токена"
                rows="3"
              />
            </div>

            {/* Автоматическое распределение */}
            <div className="border-t border-gray/20 pt-4">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Автоматическое распределение</h4>
                  <p className="text-xs text-gray-500">Автоматически выдавать токены сотрудникам</p>
                </div>
                  <Checkbox
                    checked={formData.autoDistribution}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoDistribution: e.target.checked }))}
                  />
                </div>
              </div>

              {formData.autoDistribution && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Период</label>
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
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
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