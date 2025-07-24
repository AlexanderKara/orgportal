import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, Search } from 'lucide-react';
import Select from 'react-select';
import api from '../services/api';
import { showNotification } from '../utils/notifications';

export default function SendToken() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [tokenTypes, setTokenTypes] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesResponse, tokenTypesResponse] = await Promise.all([
          api.getEmployees(),
          api.request('/api/tokens/types')
        ]);

        setEmployees(employeesResponse.data || employeesResponse || []);
        setTokenTypes(tokenTypesResponse);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const handleSendToken = async () => {
    if (!selectedEmployee || !selectedToken) {
      showNotification('Выберите сотрудника и тип токена', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/tokens/send', {
        toEmployeeId: selectedEmployee.value,
        tokenTypeId: selectedToken.value,
        count: 1,
        message: message.trim() || undefined
      });

      showNotification('Токен успешно отправлен!', 'success');
      navigate('/account/profile');
    } catch (error) {
      console.error('Error sending token:', error);
      showNotification(error.response?.data?.message || 'Ошибка отправки токена', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const employeeOptions = filteredEmployees.map(emp => ({
    value: emp.id,
    label: emp.name,
    position: emp.position,
    department: emp.department?.name,
    avatar: emp.avatar
  }));

  const tokenOptions = tokenTypes.map(token => ({
    value: token.id,
    label: token.name,
    name: token.name,
    image: token.image,
    description: token.description,
    backgroundColor: token.backgroundColor // Добавляем backgroundColor
  }));

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#FF8A15' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 1px #FF8A15' : 'none',
      '&:hover': {
        borderColor: '#FF8A15'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#FF8A15' : state.isFocused ? '#FFF3E0' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:hover': {
        backgroundColor: state.isSelected ? '#FF8A15' : '#FFF3E0'
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999
    })
  };

  // Функция для определения цвета токена по backgroundColor
  const getTokenColor = (token) => {
    if (token.backgroundColor) {
      // Если backgroundColor начинается с #, используем его напрямую
      if (token.backgroundColor.startsWith('#')) {
        return `bg-gradient-to-br from-[${token.backgroundColor}] to-[${getLighterColor(token.backgroundColor)}]`;
      }
      // Если это CSS класс, используем его
      return token.backgroundColor;
    }
    
    // Fallback - определяем по имени
    const name = token.name.toLowerCase();
    if (name.includes('серый') || name.includes('gray') || name.includes('grey')) {
      return 'bg-gradient-to-br from-dark to-black';
    } else if (name.includes('красный') || name.includes('red')) {
      return 'bg-gradient-to-br from-red-500 to-red-700';
    } else if (name.includes('желтый') || name.includes('yellow')) {
      return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    } else {
      return 'bg-gradient-to-br from-gray to-white';
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

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Header */}
      <div className="flex items-center justify-between py-8 border-b border-gray/30 sticky top-0 bg-white z-10 px-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Send className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold font-accent text-primary">Отправить токен</span>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray/30 transition" title="Назад">
          <ArrowLeft className="w-8 h-8 text-dark" />
        </button>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-center mb-6">Отправить токен</h2>
          
          {/* Выбор сотрудника */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Выберите сотрудника</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск сотрудников..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Select
              options={employeeOptions}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              placeholder="Начните вводить имя..."
              styles={customSelectStyles}
              formatOptionLabel={(option) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {option.avatar ? (
                      <img src={option.avatar} alt={option.label} className="w-8 h-8 rounded-full" />
                    ) : (
                      <Users className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.position}</div>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Выбор токена */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Выберите токен</label>
            <div className="grid grid-cols-2 gap-3">
              {tokenOptions
                .sort((a, b) => {
                  // Сортируем по ценности токенов: platinum(1) < yellow(10) < red(100) < gray(1000)
                  const getValue = (name) => {
                    const tokenName = name.toLowerCase();
                    if (tokenName.includes('серый') || tokenName.includes('gray') || tokenName.includes('grey')) return 1000;
                    if (tokenName.includes('красный') || tokenName.includes('red')) return 100;
                    if (tokenName.includes('желтый') || tokenName.includes('yellow')) return 10;
                    return 1;
                  };
                  return getValue(a.name) - getValue(b.name);
                })
                .map(token => (
                <button
                  key={token.value}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedToken?.value === token.value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedToken(token)}
                >
                  <div className="text-center">
                    <div className={`w-12 h-16 mx-auto mb-2 rounded-lg flex items-center justify-center relative ${getTokenColor(token)}`}>
                      <span className="text-white text-lg">{token.image}</span>
                    </div>
                    <div className="font-medium text-sm">{token.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{token.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Сообщение */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Сообщение (необязательно)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напишите, за что вы хотите отметить этого сотрудника..."
              className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>

          {/* Кнопка отправки */}
          <button
            onClick={handleSendToken}
            disabled={!selectedEmployee || !selectedToken || loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Отправка...' : 'Отправить токен'}
          </button>
        </div>
      </div>
    </div>
  );
} 