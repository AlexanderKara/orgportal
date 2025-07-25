import React, { useState, useEffect } from 'react';
import { 
  Trophy, Plus, Edit, Download, Upload, Image, Type, Save, X,
  ChevronLeft, ChevronRight, Eye, Send, QrCode, Printer, FileText, Award, Play, Pause
} from 'lucide-react';
import TokenEditModal from '../../components/TokenEditModal';
import PrintTokenModal from '../../components/PrintTokenModal';
import SendTokensModal from '../../components/SendTokensModal';
import ViewSwitcher from '../../components/ui/ViewSwitcher';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';
import { getPointsText } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';

// Компонент пагинации (копия со страницы Skills)
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-[15px] border border-gray/50 p-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Показано {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} из {totalItems}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Строк на странице:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1 text-sm border border-gray/20 rounded hover:bg-gray/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Предыдущая
        </button>
        
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-1 text-sm border rounded ${
                page === currentPage
                  ? 'bg-primary text-white border-primary'
                  : page === '...'
                  ? 'border-transparent cursor-default'
                  : 'border-gray/20 hover:bg-gray/10'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1 text-sm border border-gray/20 rounded hover:bg-gray/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Следующая →
        </button>
      </div>
    </div>
  );
};

export default function RatingSystem() {
  const [tokens, setTokens] = useState([]);
  const [sentTokens, setSentTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSendTokensModal, setShowSendTokensModal] = useState(false);
  
  // Состояние для автоматического распределения
  const [distributionStatuses, setDistributionStatuses] = useState(new Map());
  const [togglingDistribution, setTogglingDistribution] = useState(new Set());
  
  // Состояние для переключателя представлений
  const [activeView, setActiveView] = useState('templates');
  
  // Состояние для пагинации начислений
  const [allocationCurrentPage, setAllocationCurrentPage] = useState(1);
  const [allocationItemsPerPage, setAllocationItemsPerPage] = useState(10);
  const [allocationSortBy, setAllocationSortBy] = useState('createdAt');
  const [allocationSortDirection, setAllocationSortDirection] = useState('desc');
  
  // Состояние для пагинации использований
  const [usageCurrentPage, setUsageCurrentPage] = useState(1);
  const [usageItemsPerPage, setUsageItemsPerPage] = useState(10);
  const [usageSortBy, setUsageSortBy] = useState('createdAt');
  const [usageSortDirection, setUsageSortDirection] = useState('desc');

  const views = [
    {
      id: 'templates',
      label: 'Шаблоны',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'allocations',
      label: 'Начисления',
      icon: <Trophy className="w-4 h-4" />
    },
    {
      id: 'usage',
      label: 'Использования',
      icon: <Award className="w-4 h-4" />
    },
    {
      id: 'achievements',
      label: 'Достижения',
      icon: <Award className="w-4 h-4" />
    }
  ];

  useEffect(() => {
    loadTokens();
    if (activeView === 'usage') {
      loadSentTokens();
    }
  }, [activeView]);

  const loadTokens = async () => {
    try {
      setLoading(true);
      // Очищаем кэш для получения свежих данных
      api.clearCacheFor('/admin/tokens');
      const response = await api.getAdminTokens();
      const tokensData = response.data || response || [];

      console.log('Загруженные токены:', tokensData);
      console.log('Количество токенов:', tokensData.length);
      
      // Проверяем все параметры каждого токена
      tokensData.forEach((token, index) => {
        console.log(`Токен ${index + 1}:`, {
          name: token.name,
          color: token.color,
          backgroundColor: token.backgroundColor,
          textColor: token.textColor,
          points: token.points,
          value: token.value,
          imageFolder: token.imageFolder,
          id: token.id,
          autoDistribution: token.autoDistribution,
          autoDistributionPeriod: token.autoDistributionPeriod,
          autoDistributionAmount: token.autoDistributionAmount,
          autoDistributionActive: token.autoDistributionActive
        });
      });

      setTokens(tokensData);
      
      // Инициализируем статусы автоматического распределения из данных токенов
      const statusMap = new Map();
      tokensData.forEach(token => {
        if (token.autoDistribution) {
          statusMap.set(token.id, token.autoDistributionActive || false);
        }
      });
      setDistributionStatuses(statusMap);
    } catch (error) {
      console.error('Error loading tokens:', error);
      showNotification('Ошибка загрузки токенов', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSentTokens = async () => {
    try {
      const response = await api.request('/api/tokens/sent');
      setSentTokens(response.data || response || []);
    } catch (error) {
      console.error('Error loading sent tokens:', error);
    }
  };

  const handleCreateToken = () => {
    setEditingToken(null);
    setShowTokenModal(true);
  };

  const handleEditToken = (token) => {
    console.log('Редактирование токена:', token);
    console.log('token.imageFolder:', token.imageFolder);
    setEditingToken(token);
    setShowTokenModal(true);
  };

  const handleTokenSubmit = () => {
    loadTokens();
  };

  const handlePrintToken = (token) => {
    setSelectedToken(token);
    setShowPrintModal(true);
  };

  const handleExport = () => {
    // Логика экспорта
    showNotification('Экспорт в разработке', 'info');
  };

  const handleSendTokens = async (sendData) => {
    try {
      console.log('Отправка токенов:', sendData);
      
      const response = await api.request('/api/tokens/distribute', {
        method: 'POST',
        data: sendData
      });
      
      // Проверяем успешность операции
      if (response.message) {
        // Показываем детальное уведомление об успехе
        const successMessage = response.message;
        const resultsCount = response.results?.length || 0;
        const errorsCount = response.errors?.length || 0;
        
        if (errorsCount > 0) {
          // Есть ошибки - показываем предупреждение
          showNotification(
            `${successMessage}. Успешно: ${resultsCount}, Ошибок: ${errorsCount}`, 
            'warning'
          );
        } else {
          // Все успешно
          showNotification(
            `${successMessage}. Начислено токенов: ${resultsCount}`, 
            'success'
          );
        }
        
        // Очищаем кэш для токенов сотрудника
        api.clearCacheFor('/tokens/employee/');
        // Перезагружаем данные
        loadTokens();
        loadSentTokens();
      } else {
        showNotification('Ошибка начисления токенов', 'error');
      }
    } catch (error) {
      console.error('Error sending tokens:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка начисления токенов';
      showNotification(errorMessage, 'error');
    }
  };

  // Функция для переключения автоматического распределения
  const handleToggleAutoDistribution = async (token) => {
    const tokenId = token.id;
    
    try {
      setTogglingDistribution(prev => new Set(prev).add(tokenId));
      
      const currentStatus = distributionStatuses.get(tokenId) || false;
      const newStatus = !currentStatus;
      
      if (newStatus) {
        // Запускаем автоматическое распределение
        const response = await api.request(`/api/tokens/distributions/start/${tokenId}`, {
          method: 'POST'
        });
        
        if (response.success) {
          setDistributionStatuses(prev => new Map(prev).set(tokenId, true));
          showNotification(`Автоматическое распределение для "${token.name}" запущено`, 'success');
        } else {
          throw new Error(response.message || 'Ошибка запуска распределения');
        }
      } else {
        // Останавливаем автоматическое распределение
        const response = await api.request(`/api/tokens/distributions/stop/${tokenId}`, {
          method: 'POST'
        });
        
        if (response.success) {
          setDistributionStatuses(prev => new Map(prev).set(tokenId, false));
          showNotification(`Автоматическое распределение для "${token.name}" остановлено`, 'info');
        } else {
          throw new Error(response.message || 'Ошибка остановки распределения');
        }
      }
    } catch (error) {
      console.error('Error toggling auto distribution:', error);
      showNotification(`Ошибка: ${error.message}`, 'error');
    } finally {
      setTogglingDistribution(prev => {
        const newSet = new Set(prev);
        newSet.delete(tokenId);
        return newSet;
      });
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
          textColor: extractTextColor(token.textColor)
        };
      } else {
        return {
          name: token.name || 'Неизвестный',
          color: { background: token.backgroundColor },
          value: token.value || token.points || 1,
          textColor: extractTextColor(token.textColor)
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
          textColor: extractTextColor(token.textColor || token.tokenType.textColor)
        };
      } else {
        return {
          name: token.tokenType.name || 'Неизвестный',
          color: { background: token.tokenType.backgroundColor },
          value: token.tokenType.value || 1,
          textColor: extractTextColor(token.textColor || token.tokenType.textColor)
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

  // Сортировка и фильтрация токенов
  const sortedTokens = tokens.sort((a, b) => {
    const aValue = a.points || getTokenTypeInfo(a).value;
    const bValue = b.points || getTokenTypeInfo(b).value;
    return aValue - bValue; // Сортировка по возрастанию баллов
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Функции для пагинации начислений
  const handleAllocationPageChange = (page) => {
    setAllocationCurrentPage(page);
  };

  const handleAllocationItemsPerPageChange = (newItemsPerPage) => {
    setAllocationItemsPerPage(newItemsPerPage);
    setAllocationCurrentPage(1);
  };

  const handleAllocationSort = (field) => {
    if (allocationSortBy === field) {
      setAllocationSortDirection(allocationSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAllocationSortBy(field);
      setAllocationSortDirection('asc');
    }
  };

  // Функции для пагинации использований
  const handleUsagePageChange = (page) => {
    setUsageCurrentPage(page);
  };

  const handleUsageItemsPerPageChange = (newItemsPerPage) => {
    setUsageItemsPerPage(newItemsPerPage);
    setUsageCurrentPage(1);
  };

  const handleUsageSort = (field) => {
    if (usageSortBy === field) {
      setUsageSortDirection(usageSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setUsageSortBy(field);
      setUsageSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px]">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка токенов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[50px] md:pt-[70px]">
      {/* Верхний блок управления */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-2 sm:gap-4 md:gap-8">
        <h1 className="text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Управление токенами</h1>
        <div className="flex flex-row gap-2 flex-wrap items-center">
          {activeView === 'templates' && (
            <Button
              variant="secondary"
              onClick={handleCreateToken}
              icon={<Plus className="w-4 h-4" />}
            >
              Новый шаблон
            </Button>
          )}
          {activeView === 'allocations' && (
            <Button
              variant="primary"
              onClick={() => setShowSendTokensModal(true)}
              icon={<Send className="w-4 h-4" />}
            >
              Отправить
            </Button>
          )}
          {activeView === 'usage' && (
            <Button
              variant="secondary"
              onClick={handleExport}
              icon={<Download className="w-4 h-4" />}
            >
              Экспорт
            </Button>
          )}
          <ViewSwitcher
            views={views}
            activeView={activeView}
            onViewChange={setActiveView}
            className="flex-1 min-w-0"
          />
        </div>
      </div>

      {/* Представление Шаблоны */}
      {activeView === 'templates' && (
        <>
          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Всего токенов</p>
                  <p className="text-2xl font-bold text-gray-900">{tokens.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Передано сегодня</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Напечатано</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Printer className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Список токенов */}
          <div className="bg-white rounded-lg border border-gray/20 w-full">
            <div className="p-6 lg:p-8">
              <div className="flex flex-wrap justify-start gap-6">
                {tokens
                  .sort((a, b) => {
                    const aValue = a.points || getTokenTypeInfo(a).value;
                    const bValue = b.points || getTokenTypeInfo(b).value;
                    return aValue - bValue; // Сортировка по возрастанию баллов
                  })
                  .map((token) => {
                  const typeInfo = getTokenTypeInfo(token);
                  
                  return (
                    <div key={token.id} className="border border-gray/20 rounded-lg p-4 hover:shadow-md transition-shadow" style={{ width: '352px' }}>
                      {/* Превью токена */}
                      <div className="rounded-lg mb-3 flex flex-col items-center text-2xl text-white" style={{ width: '320px', height: '452px', aspectRatio: '1/1.414', background: typeInfo.color.background }}>
                        {token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? (
                          <img 
                            src={token.image.startsWith('http') ? token.image : `${token.image}`}
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
                            display: token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? 'none' : 'flex'
                          }}
                        >
                          {token.image && !token.image.startsWith('http') && !token.image.startsWith('/uploads/') ? token.image : '🎯'}
                        </div>
                        
                        {/* Описание и очки на токене */}
                        <div className="w-full flex flex-col flex-1">
                          {token.description && (
                            <div className="flex-1 flex items-center justify-center" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                              <h3 
                                className="font-bold leading-tight text-center" 
                                style={{ 
                                  fontSize: '1.3rem', 
                                  display: '-webkit-box', 
                                  WebkitLineClamp: 2, 
                                  WebkitBoxOrient: 'vertical', 
                                  overflow: 'hidden',
                                  color: extractTextColor(token.textColor) || typeInfo.textColor
                                }}
                              >
                                {token.description}
                              </h3>
                            </div>
                          )}
                          <div className="px-4 flex items-center justify-center" style={{ paddingBottom: '2rem' }}>
                            <h2 
                              className="font-bold" 
                              style={{ 
                                fontSize: '1.5rem',
                                color: extractTextColor(token.textColor) || typeInfo.textColor
                              }}
                            >
                              {getPointsText(token.points || typeInfo.value)}
                            </h2>
                          </div>
                        </div>
                      </div>
                      
                      {/* Действия */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditToken(token)}
                          className="flex-1 bg-primary text-white px-3 py-2 rounded text-sm hover:bg-primary/90 flex items-center justify-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Редактировать
                        </button>
                        
                        <button
                          onClick={() => handlePrintToken(token)}
                          className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Представление Начисления */}
      {activeView === 'allocations' && (
        <>
          {/* Пагинация над таблицей */}
          {tokens.length > 0 && (
            <div className="mb-4">
              <Pagination
                currentPage={allocationCurrentPage}
                totalPages={Math.ceil(tokens.length / allocationItemsPerPage)}
                onPageChange={handleAllocationPageChange}
                itemsPerPage={allocationItemsPerPage}
                onItemsPerPageChange={handleAllocationItemsPerPageChange}
                totalItems={tokens.length}
              />
            </div>
          )}

          {/* Таблица всех типов токенов */}
          <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      <button
                        onClick={() => handleAllocationSort('type')}
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                      >
                        <span>Тип</span>
                        <span className="text-xs">
                          {allocationSortBy === 'type' ? (
                            allocationSortDirection === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      <button
                        onClick={() => handleAllocationSort('points')}
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                      >
                        <span>Очки</span>
                        <span className="text-xs">
                          {allocationSortBy === 'points' ? (
                            allocationSortDirection === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      <button
                        onClick={() => handleAllocationSort('description')}
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                      >
                        <span>Описание</span>
                        <span className="text-xs">
                          {allocationSortBy === 'description' ? (
                            allocationSortDirection === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      <button
                        onClick={() => handleAllocationSort('createdAt')}
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                      >
                        <span>Дата создания</span>
                        <span className="text-xs">
                          {allocationSortBy === 'createdAt' ? (
                            allocationSortDirection === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray/20">
                  {tokens
                    .slice((allocationCurrentPage - 1) * allocationItemsPerPage, allocationCurrentPage * allocationItemsPerPage)
                    .map((token, index) => {
                    const typeInfo = getTokenTypeInfo(token);
                    return (
                      <tr key={token.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: typeInfo.color.background }}>
                              {token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? (
                                <img 
                                  src={token.image.startsWith('http') ? token.image : `${token.image}`}
                                  alt="" 
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const emojiSpan = e.target.nextSibling;
                                    if (emojiSpan) {
                                      emojiSpan.style.display = 'inline';
                                    }
                                  }}
                                />
                              ) : null}
                              <span 
                                className="text-sm font-bold" 
                                style={{ 
                                  display: token.image && token.image !== '🎯' && (token.image.startsWith('http') || token.image.startsWith('/uploads/')) ? 'none' : 'inline',
                                  color: token.textColor || typeInfo.textColor
                                }}
                              >
                                {token.image && !token.image.startsWith('http') && !token.image.startsWith('/uploads/') ? token.image : '🎯'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-dark">{typeInfo.name}</div>
                              <div className="text-sm text-gray-500">{getPointsText(typeInfo.value)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                          {getPointsText(token.points || typeInfo.value)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-dark max-w-xs truncate">
                            {token.description || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(token.createdAt || token.created_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedToken(token);
                                setShowSendTokensModal(true);
                              }}
                              className="text-primary hover:text-primary/80 transition-colors p-2 hover:bg-primary/10 rounded-lg"
                              title="Отправить токен"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            
                            {/* Кнопка автоматического распределения */}
                            {token.autoDistribution && token.autoDistributionPeriod && token.autoDistributionAmount && (
                              <button
                                onClick={() => {
                                  console.log('Кнопка автоматического распределения нажата для токена:', token);
                                  console.log('autoDistribution:', token.autoDistribution);
                                  console.log('autoDistributionPeriod:', token.autoDistributionPeriod);
                                  console.log('autoDistributionAmount:', token.autoDistributionAmount);
                                  handleToggleAutoDistribution(token);
                                }}
                                disabled={togglingDistribution.has(token.id)}
                                className={`transition-colors p-2 rounded-lg ${
                                  distributionStatuses.get(token.id)
                                    ? 'text-orange-600 hover:text-orange-800 hover:bg-orange/10'
                                    : 'text-green-600 hover:text-green-800 hover:bg-green/10'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={
                                  distributionStatuses.get(token.id)
                                    ? 'Приостановить автоматическое распределение'
                                    : 'Запустить автоматическое распределение'
                                }
                              >
                                {togglingDistribution.has(token.id) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : distributionStatuses.get(token.id) ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Пагинация под таблицей */}
          {Math.ceil(tokens.length / allocationItemsPerPage) > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={allocationCurrentPage}
                totalPages={Math.ceil(tokens.length / allocationItemsPerPage)}
                onPageChange={handleAllocationPageChange}
                itemsPerPage={allocationItemsPerPage}
                onItemsPerPageChange={handleAllocationItemsPerPageChange}
                totalItems={tokens.length}
              />
            </div>
          )}

          {tokens.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-dark mb-2">Нет типов токенов</h3>
              <p className="text-gray-500">Пока нет созданных типов токенов</p>
            </div>
          )}
        </>
      )}

      {/* Представление Использования */}
      {activeView === 'usage' && (
        <>
          {/* Пагинация над таблицей */}
          {sentTokens.length > 0 && (
            <div className="mb-4">
              <Pagination
                currentPage={usageCurrentPage}
                totalPages={Math.ceil(sentTokens.length / usageItemsPerPage)}
                onPageChange={handleUsagePageChange}
                itemsPerPage={usageItemsPerPage}
                onItemsPerPageChange={handleUsageItemsPerPageChange}
                totalItems={sentTokens.length}
              />
            </div>
          )}

          {/* Таблица передач токенов */}
          <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      <button
                        onClick={() => handleUsageSort('type')}
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                      >
                        <span>Тип</span>
                        <span className="text-xs">
                          {usageSortBy === 'type' ? (
                            usageSortDirection === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      <button
                        onClick={() => handleUsageSort('sender')}
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                      >
                        <span>Отдал</span>
                        <span className="text-xs">
                          {usageSortBy === 'sender' ? (
                            usageSortDirection === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      <button
                        onClick={() => handleUsageSort('recipient')}
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                      >
                        <span>Получил</span>
                        <span className="text-xs">
                          {usageSortBy === 'recipient' ? (
                            usageSortDirection === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      Комментарий
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                      <button
                        onClick={() => handleUsageSort('createdAt')}
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors whitespace-nowrap"
                      >
                        <span>Дата</span>
                        <span className="text-xs">
                          {usageSortBy === 'createdAt' ? (
                            usageSortDirection === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray/20">
                  {sentTokens
                    .slice((usageCurrentPage - 1) * usageItemsPerPage, usageCurrentPage * usageItemsPerPage)
                    .map((token, index) => {
                    const typeInfo = getTokenTypeInfo(token);
                    return (
                      <tr key={token.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: typeInfo.color.background }}>
                              {token.tokenType?.image && token.tokenType.image !== '🎯' && (token.tokenType.image.startsWith('http') || token.tokenType.image.startsWith('/uploads/')) ? (
                                <img 
                                  src={token.tokenType.image.startsWith('http') ? token.tokenType.image : `${token.tokenType.image}`}
                                  alt="" 
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const emojiSpan = e.target.nextSibling;
                                    if (emojiSpan) {
                                      emojiSpan.style.display = 'inline';
                                    }
                                  }}
                                />
                              ) : null}
                              <span 
                                className="text-sm font-bold" 
                                style={{ 
                                  display: token.tokenType?.image && token.tokenType.image !== '🎯' && (token.tokenType.image.startsWith('http') || token.tokenType.image.startsWith('/uploads/')) ? 'none' : 'inline',
                                  color: token.textColor || typeInfo.textColor
                                }}
                              >
                                {token.tokenType?.image && !token.tokenType.image.startsWith('http') && !token.tokenType.image.startsWith('/uploads/') ? token.tokenType.image : '🎯'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-dark">{typeInfo.name}</div>
                              <div className="text-sm text-gray-500">{getPointsText(typeInfo.value)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <img 
                                className="h-8 w-8 rounded-full object-cover" 
                                src={token.sender?.avatar || '/package-icon.svg'} 
                                alt={token.sender?.name}
                                onError={(e) => {
                                  e.target.src = '/package-icon.svg';
                                }}
                              />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-dark">{token.sender?.name}</div>
                              <div className="text-sm text-gray-500">{token.sender?.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <img 
                                className="h-8 w-8 rounded-full object-cover" 
                                src={token.recipient?.avatar || '/package-icon.svg'} 
                                alt={token.recipient?.name}
                                onError={(e) => {
                                  e.target.src = '/package-icon.svg';
                                }}
                              />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-dark">{token.recipient?.name}</div>
                              <div className="text-sm text-gray-500">{token.recipient?.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-dark max-w-xs truncate">
                            {token.message || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(token.createdAt || token.created_at).toLocaleDateString('ru-RU')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Пагинация под таблицей */}
          {Math.ceil(sentTokens.length / usageItemsPerPage) > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={usageCurrentPage}
                totalPages={Math.ceil(sentTokens.length / usageItemsPerPage)}
                onPageChange={handleUsagePageChange}
                itemsPerPage={usageItemsPerPage}
                onItemsPerPageChange={handleUsageItemsPerPageChange}
                totalItems={sentTokens.length}
              />
            </div>
          )}

          {sentTokens.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-dark mb-2">Нет передач токенов</h3>
              <p className="text-gray-500">Пока нет данных о передачах токенов между пользователями</p>
            </div>
          )}
        </>
      )}

      {/* Представление Достижения */}
      {activeView === 'achievements' && (
        <div className="bg-white rounded-lg p-6 border border-gray/20">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Достижения</h2>
          <p className="text-gray-600">Раздел достижений в разработке</p>
        </div>
      )}

      {/* Модальное окно токенов */}
      <TokenEditModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onSubmit={handleTokenSubmit}
        token={editingToken}
      />

      {/* Модальное окно печати */}
      <PrintTokenModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        token={selectedToken}
      />

      {/* Модальное окно отправки токенов */}
      <SendTokensModal
        isOpen={showSendTokensModal}
        onClose={() => {
          setShowSendTokensModal(false);
          setSelectedToken(null);
        }}
        onSubmit={handleSendTokens}
        tokens={tokens}
        preselectedToken={selectedToken}
      />
    </div>
  );
} 