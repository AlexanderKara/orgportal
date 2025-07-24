import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Plus, Trash2 } from 'lucide-react';
import Select from 'react-select';
import Button from './ui/Button';
import api from '../services/api';
import { showNotification } from '../utils/notifications';

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
    paddingRight: 0,
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: 8,
    zIndex: 99999,
    minWidth: 'fit-content',
    width: 'auto',
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
};

// Удаляем моковые данные - теперь используем реальные API

const vacationTypes = [
  { value: 'annual', label: 'Ежегодный отпуск' },
  { value: 'sick', label: 'Больничный' },
  { value: 'maternity', label: 'Декретный отпуск' },
  { value: 'study', label: 'Учебный отпуск' },
  { value: 'unpaid', label: 'Отпуск без содержания' },
  { value: 'other', label: 'Другой' },
];

// Добавить функцию для маппинга типа отпуска из строки в value для селекта
function mapVacationTypeToValue(type) {
  switch (type) {
    case 'Основной': return 'annual';
    case 'Больничный': return 'sick';
    case 'Декретный': return 'maternity';
    case 'Учебный': return 'study';
    case 'Без содержания': return 'unpaid';
    case 'Другой': return 'other';
    case 'annual': return 'annual';
    case 'sick': return 'sick';
    case 'maternity': return 'maternity';
    case 'study': return 'study';
    case 'unpaid': return 'unpaid';
    case 'other': return 'other';
    default: return '';
  }
}

export default function VacationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingVacation = null,
  existingVacations = [],
  hideEmployeeSelect = false,
  currentEmployee = null
}) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vacationType, setVacationType] = useState(null);
  const [description, setDescription] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [dateError, setDateError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Загрузка сотрудников
  useEffect(() => {
    const loadEmployees = async () => {
      if (isOpen && employees.length === 0 && !hideEmployeeSelect) {
        try {
          setLoading(true);
          const response = await api.getEmployees();
          setEmployees(response.data || response || []);
        } catch (error) {
          console.error('Error loading employees:', error);
          setEmployees([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadEmployees();
  }, [isOpen, employees.length, hideEmployeeSelect]);

  // Reset form when modal opens/closes or editing vacation changes
  useEffect(() => {
    if (isOpen) {
      if (editingVacation) {
        setSelectedEmployee(
          employees.find(emp => emp.id === editingVacation.employeeId) || null
        );
        setStartDate(editingVacation.startDate || editingVacation.start_date || '');
        setEndDate(editingVacation.endDate || editingVacation.end_date || '');
        // Маппинг типа отпуска из строки
        const mappedType = mapVacationTypeToValue(editingVacation.type || editingVacation.vacation_type);
        setVacationType(
          vacationTypes.find(type => type.value === mappedType) || null
        );
        setDescription(editingVacation.description || '');
      } else {
        if (hideEmployeeSelect && currentEmployee) {
          setSelectedEmployee(currentEmployee);
        } else {
          setSelectedEmployee(null);
        }
        setStartDate('');
        setEndDate('');
        setVacationType(null);
        setDescription('');
      }
      setEmployeeError('');
      setDateError('');
    }
  }, [isOpen, editingVacation, employees, hideEmployeeSelect, currentEmployee]);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Устанавливаем время в 00:00:00 для корректного расчета
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 to include both start and end dates
  };

  const validateForm = () => {
    let isValid = true;
    
    if (!hideEmployeeSelect && !selectedEmployee) {
      setEmployeeError('Выберите сотрудника');
      isValid = false;
    } else {
      setEmployeeError('');
    }

    if (!startDate || !endDate) {
      setDateError('Укажите даты начала и окончания отпуска');
      isValid = false;
    } else if (new Date(startDate) > new Date(endDate)) {
      setDateError('Дата начала не может быть позже даты окончания');
      isValid = false;
    } else {
      setDateError('');
    }

    if (!vacationType) {
      showNotification('Выберите тип отпуска', 'error');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const daysCount = calculateDays(startDate, endDate);
    const employee = hideEmployeeSelect ? currentEmployee : selectedEmployee;

    onSubmit({
      employeeId: employee.id,
      employeeName: employee.name,
      employeeDepartment: employee.department,
      startDate: startDate,
      endDate: endDate,
      daysCount: daysCount,
      type: vacationType.value,
      description: description.trim()
    });

    // Reset form
    if (!hideEmployeeSelect) {
      setSelectedEmployee(null);
    }
    setStartDate('');
    setEndDate('');
    setVacationType(null);
    setDescription('');
    setEmployeeError('');
    setDateError('');
  };

  const handleCancel = () => {
    if (!hideEmployeeSelect) {
      setSelectedEmployee(null);
    }
    setStartDate('');
    setEndDate('');
    setVacationType(null);
    setDescription('');
    setEmployeeError('');
    setDateError('');
    onClose();
  };

  const handleDateChange = (field, value) => {
    if (field === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    
    // Clear date error when user starts typing
    if (dateError) {
      setDateError('');
    }
  };

  const handleEmployeeChange = (employee) => {
    setSelectedEmployee(employee);
    if (employeeError) {
      setEmployeeError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {editingVacation ? 'Редактировать отпуск' : 'Добавить отпуск'}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="vacation-form" className="space-y-4" onSubmit={handleSubmit}>
            {/* Сотрудник */}
            {!hideEmployeeSelect && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник *</label>
                <Select
                  placeholder={loading ? "Загрузка сотрудников..." : "Выберите сотрудника"}
                  options={employees}
                  styles={customSelectStyles}
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                  getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.department?.name || 'Без отдела'})`}
                  getOptionValue={(option) => option.id}
                  isLoading={loading}
                  menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                />
                {employeeError && (
                  <p className="text-red-500 text-sm mt-1">{employeeError}</p>
                )}
              </div>
            )}

            {/* Информация о текущем сотруднике */}
            {hideEmployeeSelect && currentEmployee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
                <div className="px-3 py-2 bg-gray-100 rounded-[8px] text-gray-700">
                  {currentEmployee.first_name} {currentEmployee.last_name} ({currentEmployee.department?.name || 'Без отдела'})
                </div>
              </div>
            )}

            {/* Даты */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary ${
                    dateError ? 'border-red-500' : 'border-gray/20'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary ${
                    dateError ? 'border-red-500' : 'border-gray/20'
                  }`}
                  required
                />
              </div>
            </div>

            {dateError && (
              <p className="text-red-500 text-sm">{dateError}</p>
            )}



            {/* Тип отпуска */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип отпуска *</label>
              <Select
                placeholder="Выберите тип отпуска"
                options={vacationTypes}
                styles={customSelectStyles}
                value={vacationType}
                onChange={setVacationType}
                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Дополнительная информация о отпуске"
                rows={3}
              />
            </div>
          </form>
        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="vacation-form"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              {editingVacation ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 