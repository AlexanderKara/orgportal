import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TelegramBinding = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bindingEmployee, setBindingEmployee] = useState(null);
  const [telegramId, setTelegramId] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/employees-without-telegram');
      if (response.success) {
        setEmployees(response.employees);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      setMessage('Ошибка загрузки списка сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const handleBindTelegram = async (e) => {
    e.preventDefault();
    
    if (!email || !telegramId) {
      setMessage('Заполните все поля');
      return;
    }

    try {
      const response = await api.post('/api/auth/bind-telegram', {
        email: email.toLowerCase(),
        telegram_id: parseInt(telegramId)
      });

      if (response.success) {
        setMessage(`✅ Telegram ID ${telegramId} успешно привязан к ${response.employee.first_name} ${response.employee.last_name}`);
        setEmail('');
        setTelegramId('');
        setBindingEmployee(null);
        loadEmployees(); // Перезагружаем список
      } else {
        setMessage(`❌ Ошибка: ${response.message}`);
      }
    } catch (error) {
      console.error('Error binding telegram:', error);
      setMessage('Ошибка привязки Telegram ID');
    }
  };

  const handleQuickBind = async (employee, telegramId) => {
    try {
      const response = await api.post('/api/auth/bind-telegram', {
        email: employee.email,
        telegram_id: parseInt(telegramId)
      });

      if (response.success) {
        setMessage(`✅ Telegram ID ${telegramId} привязан к ${employee.first_name} ${employee.last_name}`);
        loadEmployees();
      } else {
        setMessage(`❌ Ошибка: ${response.message}`);
      }
    } catch (error) {
      console.error('Error quick binding:', error);
      setMessage('Ошибка привязки');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">🔗 Привязка Telegram ID</h1>
          
          {message && (
            <div className={`p-4 rounded-lg mb-4 ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Форма для ручной привязки */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">📝 Ручная привязка</h2>
            <form onSubmit={handleBindTelegram} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email сотрудника
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="employee@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram ID
                  </label>
                  <input
                    type="number"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="123456789"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Привязать
              </button>
            </form>
          </div>

          {/* Список сотрудников без Telegram ID */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              👥 Сотрудники без Telegram ID ({employees.length})
            </h2>
            
            {employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">✅</div>
                <p>Все сотрудники имеют привязанный Telegram ID</p>
              </div>
            ) : (
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{employee.email}</p>
                      {employee.position && (
                        <p className="text-xs text-gray-500">{employee.position}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Telegram ID"
                        className="px-3 py-1 border border-gray-300 rounded text-sm w-32"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const telegramId = e.target.value;
                            if (telegramId) {
                              handleQuickBind(employee, telegramId);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const telegramId = document.querySelector(`input[placeholder="Telegram ID"]`).value;
                          if (telegramId) {
                            handleQuickBind(employee, telegramId);
                            document.querySelector(`input[placeholder="Telegram ID"]`).value = '';
                          }
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Привязать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramBinding; 