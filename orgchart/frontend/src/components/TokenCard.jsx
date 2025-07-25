import React, { useState, useEffect, useRef } from 'react';
import { Eye, X, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import { getPointsText } from '../utils/dateUtils';
import Button from './ui/Button';

const TokenCard = ({ token, onClick, isFlipped = false, isModal = false, size = 'normal', imageSizeOverride, backContent }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Функция для извлечения цвета из textColor
  const extractTextColor = (textColor) => {
    if (!textColor) return '#ffffff';
    if (textColor.startsWith('#')) return textColor;
    if (textColor.startsWith('text-[')) {
      const match = textColor.match(/text-\[#([A-Fa-f0-9]{6})\]/);
      return match ? `#${match[1]}` : '#ffffff';
    }
    if (textColor === 'text-white') return '#ffffff';
    if (textColor === 'text-black') return '#000000';
    return '#ffffff';
  };

  // Определяем размеры в зависимости от пропса size
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: '213px',
          height: '213px', // Делаем квадратным
          fontSize: '0.9rem',
          descriptionFontSize: '1rem',
          pointsFontSize: '1.2rem'
        };
      case 'large':
        return {
          width: '480px',
          height: '480px', // Делаем квадратным
          fontSize: '1.6rem',
          descriptionFontSize: '1.4rem',
          pointsFontSize: '1.8rem'
        };
      default: // normal
        return {
          width: '320px',
          height: '320px', // Делаем квадратным
          fontSize: '1.3rem',
          descriptionFontSize: '1.3rem',
          pointsFontSize: '1.5rem'
        };
    }
  };

  const sizeStyles = getSizeStyles();
  let imageSize = imageSizeOverride;
  if (!imageSize) {
    if (size === 'large') imageSize = 'calc(100% - 4rem)';
    else if (size === 'normal') imageSize = 'calc(100% - 2.5rem)';
    else imageSize = 'calc(100% - 1.5rem)';
  }

  const getTokenTypeInfo = (token) => {
    if (!token) return { 
      name: 'Неизвестный', 
      color: { background: 'linear-gradient(135deg, #374151 0%, #111827 100%)' }, 
      value: 1000,
      textColor: '#ffffff'
    };

    // 1. Используем backgroundColor прямо из token (для шаблонов)
    if (token.backgroundColor) {
      if (token.backgroundColor.startsWith('#')) {
        const lighterColor = getLighterColor(token.backgroundColor);
        return {
          name: token.name || 'Неизвестный',
          color: { background: `linear-gradient(135deg, ${token.backgroundColor} 0%, ${lighterColor} 100%)` },
          value: token.value || token.points || 1,
          textColor: extractTextColor(token.textColor || token.tokenType?.textColor) || '#ffffff'
        };
      } else {
        return {
          name: token.name || 'Неизвестный',
          color: { background: token.backgroundColor },
          value: token.value || token.points || 1,
          textColor: extractTextColor(token.textColor || token.tokenType?.textColor) || '#ffffff'
        };
      }
    }

    // 2. Если есть tokenType с backgroundColor (для вручённых токенов)
    if (token.tokenType?.backgroundColor) {
      if (token.tokenType.backgroundColor.startsWith('#')) {
        const lighterColor = getLighterColor(token.tokenType.backgroundColor);
        return {
          name: token.tokenType.name || 'Неизвестный',
          color: { background: `linear-gradient(135deg, ${token.tokenType.backgroundColor} 0%, ${lighterColor} 100%)` },
          value: token.tokenType.value || 1,
          textColor: extractTextColor(token.textColor || token.tokenType.textColor) || '#ffffff'
        };
      } else {
        return {
          name: token.tokenType.name || 'Неизвестный',
          color: { background: token.tokenType.backgroundColor },
          value: token.tokenType.value || 1,
          textColor: extractTextColor(token.textColor || token.tokenType.textColor) || '#ffffff'
        };
      }
    }

    // 3. Fallback - используем поле name из tokenType для определения цвета и значения
    const tokenTypeName = token.tokenType?.name || token.name || 'Неизвестный';
    switch (tokenTypeName.toLowerCase()) {
      case 'серый':
      case 'gray':
      case 'grey':
        return { 
          name: 'Серый', 
          color: { background: 'linear-gradient(135deg, #374151 0%, #111827 100%)' }, 
          value: 1000,
          textColor: '#ffffff'
        };
      case 'красный':
      case 'red':
        return { 
          name: 'Красный', 
          color: { background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }, 
          value: 100,
          textColor: '#ffffff'
        };
      case 'желтый':
      case 'yellow':
        return { 
          name: 'Желтый', 
          color: { background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)' }, 
          value: 10,
          textColor: '#ffffff'
        };
      case 'белый':
      case 'platinum':
      case 'white':
        return { 
          name: 'Белый', 
          color: { background: 'linear-gradient(135deg, #9CA3AF 0%, #FFFFFF 100%)' }, 
          value: 1,
          textColor: '#1e293b'
        };
      default:
        return { 
          name: 'Неизвестный', 
          color: { background: 'linear-gradient(135deg, #374151 0%, #111827 100%)' }, 
          value: 1000,
          textColor: '#ffffff'
        };
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

  const typeInfo = getTokenTypeInfo(token);

  // Генерация QR-кода
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Создаем хешированный идентификатор токена
        const tokenHash = btoa(`${token.id}-${token.receivedAt || Date.now()}`).replace(/[+/=]/g, '');
        const tokenReceiveUrl = `${window.location.origin}/receive-token/${tokenHash}`;
        
        const qrUrl = await QRCode.toDataURL(tokenReceiveUrl, {
          width: 128,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (token) {
      generateQRCode();
    }
  }, [token]);

  return (
    <div 
      className={`cursor-pointer transform transition-all duration-200 ${!isModal ? 'hover:scale-105 hover:shadow-lg' : ''}`}
      onClick={onClick}
      style={{ 
        perspective: '1000px',
        width: sizeStyles.width,
        height: sizeStyles.height,
        position: 'relative'
      }}
    >
      {/* Контейнер для 3D переворота */}
      <div 
        style={{ 
          position: 'absolute',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'none',
          transition: 'transform 0.6s ease-in-out',
          transformOrigin: 'center center'
        }}
      >
        {/* Передняя сторона токена */}
        <div 
          className="rounded-lg flex flex-col items-center text-2xl text-white absolute" 
          style={{ 
            width: sizeStyles.width, 
            height: sizeStyles.height, 
            background: typeInfo.color.background,
            backfaceVisibility: 'hidden',
            top: '0',
            left: '0'
          }}
        >
          {/* Описание и очки на токене */}
          <div className="w-full flex flex-col flex-1 justify-center items-center">
            {size === 'large' ? (
              token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? (
                <img 
                  src={token.image.startsWith('http') ? token.image : `${token.image}`}
                  alt="" 
                  className="m-8 border-2 border-white/80 rounded-[12px] object-contain bg-white/70 w-[calc(100%-4rem)] h-[calc(100%-4rem)]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const emojiDiv = e.target.nextSibling;
                    if (emojiDiv) {
                      emojiDiv.style.display = 'flex';
                    }
                  }}
                />
              ) : null
            ) : (
              token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? (
                <img 
                  src={token.image.startsWith('http') ? token.image : `${token.image}`}
                  alt="" 
                  className="m-4 border-2 border-white/80 rounded-[12px] object-contain bg-white/70 w-[calc(100%-2rem)] h-[calc(100%-2rem)]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const emojiDiv = e.target.nextSibling;
                    if (emojiDiv) {
                      emojiDiv.style.display = 'flex';
                    }
                  }}
                />
              ) : null
            )}
          </div>
        </div>

        {/* Тыльная сторона токена */}
        <div 
          className="rounded-lg flex flex-col items-center text-2xl absolute bg-white" 
          style={{ 
            width: sizeStyles.width, 
            height: sizeStyles.height, 
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            top: '0',
            left: '0'
          }}
        >
          {backContent ? backContent : (
            // QR-код и информация на тыльной стороне
            <div className="w-full h-full flex flex-col items-center justify-center p-6">
              <div className="text-center flex flex-col items-center justify-center h-full">
                {/* QR-код */}
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4 border border-gray-300">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-42 h-42"
                    />
                  ) : (
                    <div className="text-gray-500 text-xs text-center">
                      Загрузка QR-кода...
                    </div>
                  )}
                </div>
                
                {/* Информация о токене */}
                <h3 className="font-bold text-lg mb-3 text-gray-900">
                  Одноразовый код получения токена
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenCard;

