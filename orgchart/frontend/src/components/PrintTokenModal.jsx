import React, { useState, useEffect } from 'react';
import { X, Printer, Download, QrCode } from 'lucide-react';
import { getPointsText } from '../utils/dateUtils';
import { showNotification } from '../utils/notifications';
import QRCode from 'qrcode';

export default function PrintTokenModal({ isOpen, onClose, token }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState('');
  const [isGeneratingQR, setIsGeneratingQR] = React.useState(false);
  const scaleFactor = 0.781; // Фиксированный коэффициент: 250px/320px для PrintTokenModal

  const generateQRCode = async () => {
    if (!token) return;
    
    setIsGeneratingQR(true);
    try {
      // Создаем уникальную ссылку для подтверждения добавления токена
      const confirmationUrl = `${window.location.origin}/confirm-token/${token.id}`;
      const qrDataUrl = await QRCode.toDataURL(confirmationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Ошибка генерации QR-кода:', error);
      showNotification('Ошибка генерации QR-кода', 'error');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      generateQRCode();
    }
  }, [isOpen, token]);

  const getTokenTypeInfo = (token) => {
    if (!token) return { name: 'Неизвестный', color: 'bg-gradient-gray', value: 1000 };
    
    // Если есть backgroundColor в token, используем его (из формы создания)
    if (token.backgroundColor) {
      if (token.backgroundColor.startsWith('#')) {
        return {
          name: token.name || 'Неизвестный',
          color: `bg-gradient-to-br from-[${token.backgroundColor}] to-[${getLighterColor(token.backgroundColor)}]`,
          value: token.value || 1
        };
      } else {
        return {
          name: token.name || 'Неизвестный',
          color: token.backgroundColor,
          value: token.value || 1
        };
      }
    }
    
    // Если есть backgroundColor в tokenType, используем его (fallback)
    if (token.tokenType?.backgroundColor) {
      if (token.tokenType.backgroundColor.startsWith('#')) {
        return {
          name: token.tokenType.name || 'Неизвестный',
          color: `bg-gradient-to-br from-[${token.tokenType.backgroundColor}] to-[${getLighterColor(token.tokenType.backgroundColor)}]`,
          value: token.tokenType.value || 1
        };
      } else {
        return {
          name: token.tokenType.name || 'Неизвестный',
          color: token.tokenType.backgroundColor,
          value: token.tokenType.value || 1
        };
      }
    }
    
    // Fallback - используем поле name из tokenType для определения цвета и значения
    const tokenTypeName = token.tokenType?.name || 'Неизвестный';
    switch (tokenTypeName.toLowerCase()) {
      case 'золотой':
        return { name: 'Золотой', color: 'bg-gradient-to-br from-yellow-400 to-yellow-600', value: 1000 };
      case 'серебряный':
        return { name: 'Серебряный', color: 'bg-gradient-to-br from-gray-300 to-gray-500', value: 500 };
      case 'бронзовый':
        return { name: 'Бронзовый', color: 'bg-gradient-to-br from-orange-400 to-orange-600', value: 250 };
      case 'платиновый':
        return { name: 'Платиновый', color: 'bg-gradient-to-br from-blue-300 to-blue-500', value: 2000 };
      default:
        return { name: 'Неизвестный', color: 'bg-gradient-gray', value: 1000 };
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

  // Функция для расчета размеров на основе коэффициента
  const getScaledSize = (originalSize) => {
    return originalSize * scaleFactor;
  };

  const handleCreateLayout = () => {
    try {
      // Создаем печатный макет
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        showNotification('Пожалуйста, разрешите всплывающие окна для создания макета', 'error');
        return;
      }

      // Получаем данные токена
      const tokenInfo = getTokenTypeInfo(token);
      
      // Создаем HTML для печати
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Печатный макет токена - ${token.name}</title>
          <style>
            @media print {
              body { margin: 0; }
              .token-card { page-break-inside: avoid; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .print-container {
              display: flex;
              flex-direction: column;
              gap: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .token-card {
              width: 320px;
              height: 452px;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              margin: 0 auto;
            }
            .token-front {
              background: ${tokenInfo.color.background || 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'};
              color: ${token.textColor ? (token.textColor.startsWith('#') ? token.textColor : 
                       token.textColor === 'text-white' ? '#ffffff' : 
                       token.textColor === 'text-black' ? '#000000' : '#ffffff') : '#ffffff'};
            }
            .token-back {
              background: white;
              border: 2px solid #e5e7eb;
            }
            .token-image {
              margin: 2rem;
              border: 2px solid rgba(255, 255, 255, 0.8);
              border-radius: 8px;
              background: rgba(255, 255, 255, 0.7);
              width: calc(100% - 4rem);
              aspect-ratio: 1/1;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10rem;
            }
            .token-description {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0 2rem;
              text-align: center;
              font-weight: bold;
              font-size: 1.3rem;
              line-height: 1.2;
            }
            .token-points {
              padding: 0 4px 2rem;
              text-align: center;
              font-weight: bold;
              font-size: 1.5rem;
            }
            .qr-code {
              width: 128px;
              height: 128px;
              margin: 2rem auto;
            }
            .qr-info {
              text-align: center;
              color: #6b7280;
              font-size: 0.75rem;
              margin-top: 1rem;
            }
            .token-info {
              background: #f9fafb;
              padding: 1rem;
              border-radius: 8px;
              margin-bottom: 1rem;
            }
            .token-info h3 {
              margin: 0 0 0.5rem 0;
              color: #374151;
              font-size: 1rem;
            }
            .token-info p {
              margin: 0.25rem 0;
              color: #6b7280;
              font-size: 0.875rem;
            }
            .print-header {
              text-align: center;
              margin-bottom: 2rem;
              padding-bottom: 1rem;
              border-bottom: 2px solid #e5e7eb;
            }
            .print-header h1 {
              margin: 0;
              color: #374151;
              font-size: 1.5rem;
            }
            .print-header p {
              margin: 0.5rem 0 0 0;
              color: #6b7280;
              font-size: 0.875rem;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="print-header">
              <h1>Печатный макет токена</h1>
              <p>Создан: ${new Date().toLocaleDateString('ru-RU')}</p>
            </div>
            
            <div class="token-info">
              <h3>Информация о токене</h3>
              <p><strong>Название:</strong> ${token.name}</p>
              <p><strong>Тип:</strong> ${tokenInfo.name}</p>
              <p><strong>Ценность:</strong> ${token.points || tokenInfo.value} очков</p>
              <p><strong>Описание:</strong> ${token.description || 'Не указано'}</p>
            </div>
            
            <div style="display: flex; gap: 40px; justify-content: center;">
              <!-- Лицевая сторона -->
              <div class="token-card token-front">
                <div class="token-image">
                  ${token.image && token.image !== '🎯' ? 
                    `<img src="${token.image.startsWith('http') ? token.image : `${token.image}`}" 
                          style="width: 100%; height: 100%; object-fit: contain;" 
                          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 10rem;">
                       ${token.image && !token.image.startsWith('http') && !token.image.startsWith('/uploads/') ? token.image : '🎯'}
                     </div>
                    </img>` : 
                    `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10rem;">
                       ${token.image && !token.image.startsWith('http') && !token.image.startsWith('/uploads/') ? token.image : '🎯'}
                     </div>`
                  }
                </div>
                ${token.description ? `<div class="token-description">${token.description}</div>` : ''}
                <div class="token-points">${token.points || tokenInfo.value} очков</div>
              </div>
              
              <!-- Обратная сторона -->
              <div class="token-card token-back">
                <div style="text-align: center; padding: 2rem;">
                  <div class="qr-code">
                    <img src="${qrCodeDataUrl}" alt="QR код для подтверждения токена" style="width: 100%; height: 100%;">
                  </div>
                  <div class="qr-info">
                    <p><strong>QR-код для подтверждения</strong></p>
                    <p>Сканируйте для добавления токена</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Ждем загрузки изображений и QR-кода
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
      
      showNotification('Печатный макет создан! Откройте диалог печати', 'success');
    } catch (error) {
      console.error('Ошибка создания печатного макета:', error);
      showNotification('Ошибка создания печатного макета', 'error');
    }
  };

  if (!isOpen || !token) return null;

  return (
    <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <div>
            <h3 className="text-lg font-semibold text-dark">
              Печатный макет
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Создание двустороннего печатного макета для токена
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Информация о токене */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Информация о токене</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Тип:</span>
                  <span className="ml-2 font-medium">{getTokenTypeInfo(token).name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ценность:</span>
                  <span className="ml-2 font-medium">{getPointsText(getTokenTypeInfo(token).value)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Описание:</span>
                  <span className="ml-2 font-medium">{token.description}</span>
                </div>
              </div>
            </div>



            {/* Превью макета */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Превью макета</h4>
              <div className="grid grid-cols-2 gap-6">
                {/* Лицевая сторона */}
                <div className="border border-gray/20 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Лицевая сторона</h5>
                  <div 
                    className="w-full flex flex-col items-center text-white shadow-lg" 
                    style={{ 
                      aspectRatio: '1/1.414', 
                      height: 'auto', 
                      borderRadius: '0.5rem',
                      background: token.backgroundColor && token.backgroundColor.startsWith('#') ? 
                        `linear-gradient(135deg, ${token.backgroundColor} 0%, ${getLighterColor(token.backgroundColor)} 100%)` :
                        token.backgroundColor || 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                    }}
                  >
                    {token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? (
                      <img 
                        src={token.image.startsWith('http') ? token.image : `${token.image}`}
                        alt="Token preview" 
                        style={{ 
                          margin: `${getScaledSize(2)}rem`,
                          border: `${getScaledSize(2)}px solid rgba(255, 255, 255, 0.8)`,
                          borderRadius: '0.5rem',
                          boxSizing: 'border-box',
                          backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          width: `calc(100% - ${getScaledSize(4)}rem)`,
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
                        margin: `${getScaledSize(2)}rem`,
                        border: `${getScaledSize(2)}px solid rgba(255, 255, 255, 0.8)`,
                        borderRadius: '0.5rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        width: `calc(100% - ${getScaledSize(4)}rem)`,
                        aspectRatio: '1/1',
                        fontSize: `${getScaledSize(10)}rem`,
                        display: token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? 'none' : 'flex'
                      }}
                    >
                                                {token.image && !token.image.startsWith('http') && !token.image.startsWith('/uploads/') ? token.image : '🎯'}
                    </div>
                    <div className="w-full flex flex-col flex-1">
                      {token.description && (
                        <div className="flex-1 flex items-center justify-center" style={{ paddingLeft: `${getScaledSize(2)}rem`, paddingRight: `${getScaledSize(2)}rem` }}>
                          <h3 
                            className="font-bold leading-tight text-center" 
                            style={{ 
                              fontSize: `${getScaledSize(1.3)}rem`, 
                              display: '-webkit-box', 
                              WebkitLineClamp: 2, 
                              WebkitBoxOrient: 'vertical', 
                              overflow: 'hidden',
                              color: token.textColor && token.textColor.startsWith('#') ? token.textColor : 
                                     token.textColor === 'text-white' ? '#ffffff' : 
                                     token.textColor === 'text-black' ? '#000000' : '#ffffff'
                            }}
                          >
                            {token.description}
                          </h3>
                        </div>
                      )}
                      <div className="flex items-center justify-center" style={{ paddingLeft: `${getScaledSize(4)}px`, paddingRight: `${getScaledSize(4)}px`, paddingBottom: `${getScaledSize(2)}rem` }}>
                        <h2 
                          className="font-bold" 
                          style={{ 
                            fontSize: `${getScaledSize(1.5)}rem`,
                            color: token.textColor && token.textColor.startsWith('#') ? token.textColor : 
                                   token.textColor === 'text-white' ? '#ffffff' : 
                                   token.textColor === 'text-black' ? '#000000' : '#ffffff'
                          }}
                        >
                          {getPointsText(getTokenTypeInfo(token).value)}
                        </h2>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Основной дизайн токена</p>
                </div>
                
                {/* Обратная сторона */}
                <div className="border border-gray/20 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Обратная сторона</h5>
                  <div className="w-full bg-white flex flex-col items-center justify-center p-4 shadow-lg" style={{ aspectRatio: '1/1.414', height: 'auto', borderRadius: '0.5rem' }}>
                    {isGeneratingQR ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin mb-2"></div>
                        <p className="text-xs text-gray-600 text-center">Генерация QR-кода...</p>
                      </div>
                    ) : qrCodeDataUrl ? (
                      <div className="flex flex-col items-center justify-center">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR код для подтверждения токена" 
                          className="w-24 h-24 mb-2"
                        />
                        <p className="text-xs text-gray-600 text-center">QR-код для подтверждения</p>
                        <p className="text-xs text-gray-500 text-center mt-1">
                          Сканируйте для добавления токена
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <QrCode className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-600 text-center">QR-код для активации</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {qrCodeDataUrl ? 'Уникальный QR-код для подтверждения' : 'QR-код для сканирования'}
                  </p>
                </div>
              </div>
            </div>

            {/* Настройки печати */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Настройки печати</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Формат бумаги
                  </label>
                  <select className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="a4">A4 (210×297 мм)</option>
                    <option value="a5">A5 (148×210 мм)</option>
                    <option value="letter">Letter (216×279 мм)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество копий
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    defaultValue="1"
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
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
              onClick={handleCreateLayout}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Создать макет
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 