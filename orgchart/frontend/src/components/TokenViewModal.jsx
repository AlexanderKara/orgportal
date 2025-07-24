import React, { useState, useEffect } from 'react';
import { MessageCircle, User, Send, Check, Star, RotateCcw } from 'lucide-react';
import { getPointsText } from '../utils/dateUtils';
import api from '../services/api';
import { showNotification } from '../utils/notifications';
import { useAuth } from '../contexts/AuthContext';
import Select from 'react-select';
import QRCode from 'qrcode';

export default function TokenViewModal({
  isOpen,
  onClose,
  token,
  onTokenUpdate
}) {
  const { userData } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [showCommentField, setShowCommentField] = useState(false);
  const [comment, setComment] = useState('');
  const [showRecipientField, setShowRecipientField] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

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

  const colors = getTokenColors(token);

  useEffect(() => {
    if (isOpen && token) {
      setDescription(token.description || '');
      setComment('');
      setSelectedRecipient(null);
      setShowCommentField(false);
      setShowRecipientField(false);
      setIsEditingDescription(false);
      setIsFlipped(false);
      setQrCodeUrl(null);
      loadEmployees();
      generateQRCode();
    }
  }, [isOpen, token]);

  const generateQRCode = async () => {
    if (!token) return;
    
    try {
      // Создаем хеш для токена
      const tokenHash = btoa(`${token.id}-${token.receivedAt || Date.now()}`).replace(/[+/=]/g, '');
      const tokenReceiveUrl = `${window.location.origin}/receive-token/${tokenHash}`;
      
      // Генерируем QR-код
      const qrUrl = await QRCode.toDataURL(tokenReceiveUrl, {
        width: 200,
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

  const loadEmployees = async () => {
    try {
      const employeesResponse = await api.getEmployees();
      const employeesData = employeesResponse.employees || employeesResponse.data || employeesResponse || [];
      
      // Форматируем данные сотрудников для отображения
      const formattedEmployees = employeesData.map(employee => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        avatar: employee.avatar,
        position: employee.position,
        department: employee.department?.name || 'Без отдела'
      }));
      
      setEmployees(formattedEmployees);
      setLoading(false);
    } catch (error) {
      console.error('Error loading employees:', error);
      showNotification('Ошибка загрузки сотрудников', 'error');
    }
  };

  const handleUpdateDescription = async () => {
    if (!token || description === token.description) {
      setIsEditingDescription(false);
      return;
    }

    try {
      setUpdating(true);
      await api.request(`/api/tokens/${token.id}`, {
        method: 'PUT',
        data: { description }
      });
      
      if (onTokenUpdate) {
        onTokenUpdate({ ...token, description });
      }
      
      showNotification('Описание токена обновлено', 'success');
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating token description:', error);
      showNotification('Ошибка обновления описания', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendToken = async () => {
    if (!selectedRecipient || !description.trim()) {
      showNotification('Заполните все обязательные поля', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Отправляем токен напрямую получателю
      const sendData = {
        tokenId: token.id, // Передаем ID конкретного токена
        recipientId: selectedRecipient.value,
        description: description.trim(),
        comment: comment.trim() || undefined
      };

      const response = await api.request('/api/tokens/send-direct', {
        method: 'POST',
        data: sendData
      });

      if (response.success || response.message) {
        showNotification(`Токен отправлен ${selectedRecipient.label}`, 'success');
        
        // Отправляем уведомление получателю
        try {
          await api.request('/api/notifications/token-received', {
            method: 'POST',
            data: {
              recipientId: selectedRecipient.value,
              tokenData: {
                type: token.tokenType?.name || 'Токен',
                description: description.trim(),
                comment: comment.trim(),
                image: token.image || null, // Передаем изображение конкретного токена
                points: token.points || token.tokenType?.value || 1,
                senderName: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Коллега'
              }
            }
          });
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
          // Не показываем ошибку пользователю, так как токен уже отправлен
        }
        
        onClose();
        
        // Обновляем токен в родительском компоненте (удаляем у отправителя)
        if (onTokenUpdate) {
          onTokenUpdate(null); // null означает что токен удален
        }
      } else {
        throw new Error('Ошибка отправки токена');
      }
    } catch (error) {
      console.error('Error sending token:', error);
      showNotification('Ошибка отправки токена', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleOverlayClick = (e) => {
    // Закрываем только если клик именно по оверлею
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !token) return null;

  // Стили для селекта с цветами токена
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: state.isFocused ? colors.background : 'rgba(255, 255, 255, 0.5)',
      boxShadow: state.isFocused ? `0 0 0 2px ${colors.background}` : 'none',
      '&:hover': {
        borderColor: colors.background,
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: 8,
      zIndex: 999999,
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 999999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? colors.background : state.isFocused ? colors.accent : '#fff',
      color: state.isSelected ? colors.text : '#2D2D2D',
      cursor: 'pointer',
    }),
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      style={{ zIndex: 99999 }}
      onClick={handleOverlayClick}
    >
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
            transform: isFlipped ? 'rotateY(180deg)' : 'none',
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
            onClick={handleTokenClick}
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
            onClick={handleTokenClick}
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
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
                    value={selectedRecipient}
                    onChange={setSelectedRecipient}
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
                  onClick={handleTokenClick}
                  className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSendToken}
                  disabled={loading || !selectedRecipient || !description.trim()}
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
} 