// Компонент для стопки токенов с наложением
export function TokenStack({ tokens, onTokenClick, maxVisible = 10, onShowAll, extraClassName = '' }) {
  const visibleTokens = tokens.slice(0, maxVisible);
  const remainingCount = tokens.length - maxVisible;

  // Вычисляем адаптивную ширину стопки на основе количества видимых токенов
  const stackWidth = 213 + (visibleTokens.length - 1) * 80; // базовая ширина токена + смещения
  const stackHeight = 213; // квадратная высота токена

  return (
    <div className="relative" style={{ width: `${stackWidth}px`, height: `${stackHeight}px` }}>
      {visibleTokens.map((token, index) => (
        <div
          key={token.id || index}
          className="absolute"
          style={{
            transform: `translateX(${index * 80}px)`,
            zIndex: visibleTokens.length - index,
            transition: 'all 0.3s ease'
          }}
        >
          <TokenCard
            token={token}
            onClick={() => onTokenClick(token, index)}
            size="small"
          />
        </div>
      ))}
      {/* Кликабельная подпись количества скрытых токенов */}
      {remainingCount > 0 && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
          <button
            className={`inline-flex items-center justify-center bg-gray hover:bg-secondary text-dark hover:text-white rounded-lg px-3 py-1 font-semibold text-xs transition-colors shadow-sm cursor-pointer ${extraClassName}`}
            onClick={() => onShowAll ? onShowAll(tokens) : null}
            type="button"
          >
            + ещё {remainingCount}
          </button>
        </div>
      )}
    </div>
  );
} 