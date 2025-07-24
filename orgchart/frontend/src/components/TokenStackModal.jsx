import React, { useState, useRef } from 'react';
import TokenCard from './TokenCard';
import Button from './ui/Button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import Select from 'react-select';

export default function TokenStackModal({ isOpen, tokens, onClose }) {
  const [flipped, setFlipped] = useState(Array(tokens.length).fill(false));
  const scrollRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Функция для осветления цвета
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Получаем цвета токена для стилизации элементов управления
  const getTokenColors = (token) => {
    if (!token) return { background: '#9CA3AF', text: '#ffffff', accent: '#6B7280' };
    
    let backgroundColor = '#9CA3AF';
    let textColor = '#ffffff';
    
    // Получаем цвет фона токена
    if (token.backgroundColor) {
      backgroundColor = token.backgroundColor.startsWith('#') ? token.backgroundColor : '#9CA3AF';
    } else if (token.tokenType?.backgroundColor) {
      backgroundColor = token.tokenType.backgroundColor.startsWith('#') ? token.tokenType.backgroundColor : '#9CA3AF';
    }
    
    // Получаем цвет текста токена
    if (token.textColor) {
      if (token.textColor.startsWith('#')) {
        textColor = token.textColor;
      } else if (token.textColor === 'text-white') {
        textColor = '#ffffff';
      } else if (token.textColor === 'text-black') {
        textColor = '#000000';
      }
    } else if (token.tokenType?.textColor) {
      if (token.tokenType.textColor.startsWith('#')) {
        textColor = token.tokenType.textColor;
      } else if (token.tokenType.textColor === 'text-white') {
        textColor = '#ffffff';
      } else if (token.tokenType.textColor === 'text-black') {
        textColor = '#000000';
      }
    }
    
    // Создаем акцентный цвет (более светлый оттенок)
    const accent = lightenColor(backgroundColor, 0.3);
    
    return { background: backgroundColor, text: textColor, accent };
  };

  const handleFlip = (idx) => {
    const newFlipped = [...flipped];
    newFlipped[idx] = !newFlipped[idx];
    setFlipped(newFlipped);
  };

  const scrollBy = (dir) => {
    if (scrollRef.current) {
      const scrollAmount = 480 + 32; // ширина карточки + gap
      scrollRef.current.scrollBy({
        left: dir * scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50" 
      onClick={handleOverlayClick}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
        <button 
          className="absolute top-6 right-8 text-white hover:text-primary text-3xl font-bold z-20" 
          onClick={onClose}
        >
          ×
        </button>
        
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Все токены в стопке</h2>
        
        <div className="relative w-full flex items-center justify-center">
          <button 
            className="absolute left-4 z-10 h-16 w-16 flex items-center justify-center bg-white/80 hover:bg-primary/20 rounded-full shadow-lg transition-colors" 
            onClick={() => scrollBy(-1)}
          >
            <ChevronLeft className="w-8 h-8 text-primary" />
          </button>
          
          <div 
            ref={scrollRef} 
            className="flex flex-row gap-8 overflow-x-auto pb-8 pt-8 px-8 mx-24 justify-center" 
            style={{ 
              scrollBehavior: 'smooth', 
              minHeight: 480,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingLeft: '25rem'
            }}
          >
            {tokens.map((token, idx) => {
              const colors = getTokenColors(token);
              return (
                <div key={token.id || idx} className="flex-shrink-0" style={{ width: 480, height: 480 }}>
                  {/* Контейнер токена с 3D переворотом */}
                  <div 
                    className="relative"
                    style={{ 
                      perspective: '1000px',
                      width: '480px',
                      height: '480px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div 
                      style={{ 
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d',
                        transform: flipped[idx] ? 'rotateY(180deg)' : 'none',
                        transition: 'transform 0.6s ease-in-out',
                        transformOrigin: 'center center'
                      }}
                    >
                      {/* Передняя сторона токена */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center text-white shadow-2xl rounded-lg overflow-hidden cursor-pointer" 
                        style={{ 
                          background: token.backgroundColor?.startsWith('#') ? 
                            `linear-gradient(135deg, ${token.backgroundColor} 0%, ${lightenColor(token.backgroundColor, 0.2)} 100%)` :
                            token.backgroundColor || 
                            (token.tokenType?.backgroundColor?.startsWith('#') ? 
                              `linear-gradient(135deg, ${token.tokenType.backgroundColor} 0%, ${lightenColor(token.tokenType.backgroundColor, 0.2)} 100%)` :
                              token.tokenType?.backgroundColor) ||
                            'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
                          backfaceVisibility: 'hidden'
                        }}
                        onClick={() => handleFlip(idx)}
                      >
                        {/* Только изображение токена, занимающее всю площадь */}
                        {token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? (
                          <img 
                            src={token.image.startsWith('http') ? token.image : `http://localhost:5000${token.image}`}
                            alt="" 
                            className="m-12 border-2 border-white/80 rounded-[16px] object-contain bg-white/70 w-[calc(100%-4rem)] h-[calc(100%-4rem)]"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const emojiDiv = e.target.nextSibling;
                              if (emojiDiv) {
                                emojiDiv.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className="flex items-center justify-center m-12 border-2 border-white/80 rounded-[16px] bg-white/70 text-[12rem] w-[calc(100%-4rem)] h-[calc(100%-4rem)]"
                          style={{ 
                            display: token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? 'none' : 'flex'
                          }}
                        >
                          {token.image && !token.image.startsWith('http') && !token.image.startsWith('/uploads/') ? token.image : '🎯'}
                        </div>
                      </div>

                      {/* Иконка переворачивания поверх токена */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/30 rounded-full p-4">
                          <RotateCcw className="w-8 h-8 text-white/80" />
                        </div>
                      </div>

                      {/* Тыльная сторона токена */}
                      <div 
                        className="absolute inset-0 flex flex-col text-gray-900 bg-white shadow-2xl rounded-lg cursor-pointer p-6" 
                        style={{ 
                          transform: 'rotateY(180deg)',
                          backfaceVisibility: 'hidden'
                        }}
                        onClick={() => handleFlip(idx)}
                      >
                        <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
                          <h2 className="text-xl font-semibold text-dark text-center mb-6">
                            Отправить токен
                          </h2>
                          
                          <div className="flex-1 space-y-4">
                            {/* Поле описания */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Описание <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Введите описание токена..."
                                required
                              />
                            </div>

                            {/* Поле комментария */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Комментарий
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                rows={2}
                                placeholder="Добавьте комментарий (необязательно)..."
                              />
                            </div>

                            {/* Селект получателя */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Получатель <span className="text-red-500">*</span>
                              </label>
                              <Select
                                options={employees}
                                placeholder="Выберите получателя..."
                                styles={{
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
                                  }),
                                  menuPortal: (provided) => ({
                                    ...provided,
                                    zIndex: 99999,
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
                                }}
                                menuPortalTarget={document.body}
                                menuPlacement="auto"
                                isClearable
                                noOptionsMessage={() => "Сотрудники не найдены"}
                              />
                            </div>
                          </div>

                          {/* Кнопки */}
                          <div className="flex gap-3 mt-6 pt-4 border-t border-gray/20">
                            <button
                              onClick={() => handleFlip(idx)}
                              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
                            >
                              Отмена
                            </button>
                            <button
                              disabled={loading}
                              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? 'Отправка...' : 'Отправить'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button 
            className="absolute right-4 z-10 h-16 w-16 flex items-center justify-center bg-white/80 hover:bg-primary/20 rounded-full shadow-lg transition-colors" 
            onClick={() => scrollBy(1)}
          >
            <ChevronRight className="w-8 h-8 text-primary" />
          </button>
        </div>
      </div>
    </div>
  );
} 