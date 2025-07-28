import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, Search, Filter, Plus, Edit, Trash2, 
  Download, Upload, Archive, Check, X, User, Clock, FileText
} from 'lucide-react';
import Select from 'react-select';
import VacationModal from '../../components/VacationModal';
import Avatar from '../../components/ui/Avatar';
import Checkbox from '../../components/ui/Checkbox';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';
import { exportData, importFile } from '../../utils/exportUtils';

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

export default function Vacations() {
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [sortBy, setSortBy] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVacation, setEditingVacation] = useState(null);
  const [selectedVacations, setSelectedVacations] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);

  // Определяем типы отпусков
  const vacationTypes = [
    { value: 'all', label: 'Все типы' },
    { value: 'annual', label: 'Ежегодный отпуск' },
    { value: 'sick', label: 'Больничный' },
    { value: 'maternity', label: 'Декретный отпуск' },
    { value: 'unpaid', label: 'Отпуск без содержания' },
    { value: 'study', label: 'Учебный отпуск' },
    { value: 'other', label: 'Другой' }
  ];

  // Определяем статусы отпусков
  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    { value: 'approved', label: 'Одобрен' },
    { value: 'pending', label: 'На рассмотрении' },
    { value: 'rejected', label: 'Отклонен' },
    { value: 'archived', label: 'Архивирован' }
  ];

  // Load vacations from API
  useEffect(() => {
    loadVacations();
  }, []);

  const loadVacations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Сначала пробуем админский эндпоинт, если не получится - используем обычный
      let response;
      try {
        response = await api.getVacationsAdmin();
        console.log('Admin vacations response:', response);
      } catch (adminError) {
        console.log('Admin endpoint failed, trying regular endpoint:', adminError);
        response = await api.getVacations();
        console.log('Regular vacations response:', response);
      }
      
      // Обрабатываем данные отпусков
      const vacationsData = response.vacations || response || [];
      console.log('Processed admin vacations data:', vacationsData);
      setVacations(vacationsData);
    } catch (err) {
      console.error('Error loading vacations:', err);
      setError(err.message || 'Failed to load vacations');
      setVacations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация и сортировка данных
  const filteredVacations = useMemo(() => {
    let filtered = [...vacations];

    // Расширенный вывод для отладки
    console.log('==== ОТЛАДКА: vacations (admin) ====', JSON.stringify(vacations, null, 2));
    console.log('==== ОТЛАДКА: первый отпуск (admin) ====', JSON.stringify(vacations[0], null, 2));

    if (search.trim()) {
      filtered = filtered.filter(vacation => 
        (vacation.employee && vacation.employee.first_name && vacation.employee.first_name.toLowerCase().includes(search.trim().toLowerCase())) ||
        (vacation.employee && vacation.employee.last_name && vacation.employee.last_name.toLowerCase().includes(search.trim().toLowerCase())) ||
        (vacation.description && vacation.description.toLowerCase().includes(search.trim().toLowerCase()))
      );
    }

    if (selectedType && selectedType.value !== 'all') {
      filtered = filtered.filter(vacation => vacation.type === selectedType.value);
    }

    if (selectedStatus && selectedStatus.value !== 'all') {
      filtered = filtered.filter(vacation => vacation.status === selectedStatus.value);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'employeeName':
          aValue = `${a.employee?.first_name || ''} ${a.employee?.last_name || ''}`;
          bValue = `${b.employee?.first_name || ''} ${b.employee?.last_name || ''}`;
          break;
        case 'start_date':
          aValue = a.start_date;
          bValue = b.start_date;
          break;
        case 'end_date':
          aValue = a.end_date;
          bValue = b.end_date;
          break;
        case 'daysCount':
          aValue = a.days_count || 0;
          bValue = b.days_count || 0;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = a.start_date;
          bValue = b.start_date;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [vacations, search, selectedType, selectedStatus, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (vacation) => {
    setEditingVacation({
      id: vacation.id,
      employeeId: vacation.employee_id || vacation.employee?.id,
      startDate: vacation.start_date,
      endDate: vacation.end_date,
      type: mapVacationTypeToValue(vacation.type || vacation.vacation_type),
      description: vacation.description || ''
    });
    setShowAddModal(true);
  };

  const handleArchive = async (vacationId) => {
    if (window.confirm('Вы уверены, что хотите архивировать этот отпуск?')) {
      try {
        await api.updateVacation(vacationId, { status: 'archived' });
        await loadVacations();
      } catch (err) {
        console.error('Error archiving vacation:', err);
        showNotification('Ошибка при архивировании отпуска', 'error');
      }
    }
  };

  const handleDelete = async (vacationId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отпуск?')) {
      try {
        await api.deleteVacation(vacationId);
        await loadVacations();
      } catch (err) {
        console.error('Error deleting vacation:', err);
        showNotification('Ошибка при удалении отпуска', 'error');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedVacations.size === filteredVacations.length) {
      setSelectedVacations(new Set());
    } else {
      setSelectedVacations(new Set(filteredVacations.map(vacation => vacation.id)));
    }
  };

  const handleSelectVacation = (vacationId) => {
    const newSelected = new Set(selectedVacations);
    if (newSelected.has(vacationId)) {
      newSelected.delete(vacationId);
    } else {
      newSelected.add(vacationId);
    }
    setSelectedVacations(newSelected);
  };

  const handleInlineEdit = (vacationId, field, value) => {
    // Логика инлайн редактирования
    setEditingCell(null);
  };

  // Функция для форматирования даты в формат DD.MM.YYYY
  const formatDateForExport = (dateString) => {
    if (!dateString || dateString === '') {
      return '';
    }
    
    try {
      // Если дата в формате ISO (2025-07-13T00:00:00.000Z)
      if (dateString.includes('T')) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}.${month}.${year}`;
      }
      
      // Если дата в формате YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}.${month}.${year}`;
      }
      
      // Если дата уже в формате DD.MM.YYYY
      if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateString)) {
        return dateString;
      }
      
      return dateString;
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return dateString;
    }
  };

  const handleExport = () => {
    const data = filteredVacations.map(vacation => ({
      'Сотрудник': `${vacation.employee?.first_name || ''} ${vacation.employee?.last_name || ''}`,
      'Дата начала': formatDateForExport(vacation.start_date),
      'Дата окончания': formatDateForExport(vacation.end_date),
      'Количество дней': vacation.days_count || '',
      'Тип отпуска': getTypeText(vacation.type) || '',
      'Описание': vacation.description || '',
      'Статус': getStatusText(vacation.status) || ''
    }));
    
    // Используем универсальную функцию экспорта в Excel
    exportData(data, 'vacations', 'excel', null, 'Отпуска');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Используем универсальную функцию импорта
          const importedData = await importFile(file);
          console.log('Imported data:', importedData);
          // Здесь можно добавить логику обработки импортированных данных
        } catch (error) {
          console.error('Ошибка импорта:', error);
          showNotification('Ошибка при импорте файла', 'error');
        }
      }
    };
    input.click();
  };

  const handleCreateVacation = async (vacationData) => {
    try {
      await api.createVacation(vacationData);
      setShowAddModal(false);
      await loadVacations();
    } catch (err) {
      console.error('Error creating vacation:', err);
      showNotification('Ошибка при создании отпуска', 'error');
    }
  };

  const handleUpdateVacation = async (vacationData) => {
    try {
      await api.updateVacation(editingVacation.id, vacationData);
      setShowAddModal(false);
      setEditingVacation(null);
      await loadVacations();
    } catch (err) {
      console.error('Error updating vacation:', err);
      showNotification('Ошибка при обновлении отпуска', 'error');
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'annual':
        return 'Ежегодный отпуск';
      case 'sick':
        return 'Больничный';
      case 'maternity':
        return 'Декретный отпуск';
      case 'study':
        return 'Учебный отпуск';
      case 'unpaid':
        return 'Отпуск без содержания';
      case 'other':
        return 'Другой';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'archived':
        return 'Архивный';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка отпусков...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Ошибка: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Заголовок */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[24px] lg:text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Управление отпусками</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden lg:inline">Импорт</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Экспорт</span>
          </button>
          <button
            onClick={() => {
              setShowAddModal(true);
              setEditingVacation(null);
            }}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Добавить отпуск</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего отпусков</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredVacations.length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Активных</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredVacations.filter(v => v.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600">Архивных</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredVacations.filter(v => v.status === 'archived').length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Выбрано</span>
          </div>
          <div className="text-2xl font-bold text-dark">{selectedVacations.size}</div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col lg:flex-row items-center gap-2 bg-white rounded-[12px] border border-gray/50 p-1 mb-6 min-h-[56px]">
        <div className="flex-1 flex items-center w-full">
          <input
            type="text"
            placeholder="Поиск по сотруднику, должности или описанию..."
            className="w-full bg-transparent outline-none text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Select
            placeholder="Тип отпуска"
            value={selectedType}
            onChange={setSelectedType}
            options={vacationTypes}
            styles={customSelectStyles}
            className="w-full lg:w-40"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            menuPosition="fixed"
          />
          <Select
            placeholder="Статус"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statusOptions}
            styles={customSelectStyles}
            className="w-full lg:w-40"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
            menuPosition="fixed"
          />
        </div>
      </div>

      {/* Таблица отпусков */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <Checkbox
                    checked={selectedVacations.size === filteredVacations.length && filteredVacations.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('employeeName')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Сотрудник
                    {sortBy === 'employeeName' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('employeeDepartment')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Отдел
                    {sortBy === 'employeeDepartment' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('start_date')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Начало отпуска
                    {sortBy === 'start_date' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('end_date')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Конец отпуска
                    {sortBy === 'end_date' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('daysCount')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Дней
                    {sortBy === 'daysCount' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('type')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Тип отпуска
                    {sortBy === 'type' ? (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    ) : ' ↕'}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray/20">
              {filteredVacations.map((vacation, index) => (
                <tr key={vacation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedVacations.has(vacation.id)}
                      onChange={() => handleSelectVacation(vacation.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar
                        src={vacation.employee?.avatar || ""}
                        name={`${vacation.employee?.first_name || ''} ${vacation.employee?.last_name || ''}`}
                        size="xs"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{`${vacation.employee?.first_name || ''} ${vacation.employee?.last_name || ''}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{vacation.employee?.department?.name || 'Неизвестно'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${vacation.id}-start_date` ? (
                      <input
                        type="date"
                        defaultValue={vacation.start_date}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(vacation.id, 'start_date', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(vacation.id, 'start_date', e.target.value);
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                        onClick={() => setEditingCell(`${vacation.id}-start_date`)}
                      >
                        {formatDate(vacation.start_date)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${vacation.id}-end_date` ? (
                      <input
                        type="date"
                        defaultValue={vacation.end_date}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(vacation.id, 'end_date', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(vacation.id, 'end_date', e.target.value);
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                        onClick={() => setEditingCell(`${vacation.id}-end_date`)}
                      >
                        {formatDate(vacation.end_date)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vacation.days_count || vacation.days || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${vacation.id}-type` ? (
                      <Select
                        value={vacationTypes.find(type => type.value === mapVacationTypeToValue(vacation.type || vacation.vacation_type))}
                        onChange={(option) => {
                          handleInlineEdit(vacation.id, 'type', option.value);
                          setEditingCell(null);
                        }}
                        options={vacationTypes.filter(type => type.value !== 'all')}
                        styles={customSelectStyles}
                        className="w-32"
                        menuPlacement="auto"
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                        menuPosition="fixed"
                        onBlur={() => setEditingCell(null)}
                      />
                    ) : (
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vacation.status)} cursor-pointer hover:bg-opacity-80`}
                        onClick={() => setEditingCell(`${vacation.id}-type`)}
                      >
                        {getTypeText(mapVacationTypeToValue(vacation.type || vacation.vacation_type))}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(vacation)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(vacation.id)}
                        className="text-orange-600 hover:text-orange-900"
                        title={vacation.status === 'archived' ? 'Активировать' : 'Архивировать'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vacation.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно добавления/редактирования отпуска */}
      <VacationModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingVacation(null);
        }}
        onSubmit={editingVacation ? handleUpdateVacation : handleCreateVacation}
        editingVacation={editingVacation}
        existingVacations={vacations}
      />
    </div>
  );
} 