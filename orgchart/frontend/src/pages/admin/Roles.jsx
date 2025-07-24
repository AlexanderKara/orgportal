import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, Search, Filter, Plus, Edit, Trash2, 
  Download, Upload, Archive, Check, X, Users, Key, Settings, SortAsc, SortDesc
} from 'lucide-react';
import Select from 'react-select';
import RoleModal from '../../components/RoleModal';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';
import { useAuth } from '../../contexts/AuthContext';

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
    zIndex: 9999,
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

const statusOptions = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Неактивные' },
  { value: 'archived', label: 'Архивные' },
];

const permissionModules = [
  { value: 'employees', label: 'Сотрудники' },
  { value: 'departments', label: 'Отделы' },
  { value: 'skills', label: 'Навыки' },
  { value: 'skillGroups', label: 'Группы навыков' },
  { value: 'products', label: 'Продукты' },
  { value: 'vacations', label: 'Отпуска' },
  { value: 'roles', label: 'Роли' },
  { value: 'system', label: 'Система' },
  { value: 'analytics', label: 'Аналитика' },
  { value: 'reports', label: 'Отчеты' },
];

const permissionActions = [
  { value: 'create', label: 'Создание' },
  { value: 'read', label: 'Просмотр' },
  { value: 'update', label: 'Редактирование' },
  { value: 'delete', label: 'Удаление' },
  { value: 'manage', label: 'Управление' },
  { value: 'export', label: 'Экспорт' },
  { value: 'import', label: 'Импорт' },
  { value: 'approve', label: 'Утверждение' },
  { value: 'assign', label: 'Назначение' },
  { value: 'configure', label: 'Настройка' },
  { value: 'backup', label: 'Резервное копирование' },
  { value: 'restore', label: 'Восстановление' },
];

