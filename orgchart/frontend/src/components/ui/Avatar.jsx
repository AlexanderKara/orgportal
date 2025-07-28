import React, { useState, useContext, useMemo } from 'react';
import { Camera } from 'lucide-react';
import AvatarCropModal from '../AvatarCropModal';
import helmetSvg from '../../res/helmet.svg';
import { SettingsContext } from '../../contexts/SettingsContext';

const sizeConfig = {
  xs: {
    size: 'w-8 h-8',
    textSize: 'text-xs',
    iconSize: 'w-12 h-12',
    px: 32,
    overlayPx: 48,
    overlayOffsetY: -2
  },
  sm: {
    size: 'w-12 h-12',
    textSize: 'text-sm',
    iconSize: 'w-18 h-18',
    px: 48,
    overlayPx: 64,
    overlayOffsetY: -4
  },
  md: {
    size: 'w-16 h-16',
    textSize: 'text-base',
    iconSize: 'w-24 h-24',
    px: 64,
    overlayPx: 88,
    overlayOffsetY: -6
  },
  lg: {
    size: 'w-20 h-20',
    textSize: 'text-lg',
    iconSize: 'w-28 h-28',
    px: 80,
    overlayPx: 112,
    overlayOffsetY: -7
  },
  xl: {
    size: 'w-24 h-24',
    textSize: 'text-xl',
    iconSize: 'w-32 h-32',
    px: 96,
    overlayPx: 128,
    overlayOffsetY: -9
  },
  '2xl': {
    size: 'w-32 h-32',
    textSize: 'text-2xl',
    iconSize: 'w-40 h-40',
    px: 128,
    overlayPx: 160,
    overlayOffsetY: -10
  },
  '3xl': {
    size: 'w-40 h-40',
    textSize: 'text-3xl',
    iconSize: 'w-48 h-48',
    px: 160,
    overlayPx: 192,
    overlayOffsetY: -12
  },
  '40': {
    size: 'w-10 h-10',
    textSize: 'text-sm',
    iconSize: 'w-14 h-14',
    px: 40,
    overlayPx: 56,
    overlayOffsetY: -2
  }
};

export default function Avatar({
  src = '',
  name = '',
  size = 'md',
  clickable = false,
  onAvatarChange,
  className = '',
  disabled = false,
  roleInDept = ''
}) {
  // Генерируем уникальный ID для этого экземпляра Avatar
  const avatarId = useMemo(() => `avatar-${name}-${Math.random().toString(36).substr(2, 9)}`, [name]);
  
  const settingsContext = useContext(SettingsContext);
  const showHelmetOverlay = settingsContext?.settings?.showHelmetOverlay ?? true;
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [croppedImage, setCroppedImage] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  const config = sizeConfig[size];

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const trimmedName = name.trim();
    if (!trimmedName) return '?';
    
    // Разделяем по пробелам и берем первые буквы каждого слова
    const words = trimmedName.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '?';
    
    // Берем первые буквы первых двух слов (имя и фамилия)
    const initials = words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
    return initials;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Сбрасываем предыдущее состояние
      setSelectedImageFile(null);
      setShowCropModal(false);
      
      // Устанавливаем новое изображение
      setSelectedImageFile(file);
      setShowCropModal(true);
      e.target.value = '';
    }
  };

  const handleCropSave = async (cropData) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        const canvasSize = cropData.size;
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        // Координаты и размеры для обрезки
        const sx = cropData.x;
        const sy = cropData.y;
        const sSize = cropData.size;

        // Если исходное изображение меньше crop area — центрируем его на белом фоне
        if (img.naturalWidth < canvasSize || img.naturalHeight < canvasSize) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvasSize, canvasSize);
          const dx = (canvasSize - img.naturalWidth) / 2;
          const dy = (canvasSize - img.naturalHeight) / 2;
          ctx.drawImage(
            img,
            0, 0, img.naturalWidth, img.naturalHeight,
            dx, dy, img.naturalWidth, img.naturalHeight
          );
        } else {
          // Обычное обрезание
          ctx.drawImage(
            img,
            sx, sy, sSize, sSize,
            0, 0, canvasSize, canvasSize
          );
        }
        const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
        
        setCroppedImage(croppedDataUrl);
        
        // Сразу вызываем onAvatarChange для сохранения в БД
        if (onAvatarChange) {
          onAvatarChange(croppedDataUrl);
        }
        
        resolve();
      };
      img.src = URL.createObjectURL(selectedImageFile);
    });
  };

  const handleClick = (e) => {
    if (clickable && !disabled) {
      e.stopPropagation();
      document.getElementById(`avatar-input-${avatarId}`).click();
    }
  };

  // Use cropped image if available, otherwise use src
  const displayImage = croppedImage || src;

  // Check if should show helmet overlay
  const shouldShowHelmet = showHelmetOverlay && roleInDept === 'lead';

  return (
    <>
      <div className={`relative ${className}`}
        style={{ width: config.px, height: config.px }}
      >
        <div 
          className={`relative rounded-full overflow-hidden ${
            clickable && !disabled ? 'cursor-pointer' : ''
          }`}
          style={{ width: config.px, height: config.px }}
          onClick={handleClick}
        >
          {displayImage ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
              <img 
                src={displayImage} 
                alt={name || 'Avatar'} 
                className="w-full h-full object-cover"
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                style={{ display: imageLoading ? 'none' : 'block', width: config.px, height: config.px }}
              />
            </>
          ) : (
            <div className="w-full h-full bg-[#E42E0F] flex items-center justify-center text-white font-semibold">
              <span className={config.textSize}>{getInitials(name)}</span>
            </div>
          )}
          {clickable && !disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <Camera className={`${config.iconSize} text-white opacity-0 hover:opacity-100 transition-opacity duration-200`} />
            </div>
          )}
        </div>
        {/* Helmet overlay for leads - outside the overflow-hidden container */}
        {shouldShowHelmet && (
          <div className="absolute flex items-center justify-center pointer-events-none" style={{ 
            zIndex: 50,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: config.overlayPx,
            height: config.overlayPx,
            marginTop: config.overlayOffsetY
          }}>
            <img 
              src={helmetSvg} 
              alt="Lead" 
              style={{ width: config.overlayPx, height: config.overlayPx }}
            />
          </div>
        )}
        <input
          id={`avatar-input-${avatarId}`}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      {/* Модальное окно обрезки аватара */}
      <AvatarCropModal
        key={avatarId}
        isOpen={showCropModal}
        onClose={() => {
          setShowCropModal(false);
          setSelectedImageFile(null);
        }}
        onSave={handleCropSave}
        imageFile={selectedImageFile}
      />
    </>
  );
} 