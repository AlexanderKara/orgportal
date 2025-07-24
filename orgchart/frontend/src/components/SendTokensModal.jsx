import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Send, UserPlus, UserMinus } from 'lucide-react';
import Select from 'react-select';
import Avatar from './ui/Avatar';
import api from '../services/api';
import { getPointsText } from '../utils/dateUtils';

const customSelectStyles = {
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
    backgroundColor: state.isSelected ? '#FF8A15' : state.isFocused ? '#FFE5CC' : '#fff',
    color: state.isSelected ? '#fff' : '#2D2D2D',
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
};

export default function SendTokensModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  tokens = [],
  preselectedToken = null
}) {
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedTokenOption, setSelectedTokenOption] = useState(null);
  const [tokenAmount, setTokenAmount] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');

  // Загружаем сотрудников при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      console.log('SendTokensModal opened with tokens:', tokens);
      console.log('Tokens array length:', tokens?.length || 0);
      console.log('Tokens array content:', tokens);
      console.log('Preselected token:', preselectedToken);
      
      loadEmployees();
      setSelectedEmployees([]);
      setSearchQuery('');
      setTokenAmount(1);
      
      // Устанавливаем предвыбранный токен, если он передан
      if (preselectedToken) {
        setSelectedToken(preselectedToken);
        const tokenOption = {
          value: preselectedToken.id,
          label: `${preselectedToken.name} (${getPointsText(preselectedToken.points || 1)})`,
          token: preselectedToken
        };
        setSelectedTokenOption(tokenOption);
        console.log('Set preselected token option:', tokenOption);
      } else {
        setSelectedToken(null);
        setSelectedTokenOption(null);
      }
    }
  }, [isOpen, preselectedToken, tokens]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeesResponse = await api.getEmployees();
      const employeesData = employeesResponse.employees || employeesResponse.data || employeesResponse || [];
      
      setEmployees(employeesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Ошибка при загрузке сотрудников');
      setLoading(false);
    }
  };

  // Мемоизированный список опций токенов
  const tokenOptions = useMemo(() => {
    console.log('Creating token options from tokens:', tokens);
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      console.log('No tokens available for options');
      return [];
    }
    
    const options = tokens.map(token => ({
      value: token.id,
      label: `${token.name || 'Без названия'} (${getPointsText(token.points || 1)})`,
      token: token
    }));
    
    console.log('Generated token options:', options);
    return options;
  }, [tokens]);

  // Фильтруем сотрудников по поисковому запросу
  const filteredEmployees = useMemo(() => {
    const availableEmployees = employees.filter(emp => !selectedEmployees.find(p => p.employeeId === emp.id));
    
    if (!searchQuery.trim()) {
      return availableEmployees.slice(0, 5);
    }

          return availableEmployees
        .filter(emp => {
          const searchLower = searchQuery.toLowerCase();
          const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.full_name || emp.name || '';
          const position = emp.position || '';
          const department = typeof emp.department === 'string' ? emp.department : emp.department?.name || '';
          
          return name.toLowerCase().includes(searchLower) ||
                 position.toLowerCase().includes(searchLower) ||
                 department.toLowerCase().includes(searchLower);
        })
        .slice(0, 10);
  }, [searchQuery, selectedEmployees, employees]);

  const handleAddEmployee = (employee) => {
    const newEmployee = {
      employeeId: employee.id,
      employeeName: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.full_name || employee.name || 'Не указано',
      employeePosition: employee.position,
      employeeDepartment: typeof employee.department === 'string' ? employee.department : employee.department?.name || 'Не указан',
      avatar: employee.avatar
    };
    
    setSelectedEmployees([...selectedEmployees, newEmployee]);
    setSearchQuery('');
  };

  const handleRemoveEmployee = (employeeId) => {
    setSelectedEmployees(selectedEmployees.filter(p => p.employeeId !== employeeId));
  };

  const handleTokenChange = (option) => {
    setSelectedTokenOption(option);
    if (option) {
      // Находим полный объект токена по id
      const fullToken = tokens.find(token => token.id === option.value);
      setSelectedToken(fullToken);
    } else {
      setSelectedToken(null);
    }
  };

  const handleSubmit = () => {
    if (!selectedToken || selectedEmployees.length === 0) {
      return;
    }

    const sendData = {
      tokenTypeId: selectedToken.id,
      employeeIds: selectedEmployees.map(emp => emp.employeeId),
      description: description,
      comment: comment,
      count: tokenAmount
    };

    onSubmit(sendData);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            Отправить токены вручную
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Выбор токена и количества */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Шаблон токена
              </label>
              <Select
                value={selectedTokenOption}
                onChange={handleTokenChange}
                options={tokenOptions}
                placeholder="Выберите шаблон токена"
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
                    backgroundColor: state.isSelected ? '#FF8A15' : state.isFocused ? '#FFE5CC' : '#fff',
                    color: state.isSelected ? '#fff' : '#2D2D2D',
                    cursor: 'pointer',
                  }),
                  indicatorSeparator: () => ({ display: 'none' }),
                }}
                isClearable
                menuPortalTarget={document.body}
                menuPlacement="auto"
                isDisabled={tokenOptions.length === 0}
                noOptionsMessage={() => "Нет доступных токенов"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Количество токенов
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Количество"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание токена
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Введите описание токена (необязательно)"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Введите комментарий (необязательно)"
                rows="2"
              />
            </div>
          </div>

          {/* Выбранные сотрудники */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Выбранные сотрудники ({selectedEmployees.length})
            </h4>
            {selectedEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Send className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Сотрудники не выбраны</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEmployees.map((employee) => (
                  <div key={employee.employeeId} className="flex items-center justify-between p-3 bg-gray/5 rounded-[8px]">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={employee.avatar}
                        alt={employee.employeeName}
                        size="sm"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.employeeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.employeePosition} • {typeof employee.employeeDepartment === 'string' ? employee.employeeDepartment : employee.employeeDepartment?.name || 'Не указан'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveEmployee(employee.employeeId)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Поиск сотрудников */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поиск сотрудников
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите имя, должность или отдел..."
                className="w-full px-3 py-2 pl-10 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            {/* Результаты поиска */}
            {filteredEmployees.length > 0 && (
              <div className="mt-2 border border-gray/20 rounded-[8px] max-h-48 overflow-y-auto">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 hover:bg-gray/5 cursor-pointer border-b border-gray/10 last:border-b-0"
                    onClick={() => handleAddEmployee(employee)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={employee.avatar}
                        alt={employee.name}
                        size="sm"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.full_name || employee.name || 'Не указано'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.position} • {typeof employee.department === 'string' ? employee.department : employee.department?.name || 'Не указан'}
                        </div>
                      </div>
                    </div>
                    <UserPlus className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 p-6 border-t border-gray/20">
          <button
            onClick={handleSubmit}
            disabled={!selectedToken || selectedEmployees.length === 0}
            className="flex-1 bg-primary text-white px-4 py-2 rounded-[8px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Отправить токены ({selectedEmployees.length})
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium hover:bg-gray/10 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
} 