export default function Roles() {
  const { userData } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState(new Set());

  // Проверяем, является ли текущий пользователь главным администратором
  const isMainAdmin = userData && userData.adminRoles && 
    userData.adminRoles.some(role => role.name === 'Главный администратор');

  // Загрузка ролей при монтировании компонента
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getRoles();
      
      // Проверяем структуру ответа и обрабатываем данные
      let rolesData = [];
      if (response && response.data) {
        rolesData = response.data;
      } else if (Array.isArray(response)) {
        rolesData = response;
      } else if (response && response.roles) {
        rolesData = response.roles;
      }
      
      // Убеждаемся, что у каждой роли есть все необходимые поля
      const processedRoles = rolesData.map(role => ({
        id: role.id,
        name: role.name || '',
        description: role.description || '',
        permissions: role.permissions || [],
        visible_sections: role.visible_sections || [],
        visible_views: role.visible_views || [],
        is_system: role.is_system || false,
        status: role.status || 'active',
        employee_count: role.employee_count || 0,
        color: role.color || '#3B82F6',
        icon: role.icon || 'shield'
      }));
      
      setRoles(processedRoles);
      console.log('Загружено ролей:', processedRoles.length);
    } catch (err) {
      console.error('Ошибка загрузки ролей:', err);
      setError(err.message || 'Ошибка загрузки ролей');
      setRoles([]); // Устанавливаем пустой массив в случае ошибки
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация и сортировка ролей
  const filteredRoles = useMemo(() => {
    let filtered = [...roles];

    if (search.trim()) {
      filtered = filtered.filter(role => 
        role.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(search.trim().toLowerCase()))
      );
    }

    if (selectedStatus && selectedStatus.value !== 'all') {
      filtered = filtered.filter(role => role.status === selectedStatus.value);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'employeeCount':
          aValue = a.employee_count || 0;
          bValue = b.employee_count || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = a.createdAt || new Date();
          bValue = b.createdAt || new Date();
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [roles, search, selectedStatus, sortBy, sortDirection]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (role) => {
    if (!role) {
      console.error('Попытка редактирования роли без данных');
      return;
    }
    setEditingRole(role);
    setShowAddModal(true);
  };

  const handleArchive = async (roleId) => {
    try {
      const role = roles.find(r => r.id === roleId);
      const newStatus = role.status === 'archived' ? 'active' : 'archived';
      
      await api.updateRole(roleId, { status: newStatus });
      await loadRoles(); // Перезагружаем данные
    } catch (err) {
      console.error('Ошибка архивирования роли:', err);
      showNotification('Ошибка при архивировании роли', 'error');
    }
  };

  const handleDelete = async (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role.is_system) {
      showNotification('Нельзя удалить системную роль', 'warning');
      return;
    }
    if (role.employee_count > 0) {
      showNotification(`Нельзя удалить роль. Она назначена ${role.employee_count} сотруднику(ам)`, 'warning');
      return;
    }
    if (window.confirm('Вы уверены, что хотите удалить эту роль?')) {
      try {
        await api.deleteRole(roleId);
        await loadRoles(); // Перезагружаем данные
      } catch (err) {
        console.error('Ошибка удаления роли:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
        showNotification('Ошибка при удалении роли: ' + errorMessage, 'error');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedRoles.size === filteredRoles.length) {
      setSelectedRoles(new Set());
    } else {
      setSelectedRoles(new Set(filteredRoles.map(role => role.id)));
    }
  };

  const handleSelectRole = (roleId) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  const handleExport = () => {
    const data = filteredRoles.map(role => ({
      'Название': role.name,
      'Описание': role.description || '',
      'Статус': getStatusText(role.status),
      'Сотрудников': role.employee_count || 0,
      'Системная': role.is_system ? 'Да' : 'Нет',
      'Модули': role.permissions ? role.permissions.map(p => p.module).join(';') : '',
      'Действия': role.permissions ? role.permissions.reduce((acc, p) => [...acc, ...p.actions], []).join(';') : '',
    }));

    // Экспорт с разделителем точка с запятой и экранированием
    const csv = [
      Object.keys(data[0]).join(';'),
      ...data.map(row => Object.values(row).map(value => {
        const stringValue = String(value);
        if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roles_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const csv = event.target.result;
          // Здесь будет логика обработки CSV
          console.log('CSV импорт:', csv);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCreateRole = async (roleData) => {
    try {
      console.log('Создаем новую роль с данными:', roleData);
      
      const createData = {
        name: roleData.name,
        description: roleData.description,
        color: roleData.color,
        icon: roleData.icon,
        permissions: roleData.permissions || [],
        visible_sections: roleData.visible_sections || [],
        visible_views: roleData.visible_views || [],
        status: 'active'
      };
      
      const response = await api.createRole(createData);
      console.log('Ответ от сервера при создании роли:', response);
      
      // Показываем уведомление об успехе
      showNotification('Роль успешно создана', 'success');
      
      await loadRoles(); // Перезагружаем данные
      setShowAddModal(false);
      setEditingRole(null);
    } catch (err) {
      console.error('Ошибка создания роли:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      showNotification('Ошибка при создании роли: ' + errorMessage, 'error');
    }
  };

  const handleUpdateRole = async (roleData) => {
    try {
      if (!editingRole || !editingRole.id) {
        console.error('Нет активной роли для редактирования');
        return;
      }
      
      console.log('Обновляем роль:', editingRole.id, 'с данными:', roleData);
      
      // Отправляем все данные роли на сервер
      const updateData = {
        name: roleData.name,
        description: roleData.description,
        color: roleData.color,
        icon: roleData.icon,
        permissions: roleData.permissions || [],
        visible_sections: roleData.visible_sections || [],
        visible_views: roleData.visible_views || []
      };
      
      // Добавляем status только для несистемных ролей
      if (!editingRole?.is_system) {
        updateData.status = roleData.status || 'active';
      }
      
      console.log('Обновляем поля роли:', updateData);
      const response = await api.updateRole(editingRole.id, updateData);
      console.log('Ответ от сервера:', response);
      
      // Показываем уведомление об успехе
      showNotification('Роль успешно обновлена', 'success');
      
      await loadRoles(); // Перезагружаем данные
      setShowAddModal(false);
      setEditingRole(null);
    } catch (err) {
      console.error('Ошибка обновления роли:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      showNotification('Ошибка при обновлении роли: ' + errorMessage, 'error');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Активная';
      case 'inactive': return 'Неактивная';
      case 'archived': return 'Архивная';
      default: return 'Неизвестно';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionText = (permissions) => {
    if (!permissions || !Array.isArray(permissions)) return 'Нет прав';
    
    // Если это старый формат (массив строк)
    if (permissions.length > 0 && typeof permissions[0] === 'string') {
      return permissions.join(', ');
    }
    
    // Новый формат (массив объектов)
    const moduleCount = permissions.length;
    const totalActions = permissions.reduce((acc, p) => {
      if (p.actions && Array.isArray(p.actions)) {
        return acc + p.actions.length;
      }
      return acc;
    }, 0);
    
    return `${moduleCount} модулей, ${totalActions} прав`;
  };

  const getVisibilityText = (visibleSections) => {
    if (!visibleSections || !Array.isArray(visibleSections)) return 'Нет доступа';
    
    // Если это старый формат (массив строк)
    if (visibleSections.length > 0 && typeof visibleSections[0] === 'string') {
      if (visibleSections.includes('all')) return 'Все разделы';
      return `${visibleSections.length} разделов`;
    }
    
    return `${visibleSections.length} разделов`;
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'shield-check': return <Shield className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'user-check': return <Users className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'user-group': return <Users className="w-4 h-4" />;
      case 'briefcase': return <Key className="w-4 h-4" />;
      case 'archive': return <Archive className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Загрузка ролей...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Ошибка: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[24px] lg:text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Роли и права</h1>
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
              setEditingRole(null);
            }}
            className="flex items-center gap-2 px-2 lg:px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Добавить роль</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего ролей</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredRoles.length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Активных</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredRoles.filter(r => r.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Системных</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredRoles.filter(r => r.is_system).length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Выбрано</span>
          </div>
          <div className="text-2xl font-bold text-dark">{selectedRoles.size}</div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col lg:flex-row items-center gap-2 bg-white rounded-[12px] border border-gray/50 p-1 mb-6 min-h-[56px]">
        <div className="flex-1 flex items-center w-full">
          <input
            type="text"
            placeholder="Поиск по названию или описанию роли..."
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
          />
        </div>
      </div>

      {/* Таблица ролей */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedRoles.size === filteredRoles.length && filteredRoles.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Роль
                    {sortBy === 'name' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Описание
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Права доступа
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Видимость
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('employeeCount')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Сотрудников
                    {sortBy === 'employeeCount' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Статус
                    {sortBy === 'status' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray/20">
              {filteredRoles.map((role, index) => (
                <tr key={role.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRoles.has(role.id)}
                      onChange={() => handleSelectRole(role.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: role.color || '#3B82F6' }}
                      >
                        {getIconComponent(role.icon)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{role.name}</div>
                        {role.is_system && (
                          <div className="text-xs text-gray-500">Системная роль</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {role.description || 'Нет описания'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {getPermissionText(role.permissions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {getVisibilityText(role.visible_sections)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {role.employee_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(role.status)}`}>
                      {getStatusText(role.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {/* Показываем кнопку редактирования:
                          - Главному администратору: для всех ролей, кроме своей
                          - Остальным: только для несистемных ролей */}
                      {(isMainAdmin && role.name !== 'Главный администратор' || !role.is_system) && (
                        <button
                          onClick={() => handleEdit(role)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {/* Показываем кнопку архивирования для несистемных ролей */}
                      {!role.is_system && (
                        <button
                          onClick={() => handleArchive(role.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title={role.status === 'archived' ? 'Активировать' : 'Архивировать'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      {/* Показываем кнопку удаления для несистемных ролей или системных ролей главному администратору (кроме своей) */}
                      {(!role.is_system || (isMainAdmin && role.name !== 'Главный администратор')) && (role.employee_count || 0) === 0 && (
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно добавления/редактирования роли */}
      <RoleModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingRole(null);
        }}
        onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
        role={editingRole}
      />
    </div>
  );
} 