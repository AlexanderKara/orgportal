import React, { useState, useEffect } from 'react';
import { Pause, RefreshCw, Activity, Clock, Users, Trophy, Settings, Calendar, CheckCircle, XCircle, AlertCircle, Eye, Trash } from 'lucide-react';
import { showNotification } from '../../utils/notifications';
import api from '../../services/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

// Функция для перевода периодов распределения
const translatePeriod = (period) => {
  const translations = {
    'daily': 'Ежедневно',
    'weekly': 'Еженедельно', 
    'month': 'Ежемесячно',
    'monthly': 'Ежемесячно',
    'quarter': 'Ежеквартально',
    'half_year': 'Раз в полгода',
    'yearly': 'Ежегодно',
    'once': 'Однократно'
  };
  return translations[period] || period;
};

export default function TokenDistributionService() {
  const [serviceStatus, setServiceStatus] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  
  const { dialogState, openDialog, closeDialog } = useConfirmDialog();

  useEffect(() => {
    loadData();
    
    // Обновляем данные каждые 30 секунд
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [statusResponse, statisticsResponse, sentTokensResponse] = await Promise.all([
        api.getDistributionServiceStatus(),
        api.getDistributionStatistics(),
        api.getSentTokens({ limit: 1000 })
      ]);
      
      if (sentTokensResponse.sent) {
        statisticsResponse.data.scheduled = [...(statisticsResponse.data.scheduled || []), ...sentTokensResponse.sent];
      }
      
      setServiceStatus(statusResponse.data || {});
      setStatistics(statisticsResponse.data || {});
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'scheduled': 'Запланировано',
      'in_progress': 'Выполняется',
      'completed': 'Завершено',
      'failed': 'Ошибка'
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const viewDistributionDetails = async (distributionId) => {
    try {
      setDetailsLoading(true);
      
      const response = await api.getDistributionDetails(distributionId);
      
      const distributionData = response?.data?.distribution || response?.distribution || null;
      
      if (distributionData) {
        setSelectedDistribution(distributionData);
        setShowDetailsModal(true);
      } else {
        showNotification('Не удалось загрузить детали распределения', 'error');
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
      showNotification('Ошибка загрузки деталей распределения', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePauseDistribution = (tokenTypeId) => {
    openDialog({
      title: 'Подтверждение приостановки',
      message: 'Вы уверены, что хотите приостановить автоматическое распределение этого типа токенов?',
      confirmText: 'Приостановить',
      cancelText: 'Отмена',
      type: 'info',
      onConfirm: async () => {
        try {
          const response = await api.post(`/api/tokens/distributions/stop/${tokenTypeId}`);
          if (response?.success || response?.data?.success) {
            showNotification('Автораспределение приостановлено', 'success');
            await loadData();
          } else {
            const errorMessage = response?.error || response?.data?.error || 'Ошибка приостановки автораспределения';
            showNotification(errorMessage, 'error');
          }
        } catch (error) {
          console.error('Error pausing auto distribution:', error);
          showNotification('Ошибка приостановки автораспределения', 'error');
        }
      }
    });
  };

  const handleDeleteDistribution = (distributionId) => {
    openDialog({
      title: 'Подтверждение удаления',
      message: 'Вы уверены, что хотите удалить это запланированное распределение?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Найдем распределение для получения tokenTypeId
          const distribution = statistics?.scheduled?.find(d => d.id === distributionId);
          
          const response = await api.delete(`/api/tokens/distributions/${distributionId}`);
          if (response?.success || response?.data?.success) {
            showNotification('Распределение удалено', 'success');
            
            // Если это было автоматическое распределение, отключаем автораспределение для токена
            if (distribution && !distribution.isManual && distribution.tokenTypeId) {
              try {
                await api.post(`/api/tokens/distributions/stop/${distribution.tokenTypeId}`);
              } catch (stopError) {
                console.warn('Could not stop auto distribution:', stopError);
              }
            }
            
            // Принудительно обновляем данные
            setLoading(true);
            await loadData();
          } else {
            const errorMessage = response?.error || response?.data?.error || 'Ошибка удаления распределения';
            showNotification(errorMessage, 'error');
          }
        } catch (error) {
          console.error('Error deleting distribution:', error);
          showNotification('Ошибка удаления распределения', 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных сервиса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[24px] lg:text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Рассылка токенов</h1>
          <p className="text-gray-600 hidden lg:block">
            Управление автоматическим распределением токенов между сотрудниками
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            disabled={processing}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Обновить</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${serviceStatus?.serviceEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">Статус сервиса</span>
          </div>
          <div className="text-lg font-bold text-dark">
            {serviceStatus?.serviceEnabled ? 'Включен' : 'Отключен'}
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Выполняется</span>
          </div>
          <div className="text-lg font-bold text-dark">
            {statistics?.summary?.totalInProgress || 0}
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-600">Запланировано</span>
          </div>
          <div className="text-lg font-bold text-dark">
            {statistics?.summary?.totalScheduled || 0}
          </div>
        </div>

        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Завершено</span>
          </div>
          <div className="text-lg font-bold text-dark">
            {statistics?.summary?.totalCompleted || 0}
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden mb-6">
        <div className="flex border-b border-gray/20">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'scheduled'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Запланированные ({statistics?.summary?.totalScheduled || 0})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Выполненные ({(statistics?.summary?.totalCompleted || 0) + (statistics?.summary?.totalFailed || 0)})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('inProgress')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'inProgress'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Выполняется ({statistics?.summary?.totalInProgress || 0})</span>
            </div>
          </button>
        </div>

        {/* Содержимое вкладок */}
        <div className="p-6">
          {activeTab === 'scheduled' && (
            <div>
              {statistics?.scheduled?.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Нет запланированных тиражей</p>
                  <p className="text-gray-400 text-sm">Тиражи появятся автоматически согласно настройкам</p>
                </div>
              ) : (
                <div className="bg-white rounded-[12px] shadow-sm border border-gray/20 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Тип токена
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Запланировано на
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Период
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Количество токенов
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray/20">
                      {statistics?.scheduled?.map((distribution, index) => (
                        <tr key={distribution.id} className="hover:bg-gray/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded mr-3"
                                style={{ backgroundColor: distribution.tokenType?.backgroundColor || '#gray' }}
                              ></div>
                              <span className="text-sm font-medium text-dark">
                                {distribution.tokenType?.name || 'Неизвестный тип'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                            {formatDate(distribution.scheduledDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-[6px] bg-blue-100 text-blue-800">
                              {translatePeriod(distribution.tokenType?.autoDistributionPeriod || distribution.distributionPeriod)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                            {distribution.distributionAmount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {!distribution.isManual && (
                                <>
                                  <button
                                    onClick={() => handlePauseDistribution(distribution.tokenTypeId)}
                                    className="inline-flex items-center justify-center w-8 h-8 text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-[6px] hover:bg-yellow-200 transition-colors"
                                    title="Приостановить автораспределение"
                                  >
                                    <Pause className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDistribution(distribution.id)}
                                    className="inline-flex items-center justify-center w-8 h-8 text-red-700 bg-red-100 border border-red-200 rounded-[6px] hover:bg-red-200 transition-colors"
                                    title="Удалить запланированное распределение"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => viewDistributionDetails(distribution.id)}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-700 bg-white border border-gray/20 rounded-[6px] hover:bg-gray/10 transition-colors"
                                title="Посмотреть детали распределения"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div>
              {statistics?.completed?.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Нет завершенных тиражей</p>
                  <p className="text-gray-400 text-sm">Завершенные тиражи появятся здесь после выполнения</p>
                </div>
              ) : (
                <div className="bg-white rounded-[12px] shadow-sm border border-gray/20 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Тип токена
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Выполнено
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Сотрудники
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Токены
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray/20">
                      {statistics?.completed?.map((distribution, index) => (
                        <tr key={distribution.id} className="hover:bg-gray/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(distribution.status)}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-[6px] ${getStatusBadgeColor(distribution.status)}`}>
                                {getStatusText(distribution.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded mr-3"
                                style={{ backgroundColor: distribution.tokenType?.backgroundColor || '#gray' }}
                              ></div>
                              <span className="text-sm font-medium text-dark">
                                {distribution.tokenType?.name || 'Неизвестный тип'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                            {formatDate(distribution.executedDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{distribution.successCount || 0}</span>
                              <span className="text-gray-500">/</span>
                              <span>{distribution.targetEmployeesCount || 0}</span>
                              {distribution.errorCount > 0 && (
                                <span className="text-red-600 text-xs ml-2">
                                  ({distribution.errorCount} ошибок)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark font-medium">
                            {distribution.totalTokensDistributed || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => viewDistributionDetails(distribution.id)}
                              className="inline-flex items-center justify-center w-8 h-8 text-gray-700 bg-white border border-gray/20 rounded-[6px] hover:bg-gray/10 transition-colors"
                              title="Посмотреть детали распределения"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inProgress' && (
            <div>
              {statistics?.inProgress?.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Нет выполняющихся тиражей</p>
                  <p className="text-gray-400 text-sm">Активные процессы распределения появятся здесь</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(statistics?.inProgress || []).map((distribution) => (
                    <div key={distribution.id} className="bg-yellow-50 border border-yellow-200 rounded-[12px] p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />
                          <div>
                            <h4 className="font-semibold text-dark text-lg">
                              {distribution.TokenType?.name || 'Неизвестный тип'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Начато: {formatDate(distribution.executedDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-dark">
                            {distribution.processedEmployeesCount || 0} / {distribution.targetEmployeesCount || 0}
                          </p>
                          <p className="text-sm text-gray-600">обработано</p>
                        </div>
                      </div>
                      
                      {distribution.targetEmployeesCount > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Прогресс выполнения</span>
                            <span>{Math.round((distribution.processedEmployeesCount / distribution.targetEmployeesCount) * 100)}%</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(distribution.processedEmployeesCount / distribution.targetEmployeesCount) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => viewDistributionDetails(distribution.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray/20 text-gray-700 rounded-[6px] hover:bg-gray/10 transition-colors text-xs font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          Детали
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно с деталями */}
      {(() => {
        return selectedDistribution && Object.keys(selectedDistribution).length > 0;
      })() && (
        <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[15px] w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray/20">
              <h2 className="text-xl font-bold text-dark">
                Детали распределения {selectedDistribution?.id ? `#${selectedDistribution.id}` : ''}
              </h2>
              <button
                onClick={() => setSelectedDistribution(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray/10 rounded-[12px] p-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Тип токена</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: selectedDistribution.tokenType?.backgroundColor || '#gray' }}
                    ></div>
                    <p className="text-lg font-semibold text-dark">{selectedDistribution.tokenType?.name}</p>
                  </div>
                </div>
                <div className="bg-gray/10 rounded-[12px] p-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Статус</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedDistribution.status)}
                    <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(selectedDistribution.status)}`}>
                      {getStatusText(selectedDistribution.status)}
                    </span>
                  </div>
                </div>
                <div className="bg-gray/10 rounded-[12px] p-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Запланировано</p>
                  <p className="text-lg font-semibold text-dark">{formatDate(selectedDistribution.scheduledDate)}</p>
                </div>
                <div className="bg-gray/10 rounded-[12px] p-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Выполнено</p>
                  <p className="text-lg font-semibold text-dark">
                    {selectedDistribution.executedDate ? formatDate(selectedDistribution.executedDate) : 'Не выполнено'}
                  </p>
                </div>
                <div className="bg-gray/10 rounded-[12px] p-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Успешно / Всего</p>
                  <p className="text-lg font-semibold text-dark">
                    {selectedDistribution.successCount || 0} / {selectedDistribution.targetEmployeesCount || 0}
                  </p>
                </div>
                <div className="bg-gray/10 rounded-[12px] p-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Распределено токенов</p>
                  <p className="text-lg font-semibold text-dark">{selectedDistribution.totalTokensDistributed || 0}</p>
                </div>
              </div>
              
              {selectedDistribution.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-4">
                  <p className="text-sm font-medium text-red-800 mb-1">Ошибка:</p>
                  <p className="text-sm text-red-700">{selectedDistribution.errorMessage}</p>
                </div>
              )}
              
              {selectedDistribution.executionLog && (
                <div className="bg-gray/10 rounded-[12px] p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Лог выполнения:</p>
                  <div className="max-h-64 overflow-y-auto bg-white rounded-[8px] p-3 border border-gray/20">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(selectedDistribution.executionLog, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Диалог подтверждения */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
      />
    </div>
  );
} 