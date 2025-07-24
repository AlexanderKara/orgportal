import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TokenCard from '../components/TokenCard';
import { Send, ArrowLeft, CheckCircle, Users, Gift } from 'lucide-react';

const TelegramMiniApp = () => {
  const [employeeId, setEmployeeId] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [step, setStep] = useState('tokens'); // 'tokens', 'recipients', 'sending', 'success'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [telegramUser, setTelegramUser] = useState(null);

  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Получаем информацию о пользователе
      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user);
      }
      
      // Устанавливаем тему
      if (tg.colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }

    // Получаем employeeId из URL параметров
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('employeeId');
    if (empId) {
      setEmployeeId(parseInt(empId));
      loadData(empId);
    } else {
      setError('Не указан ID сотрудника');
      setLoading(false);
    }
  }, []);

  const loadData = async (empId) => {
    try {
      setLoading(true);
      const [tokensResponse, employeesResponse] = await Promise.all([
        api.getEmployeeTokensForTelegram(empId),
        api.getEmployeesForTelegram()
      ]);

      // Токены уже отфильтрованы на бэкенде (только доступные)
      setTokens(tokensResponse.tokens || []);
      setEmployees(employeesResponse.employees.filter(emp => emp.id !== empId));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
    setStep('recipients');
  };

  const handleRecipientSelect = (employee) => {
    setSelectedRecipient(employee);
  };

  const handleSendToken = async () => {
    if (!selectedToken || !selectedRecipient) return;

    try {
      setStep('sending');
      await api.sendTokenDirect({
        tokenId: selectedToken.id,
        recipientId: selectedRecipient.id,
        description: description.trim(),
        comment: comment.trim()
      });

      setStep('success');
      
      // Закрываем мини-апп через 3 секунды
      setTimeout(() => {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.close();
        }
      }, 3000);

    } catch (error) {
      console.error('Error sending token:', error);
      setError('Ошибка отправки токена');
      setStep('recipients');
    }
  };

  const handleBack = () => {
    if (step === 'recipients') {
      setStep('tokens');
      setSelectedToken(null);
      setSelectedRecipient(null);
      setDescription('');
      setComment('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Загрузка мини-приложения...</p>
          {telegramUser && (
            <p className="text-sm text-gray-500 mt-2">Привет, {telegramUser.first_name}!</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ошибка</h2>
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Проверьте правильность ссылки</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {step !== 'tokens' && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-2">
            {step === 'tokens' && <Gift size={20} className="text-blue-600" />}
            {step === 'recipients' && <Users size={20} className="text-blue-600" />}
            {step === 'sending' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
            {step === 'success' && <CheckCircle size={20} className="text-green-600" />}
            <h1 className="text-lg font-semibold text-gray-800">
              {step === 'tokens' && 'Выберите токен'}
              {step === 'recipients' && 'Выберите получателя'}
              {step === 'sending' && 'Отправка...'}
              {step === 'success' && 'Успешно отправлено!'}
            </h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Шаг 1: Выбор токена */}
        {step === 'tokens' && (
          <div>
            {tokens.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Нет доступных токенов</h3>
                <p className="text-gray-600">У вас пока нет токенов для отправки</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Ваши токены</h2>
                  <p className="text-gray-600">Выберите токен для отправки коллеге</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {tokens.map(token => (
                    <div
                      key={token.id}
                      onClick={() => handleTokenSelect(token)}
                      className="cursor-pointer transform transition-all hover:scale-105 active:scale-95 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden"
                    >
                      <TokenCard
                        token={token}
                        size="small"
                        showActions={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Шаг 2: Выбор получателя и форма */}
        {step === 'recipients' && selectedToken && (
          <div className="space-y-6">
            {/* Выбранный токен */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Gift size={16} className="text-blue-600" />
                Выбранный токен:
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex-shrink-0">
                  <TokenCard token={selectedToken} size="small" showActions={false} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{selectedToken.tokenType?.name}</p>
                  <p className="text-sm text-gray-600">{selectedToken.points || selectedToken.tokenType?.value} баллов</p>
                  {selectedToken.description && (
                    <p className="text-xs text-gray-500 mt-1">{selectedToken.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Поля описания и комментария */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="За что выдается токен"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Комментарий (необязательно)
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Дополнительное сообщение"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Список получателей */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                Выберите получателя:
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {employees.map(employee => (
                  <div
                    key={employee.id}
                    onClick={() => handleRecipientSelect(employee)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRecipient?.id === employee.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {employee.first_name?.[0]}{employee.last_name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{employee.first_name} {employee.last_name}</p>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                        {employee.department?.name && (
                          <p className="text-xs text-gray-500">{employee.department.name}</p>
                        )}
                      </div>
                      {selectedRecipient?.id === employee.id && (
                        <CheckCircle size={20} className="text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Кнопка отправки */}
            {selectedRecipient && description.trim() && (
              <button
                onClick={handleSendToken}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Send size={20} />
                Отправить токен
              </button>
            )}
          </div>
        )}

        {/* Шаг 3: Отправка */}
        {step === 'sending' && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Отправляем токен...</h2>
            <p className="text-gray-600">Пожалуйста, подождите</p>
          </div>
        )}

        {/* Шаг 4: Успех */}
        {step === 'success' && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Токен отправлен!</h2>
            <p className="text-gray-600 mb-2">
              Токен успешно отправлен пользователю{' '}
              <span className="font-semibold text-blue-600">
                {selectedRecipient?.first_name} {selectedRecipient?.last_name}
              </span>
            </p>
            <p className="text-sm text-gray-500">Мини-приложение закроется автоматически...</p>
            
            {/* Прогресс-бар */}
            <div className="mt-6 max-w-xs mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramMiniApp; 