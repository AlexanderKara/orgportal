import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, 
  Download, Upload, Archive, Check, X, Shield, UserCheck,
  Power, PowerOff, SortAsc, SortDesc
} from 'lucide-react';
import Select from 'react-select';
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
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#FF8A15',
    color: '#fff',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#fff',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#fff',
    ':hover': {
      backgroundColor: '#e67e00',
      color: '#fff',
    },
  }),
};

const statusOptions = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Неактивные' },
];

export default function UserRoles() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [sortBy, setSortBy] = useState('last_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bulkSelectedRoles, setBulkSelectedRoles] = useState([]);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Загружаем данные
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [employeesResponse, rolesResponse] = await Promise.all([
          api.getEmployees(),
          api.getRoles()
        ]);
        
        // Извлекаем данные из ответов API
        const employeesData = employeesResponse.data || [];
        const rolesData = rolesResponse.data || [];
        
        setEmployees(employeesData);
        setRoles(rolesData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Фильтрация и сортировка сотрудников
  const filteredEmployees = useMemo(() => {
    if (loading || !Array.isArray(employees)) return [];
    
    let filtered = [...employees];

    if (search.trim()) {
      filtered = filtered.filter(employee => 
        `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase().includes(search.trim().toLowerCase()) ||
        (employee.position || '').toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    if (selectedStatus && selectedStatus.value !== 'all') {
      filtered = filtered.filter(employee => employee.status === selectedStatus.value);
    }

    if (selectedRole && selectedRole.value !== 'all') {
      if (selectedRole.value === 'assigned') {
        filtered = filtered.filter(employee => employee.adminRoles && employee.adminRoles.length > 0);
      } else if (selectedRole.value === 'unassigned') {
        filtered = filtered.filter(employee => !employee.adminRoles || employee.adminRoles.length === 0);
      } else {
        filtered = filtered.filter(employee => 
          employee.adminRoles && employee.adminRoles.some(role => role.id === parseInt(selectedRole.value))
        );
      }
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'last_name':
          aValue = a.last_name || '';
          bValue = b.last_name || '';
          break;
        case 'first_name':
          aValue = a.first_name || '';
          bValue = b.first_name || '';
          break;
        case 'department':
          aValue = a.department?.name || '';
          bValue = b.department?.name || '';
          break;
        case 'adminRole':
          aValue = a.adminRoles && a.adminRoles.length > 0 ? a.adminRoles[0]?.name || '' : '';
          bValue = b.adminRoles && b.adminRoles.length > 0 ? b.adminRoles[0]?.name || '' : '';
          break;
        default:
          aValue = a.last_name || '';
          bValue = b.last_name || '';
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, search, selectedStatus, selectedRole, sortBy, sortDirection, loading]);

  if (loading) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleRoleChange = async (employeeId, selectedRoles) => {
    try {
      // Преобразуем выбранные роли в правильный формат
      const roleIds = selectedRoles ? selectedRoles.map(role => role.value) : [];
      const selectedRoleObjects = roles.filter(role => roleIds.includes(role.id));
      
      // Отправляем изменения на сервер
      await api.assignEmployeeRoles(employeeId, roleIds);
      
      // Обновляем локальное состояние
      setEmployees(prev => prev.map(employee => 
        employee.id === employeeId 
          ? { 
              ...employee, 
              adminRoles: selectedRoleObjects
            }
          : employee
      ));
      
      // Показываем уведомление об успехе
      showNotification('Роли сотрудника успешно обновлены', 'success');
      setEditingCell(null);
    } catch (error) {
      console.error('Error updating employee role:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      showNotification('Ошибка при обновлении роли сотрудника: ' + errorMessage, 'error');
      
      // Обновляем данные с сервера в случае ошибки
      const loadData = async () => {
        try {
          const [employeesResponse, rolesResponse] = await Promise.all([
            api.getEmployees(),
            api.getRoles()
          ]);
          
          const employeesData = employeesResponse.data || [];
          const rolesData = rolesResponse.data || [];
          
          setEmployees(employeesData);
          setRoles(rolesData);
        } catch (reloadError) {
          console.error('Error reloading data:', reloadError);
        }
      };
      
      loadData();
    }
  };

  const handleAccessToggle = async (employeeId) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      const newStatus = employee.status === 'active' ? 'inactive' : 'active';
      
      // Отправляем изменения на сервер
      await api.updateEmployee(employeeId, { status: newStatus });
      
      // Обновляем локальное состояние
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, status: newStatus }
          : emp
      ));

      // Если отключаем доступ, разлогиниваем пользователя
      if (newStatus === 'inactive') {
        try {
          await api.logout();
          // Перенаправляем на страницу входа
          window.location.href = '/auth';
        } catch (logoutError) {
          console.error('Error logging out user:', logoutError);
        }
      }
    } catch (error) {
      console.error('Error toggling access:', error);
      showNotification('Ошибка при изменении доступа', 'error');
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(employee => employee.id)));
    }
  };

  const handleSelectEmployee = (employeeId) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleBulkRoleAssign = async () => {
    if (!bulkSelectedRoles || bulkSelectedRoles.length === 0) {
      showNotification('Выберите роли для назначения', 'warning');
      return;
    }
    
    try {
      setBulkAssigning(true);
      
      // Преобразуем выбранные роли в правильный формат
      const roleIds = bulkSelectedRoles.map(role => role.value);
      const selectedRoleObjects = roles.filter(role => roleIds.includes(role.id));
      const employeeIds = Array.from(selectedEmployees);
      
      await api.assignBulkRoles(employeeIds, roleIds);
      
      // Обновляем локальное состояние
      setEmployees(prev => prev.map(employee => 
        selectedEmployees.has(employee.id)
          ? { 
              ...employee, 
              adminRoles: selectedRoleObjects
            }
          : employee
      ));
      
      // Показываем уведомление об успехе
      showNotification(`Роли успешно назначены ${selectedEmployees.size} сотрудникам`, 'success');
      
      // Очищаем состояние
      setSelectedEmployees(new Set());
      setBulkSelectedRoles([]);
    } catch (error) {
      console.error('Error assigning bulk roles:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      showNotification('Ошибка при массовом назначении ролей: ' + errorMessage, 'error');
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleExport = () => {
    const data = filteredEmployees.map(employee => ({
      'ФИО': `${employee.first_name || ''} ${employee.last_name || ''}`,
      'Должность': employee.position || '',
      'Отдел': employee.department?.name || '',
      'Статус': getStatusText(employee.status) || '',
      'Административная роль': employee.adminRoles && employee.adminRoles.length > 0 
        ? employee.adminRoles.map(role => role.name).join('\n')
        : '',
    }));

    // Используем универсальную функцию экспорта в Excel
    exportData(data, 'user-roles', 'excel', null, 'Роли пользователей');
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

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Активный';
      case 'inactive': return 'Неактивный';
      default: return 'Неизвестно';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'shield-check': return <Shield className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'user-check': return <UserCheck className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'user-group': return <Users className="w-4 h-4" />;
      case 'briefcase': return <Shield className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getRoleOptions = () => {
    return roles.map(role => ({
      value: role.id,
      label: role.name,
      color: role.color || '#6B7280',
      icon: role.icon || 'shield'
    }));
  };

  const roleOptions = [
    { value: 'all', label: 'Все роли' },
    { value: 'assigned', label: 'С назначенными ролями' },
    { value: 'unassigned', label: 'Без ролей' },
    ...roles.map(role => ({
      value: role.id.toString(),
      label: role.name
    }))
  ];

  function getRoleText(role) {
    switch (role) {
      case 'lead': return 'Лид';
      case 'deputy': return 'Зам';
      case 'product': return 'Продакт';
      default: return role || '';
    }
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[24px] lg:text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Назначение ролей пользователям</h1>
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
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего сотрудников</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredEmployees.length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">С назначенными ролями</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredEmployees.filter(e => e.adminRoles && e.adminRoles.length > 0).length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Без ролей</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredEmployees.filter(e => !e.adminRoles || e.adminRoles.length === 0).length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Выбрано</span>
          </div>
          <div className="text-2xl font-bold text-dark">{selectedEmployees.size}</div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col lg:flex-row items-center gap-2 bg-white rounded-[12px] border border-gray/50 p-1 mb-6 min-h-[56px]">
        <div className="flex-1 flex items-center w-full">
          <input
            type="text"
            placeholder="Поиск по ФИО или должности..."
            className="w-full bg-transparent outline-none text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Select
            placeholder="Статус"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statusOptions}
            styles={customSelectStyles}
            className="w-full lg:w-40"
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
          <Select
            placeholder="Роль"
            value={selectedRole}
            onChange={setSelectedRole}
            options={roleOptions}
            styles={customSelectStyles}
            className="w-full lg:w-40"
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
      </div>

      {/* Панель массовых операций */}
      {selectedEmployees.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Выбрано {selectedEmployees.size} сотрудников
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                placeholder="Выберите роли для назначения"
                value={bulkSelectedRoles}
                options={getRoleOptions()}
                styles={customSelectStyles}
                className="w-64"
                isMulti
                onChange={(options) => setBulkSelectedRoles(options || [])}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                formatOptionLabel={(option) => (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: option.color || '#6B7280' }}
                    >
                      {getIconComponent(option.icon)}
                    </div>
                    <span>{option.label}</span>
                  </div>
                )}
              />
              <button
                onClick={handleBulkRoleAssign}
                disabled={bulkAssigning || bulkSelectedRoles.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  bulkAssigning || bulkSelectedRoles.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {bulkAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Назначаем...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Назначить роли</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedEmployees(new Set());
                  setBulkSelectedRoles([]);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Отменить выбор"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {bulkSelectedRoles.length > 0 && (
            <div className="mt-3 text-sm text-blue-700">
              Выбрано ролей: {bulkSelectedRoles.length}
            </div>
          )}
        </div>
      )}

      {/* Таблица сотрудников */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <Checkbox
                    checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('last_name')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Сотрудник
                    {sortBy === 'last_name' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Должность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('department')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Отдел
                    {sortBy === 'department' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('adminRole')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Административная роль
                    {sortBy === 'adminRole' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray/20">
              {filteredEmployees.map((employee, index) => (
                <tr key={employee.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray/5'} ${employee.status === 'inactive' ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedEmployees.has(employee.id)}
                      onChange={() => handleSelectEmployee(employee.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={employee.avatar}
                        name={`${employee.first_name || ''} ${employee.last_name || ''}`}
                        size="sm"
                      />
                      <div>
                        <div className={`text-sm font-medium ${employee.status === 'inactive' ? 'text-gray-500' : 'text-gray-900'}`}>
                          {employee.first_name || ''} {employee.last_name || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${employee.status === 'inactive' ? 'text-gray-500' : 'text-gray-600'}`}>{employee.position || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${employee.status === 'inactive' ? 'text-gray-500' : 'text-gray-600'}`}>{employee.department?.name || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === employee.id ? (
                      <Select
                        value={employee.adminRoles ? employee.adminRoles.map(role => ({
                          value: role.id,
                          label: role.name,
                          color: role.color || '#6B7280',
                          icon: role.icon || 'shield'
                        })) : []}
                        onChange={(options) => handleRoleChange(employee.id, options)}
                        options={getRoleOptions()}
                        styles={customSelectStyles}
                        className="w-64"
                        isMulti
                        menuPlacement="auto"
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        formatOptionLabel={(option) => (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                              style={{ backgroundColor: option.color || '#6B7280' }}
                            >
                              {getIconComponent(option.icon)}
                            </div>
                            <span>{option.label}</span>
                          </div>
                        )}
                      />
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                        onClick={() => setEditingCell(employee.id)}
                      >
                        {employee.adminRoles && employee.adminRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {employee.adminRoles.map((role, idx) => (
                              <div key={role.id} className="flex items-center gap-1">
                                <div 
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                                  style={{ backgroundColor: role.color || '#6B7280' }}
                                >
                                  {getIconComponent(role.icon)}
                                </div>
                                <span className={`text-sm font-medium ${employee.status === 'inactive' ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {getRoleText(role.name)}
                                </span>
                                {idx < employee.adminRoles.length - 1 && <span className="text-gray-400">,</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className={`text-sm ${employee.status === 'inactive' ? 'text-gray-400' : 'text-gray-500'}`}>Не назначена</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                      {getStatusText(employee.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleAccessToggle(employee.id)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title={employee.status === 'active' ? 'Отключить доступ' : 'Включить доступ'}
                    >
                      {employee.status === 'active' ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {employee.status === 'active' ? 'Отключить' : 'Включить'}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 