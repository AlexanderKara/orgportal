import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TokenCard from '../components/TokenCard';
import { Send, ArrowLeft, CheckCircle } from 'lucide-react';

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

  useEffect(() => {
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
        api.getEmployeeTokens(empId),
        api.getEmployees()
      ]);

      // Фильтруем только токены пользователя (не отправленные)
      const userTokens = tokensResponse.tokens.filter(token => 
        token.employeeId === empId && !token.isDirectSent
      );
      
      setTokens(userTokens);
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
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray/20 px-4 py-3">
        <div className="flex items-center gap-3">
          {step !== 'tokens' && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-800">
            {step === 'tokens' && 'Выберите токен'}
            {step === 'recipients' && 'Выберите получателя'}
            {step === 'sending' && 'Отправка...'}
            {step === 'success' && 'Успешно отправлено!'}
          </h1>
        </div>
      </div>

      <div className="p-4">
        {/* Шаг 1: Выбор токена */}
        {step === 'tokens' && (
          <div>
            {tokens.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">У вас нет доступных токенов для отправки</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {tokens.map(token => (
                  <div
                    key={token.id}
                    onClick={() => handleTokenSelect(token)}
                    className="cursor-pointer transform transition-transform hover:scale-105 active:scale-95"
                  >
                    <TokenCard
                      token={token}
                      size="small"
                      showActions={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Шаг 2: Выбор получателя и форма */}
        {step === 'recipients' && selectedToken && (
          <div className="space-y-4">
            {/* Выбранный токен */}
            <div className="bg-white/60 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Выбранный токен:</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex-shrink-0">
                  <TokenCard token={selectedToken} size="small" showActions={false} />
                </div>
                <div>
                  <p className="font-medium">{selectedToken.tokenType?.name}</p>
                  <p className="text-sm text-gray-600">{selectedToken.points || selectedToken.tokenType?.value} баллов</p>
                </div>
              </div>
            </div>

            {/* Поля описания и комментария */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="За что выдается токен"
                  className="w-full px-3 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий (необязательно)
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Дополнительное сообщение"
                  className="w-full px-3 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Список получателей */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Выберите получателя:</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {employees.map(employee => (
                  <div
                    key={employee.id}
                    onClick={() => handleRecipientSelect(employee)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRecipient?.id === employee.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray/20 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                        {employee.first_name?.[0]}{employee.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                        <p className="text-sm text-gray-600">{employee.department?.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Кнопка отправки */}
            {selectedRecipient && description.trim() && (
              <button
                onClick={handleSendToken}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <Send size={20} />
                Отправить токен
              </button>
            )}
          </div>
        )}

        {/* Шаг 3: Отправка */}
        {step === 'sending' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Отправляем токен...</p>
          </div>
        )}

        {/* Шаг 4: Успех */}
        {step === 'success' && (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Токен отправлен!</h2>
            <p className="text-gray-600">
              Токен успешно отправлен пользователю {selectedRecipient?.first_name} {selectedRecipient?.last_name}
            </p>
            <p className="text-sm text-gray-500 mt-2">Мини-приложение закроется автоматически...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramMiniApp; 