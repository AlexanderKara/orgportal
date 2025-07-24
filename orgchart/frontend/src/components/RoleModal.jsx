import React, { useState, useEffect } from 'react';
import { X, Shield, Users, UserCheck, User, Archive, Key, Settings, Eye, EyeOff } from 'lucide-react';
import Select from 'react-select';
import api from '../services/api';
import { showNotification } from '../utils/notifications';
import { useAuth } from '../contexts/AuthContext';

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

const iconOptions = [
  { value: 'shield', label: 'Щит', icon: <Shield className="w-4 h-4" /> },
  { value: 'shield-check', label: 'Щит с галочкой', icon: <Shield className="w-4 h-4" /> },
  { value: 'users', label: 'Пользователи', icon: <Users className="w-4 h-4" /> },
  { value: 'user-check', label: 'Проверка', icon: <UserCheck className="w-4 h-4" /> },
  { value: 'user', label: 'Пользователь', icon: <User className="w-4 h-4" /> },
  { value: 'user-group', label: 'Группа пользователей', icon: <Users className="w-4 h-4" /> },
  { value: 'briefcase', label: 'Портфель', icon: <Key className="w-4 h-4" /> },
  { value: 'archive', label: 'Архив', icon: <Archive className="w-4 h-4" /> },
  { value: 'settings', label: 'Настройки', icon: <Settings className="w-4 h-4" /> },
];

export default function RoleModal({ isOpen, onClose, onSubmit, role = null, hideButtons = false }) {
  const { userData } = useAuth();
  
  // Проверяем, является ли текущий пользователь главным администратором
  const isMainAdmin = userData && userData.adminRoles && 
    userData.adminRoles.some(role => role.name === 'Главный администратор');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'shield',
    permissions: [],
    visible_sections: [],
    visible_views: []
  });
  
  // Track original data and changes
  const [originalData, setOriginalData] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());

  const [visibilityOptions, setVisibilityOptions] = useState({
    sections: [],
    views: {}
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Загружаем опции видимости при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadVisibilityOptions();
      // Если редактируем роль, загружаем её данные
      if (role) {
        setFormData({
          name: role.name ?? '',
          description: role.description ?? '',
          color: role.color ?? '#3B82F6',
          icon: role.icon ?? 'shield',
          permissions: role.permissions ?? [],
          visible_sections: role.visible_sections ?? [],
          visible_views: role.visible_views ?? []
        });
        setOriginalData(role);
      } else {
        // Сброс формы для новой роли
        setFormData({
          name: '',
          description: '',
          color: '#3B82F6',
          icon: 'shield',
          permissions: [],
          visible_sections: [],
          visible_views: []
        });
        setOriginalData({});
      }
      setChangedFields(new Set());
    }
  }, [isOpen, role]);

  const loadVisibilityOptions = async () => {
    try {
      setLoading(true);
      const response = await api.getVisibilityOptions();
      if (response && response.data) {
        setVisibilityOptions(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки опций видимости:', error);
      // Устанавливаем дефолтные опции
      setVisibilityOptions({
        sections: [
          { id: 'dashboard', label: 'Главная' },
          { id: 'structure', label: 'Орг. схема' },
          { id: 'products', label: 'Продукты' },
          { id: 'competencies', label: 'Компетенции' },
          { id: 'vacations', label: 'Отпуска' },
          { id: 'profile', label: 'Профиль' },
          { id: 'admin', label: 'Администрирование' }
        ],
        views: {
          dashboard: [
            { id: 'dashboard', label: 'Привет!' },
            { id: 'about', label: 'О нас' },
            { id: 'timeline', label: 'Что происходит?' }
          ],
          products: [
            { id: 'cards', label: 'Карточки' },
            { id: 'landscape', label: 'Ландшафт' },
            { id: 'atlas', label: 'Атлас' }
          ],
          structure: [
            { id: 'tree', label: 'Дерево' },
            { id: 'grid', label: 'Сетка' },
            { id: 'list', label: 'Список' }
          ],
          competencies: [
            { id: 'skills', label: 'Навыки' },
            { id: 'matrix', label: 'Матрица' },
            { id: 'radar', label: 'Радар' }
          ],
          admin: [
            { id: 'employees', label: 'Сотрудники' },
            { id: 'departments', label: 'Отделы' },
            { id: 'skills', label: 'Навыки' },
            { id: 'skillGroups', label: 'Группы навыков' },
            { id: 'products', label: 'Продукты' },
            { id: 'vacations', label: 'Отпуска' },
            { id: 'roles', label: 'Роли и права' },
            { id: 'userRoles', label: 'Назначение ролей' }
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Сбрасываем форму при открытии/закрытии модального окна
  useEffect(() => {
    if (isOpen) {
      if (role) {
        // Преобразуем права из базы данных в формат для формы
        let permissions = [];
        if (role.permissions) {
          if (Array.isArray(role.permissions)) {
            // Проверяем, это новый формат или старый
            if (role.permissions.length > 0 && typeof role.permissions[0] === 'object') {
              // Новый формат - уже готов
              permissions = role.permissions;
            } else {
              // Старый формат - преобразуем
              const oldPermissions = role.permissions;
              if (oldPermissions.includes('all')) {
                // Для роли с полными правами создаем все права
                permissions = permissionModules.map(module => ({
                  module: module.value,
                  actions: permissionActions.map(action => action.value)
                }));
              } else {
                // Сопоставление старых названий с новыми
                const oldToNewMapping = {
                  'users': 'employees',
                  'settings': 'system',
                  'read': 'read',
                  'edit': 'update',
                  'create': 'create',
                  'delete': 'delete',
                  'manage': 'manage'
                };
                
                const permissions = [];
                const actions = [];
                
                // Сначала разделяем модули и действия
                oldPermissions.forEach(oldPerm => {
                  const newModule = oldToNewMapping[oldPerm];
                  if (newModule && newModule !== oldPerm) {
                    // Это модуль
                    permissions.push({
                      module: newModule,
                      actions: ['read', 'update'] // Базовые права для старых ролей
                    });
                  } else if (['read', 'update', 'create', 'delete', 'manage'].includes(oldPerm)) {
                    // Это действие
                    actions.push(oldPerm);
                  }
                });
                
                // Если есть только действия без модулей, применяем их ко всем модулям
                if (actions.length > 0 && permissions.length === 0) {
                  const allModules = [
                    'employees', 'departments', 'skills', 'skillGroups', 
                    'products', 'vacations', 'roles', 'system', 'analytics', 'reports'
                  ];
                  
                  allModules.forEach(module => {
                    permissions.push({
                      module: module,
                      actions: [...actions]
                    });
                  });
                } else if (actions.length > 0) {
                  // Если есть и модули, и действия, добавляем действия ко всем модулям
                  permissions.forEach(perm => {
                    actions.forEach(action => {
                      if (!perm.actions.includes(action)) {
                        perm.actions.push(action);
                      }
                    });
                  });
                }
              }
            }
          } else if (typeof role.permissions === 'string') {
            try {
              const parsed = JSON.parse(role.permissions);
              // Если это массив строк (старый формат), преобразуем в новый
              if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
                if (parsed.includes('all')) {
                  // Для роли с полными правами создаем все права
                  permissions = permissionModules.map(module => ({
                    module: module.value,
                    actions: permissionActions.map(action => action.value)
                  }));
                } else {
                  // Сопоставление старых названий с новыми
                  const oldToNewMapping = {
                    'users': 'employees',
                    'settings': 'system',
                    'read': 'read',
                    'edit': 'update',
                    'create': 'create',
                    'delete': 'delete',
                    'manage': 'manage'
                  };
                  
                  const permissions = [];
                  const actions = [];
                  
                  // Сначала разделяем модули и действия
                  parsed.forEach(oldPerm => {
                    const newModule = oldToNewMapping[oldPerm];
                    if (newModule && newModule !== oldPerm) {
                      // Это модуль
                      permissions.push({
                        module: newModule,
                        actions: ['read', 'update'] // Базовые права для старых ролей
                      });
                    } else if (['read', 'update', 'create', 'delete', 'manage'].includes(oldPerm)) {
                      // Это действие
                      actions.push(oldPerm);
                    } else if (oldPerm === 'edit') {
                      // Специальная обработка для 'edit'
                      actions.push('update');
                    } else {
                      // Если это не модуль и не действие, добавляем как действие
                      actions.push(oldPerm);
                    }
                  });
                  
                  // Если есть только действия без модулей, применяем их ко всем модулям
                  if (actions.length > 0 && permissions.length === 0) {
                    const allModules = [
                      'employees', 'departments', 'skills', 'skillGroups', 
                      'products', 'vacations', 'roles', 'system', 'analytics', 'reports'
                    ];
                    
                    allModules.forEach(module => {
                      permissions.push({
                        module: module,
                        actions: [...actions]
                      });
                    });
                  } else if (actions.length > 0) {
                    // Если есть и модули, и действия, добавляем действия ко всем модулям
                    permissions.forEach(perm => {
                      actions.forEach(action => {
                        if (!perm.actions.includes(action)) {
                          perm.actions.push(action);
                        }
                      });
                    });
                  }
                }
              } else {
                permissions = parsed;
              }
            } catch (e) {
              console.error('Ошибка парсинга прав:', e);
              permissions = [];
            }
          }
        }

        const roleData = {
          name: role.name || '',
          description: role.description || '',
          color: role.color || '#3B82F6',
          icon: role.icon || 'shield',
          permissions: permissions,
          visible_sections: role.visible_sections || [],
          visible_views: role.visible_views || []
        };
        
        setFormData(roleData);
        setOriginalData(roleData);
        setChangedFields(new Set());
      } else {
        const emptyData = {
          name: '',
          description: '',
          color: '#3B82F6',
          icon: 'shield',
          permissions: [],
          visible_sections: [],
          visible_views: []
        };
        
        setFormData(emptyData);
        setOriginalData({});
        setChangedFields(new Set());
      }
    }
  }, [isOpen, role]);

  // Track field changes
  const trackFieldChange = (fieldName, value) => {
    const originalValue = originalData[fieldName];
    if (JSON.stringify(originalValue) !== JSON.stringify(value)) {
      setChangedFields(prev => new Set([...prev, fieldName]));
    } else {
      setChangedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('handleSubmit вызван');
    console.log('saving:', saving);
    console.log('role:', role);
    console.log('formData:', formData);
    
    if (saving) {
      console.log('Форма уже отправляется, выходим');
      return;
    }
    
    try {
      setSaving(true);
      console.log('Устанавливаем saving в true');
      
      console.log('Отправляем данные роли:', formData);
      
      // Проверяем, что permissions существует и является массивом
      if (!Array.isArray(safeFormData.permissions)) {
        console.error('permissions не является массивом:', safeFormData.permissions);
        throw new Error('Некорректная структура прав доступа');
      }
      
      // Преобразуем права в правильную структуру для бэкенда
      const { status, ...formDataWithoutStatus } = safeFormData;
      
      const submitData = { 
        ...formDataWithoutStatus,
        visible_views: Array.isArray(safeFormData.visible_views) ? safeFormData.visible_views : [],
        visible_sections: Array.isArray(safeFormData.visible_sections) ? safeFormData.visible_sections : [],
        permissions: safeFormData.permissions.map(perm => ({
          module: perm.module,
          actions: perm.actions
        }))
      };
      
      // Для системных ролей убираем поле status
      if (role?.is_system) {
        console.log('Убираем поле status для системной роли');
      }
      
      if (role?.id) {
        submitData.changedFields = Array.from(changedFields);
        console.log('Добавляем changedFields:', Array.from(changedFields));
      }
      
      // Для встроенных ролей добавляем флаг
      if (role?.is_system) {
        submitData.is_system = true;
      }
      
      console.log('Подготовленные данные для отправки:', submitData);
      console.log('Ключи в submitData:', Object.keys(submitData));
      console.log('Есть ли status в submitData:', 'status' in submitData);
      console.log('onSubmit функция:', onSubmit);
      
      // Проверяем, что onSubmit является функцией
      if (typeof onSubmit !== 'function') {
        console.error('onSubmit не является функцией:', onSubmit);
        throw new Error('Ошибка: onSubmit не является функцией');
      }
      
      const result = await onSubmit(submitData);
      console.log('Результат onSubmit:', result);
      
      // Показываем уведомление об успехе
      showNotification(
        role ? 'Роль успешно обновлена' : 'Роль успешно создана', 
        'success'
      );
      
      console.log('Уведомление показано, закрываем модальное окно');
      onClose();
      
    } catch (error) {
      console.error('Ошибка при отправке формы роли:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      showNotification(
        `Ошибка при ${role ? 'обновлении' : 'создании'} роли: ${errorMessage}`, 
        'error'
      );
      
      // Не закрываем модальное окно при ошибке
      // onClose();
    } finally {
      console.log('Устанавливаем saving в false');
      setSaving(false);
    }
  };

  const handlePermissionChange = (module, action, checked) => {
    setFormData(prev => {
      let newPermissions = [...prev.permissions];
      
      // Если это старый формат (массив строк), конвертируем в новый
      if (newPermissions.length > 0 && typeof newPermissions[0] === 'string') {
        // Конвертируем старый формат в новый
        newPermissions = [];
        if (prev.permissions.includes('all')) {
          // Для роли с полными правами создаем все права
          const permissionModules = [
            'employees', 'departments', 'skills', 'skillGroups', 
            'products', 'vacations', 'roles', 'system', 'analytics', 'reports'
          ];
          const permissionActions = [
            'create', 'read', 'update', 'delete', 'manage', 'export', 
            'import', 'approve', 'assign', 'configure', 'backup', 'restore'
          ];
          
          newPermissions = permissionModules.map(mod => ({
            module: mod,
            actions: [...permissionActions]
          }));
        } else {
          // Для других старых форматов создаем базовые права
          const permissionModules = [
            'employees', 'departments', 'skills', 'skillGroups', 
            'products', 'vacations', 'roles', 'system', 'analytics', 'reports'
          ];
          
          newPermissions = permissionModules.map(mod => ({
            module: mod,
            actions: ['read'] // Базовые права
          }));
        }
      }
      
      const existingPermission = newPermissions.find(p => p.module === module);
      
      if (existingPermission) {
        if (checked) {
          if (!existingPermission.actions.includes(action)) {
            existingPermission.actions.push(action);
          }
        } else {
          existingPermission.actions = existingPermission.actions.filter(a => a !== action);
          if (existingPermission.actions.length === 0) {
            newPermissions.splice(newPermissions.indexOf(existingPermission), 1);
          }
        }
      } else if (checked) {
        newPermissions.push({ module, actions: [action] });
      }
      
      const newData = { ...prev, permissions: newPermissions };
      trackFieldChange('permissions', newPermissions);
      return newData;
    });
  };

  const handleSectionVisibilityChange = (sectionId, checked) => {
    setFormData(prev => {
      const newSections = checked 
        ? [...prev.visible_sections, sectionId]
        : prev.visible_sections.filter(id => id !== sectionId);
      
      // При включении видимости страницы включаем все её представления
      // При отключении видимости страницы отключаем все её представления
      let newViews = { ...prev.visible_views };
      
      if (checked) {
        // Включаем все представления для этой страницы
        if (visibilityOptions.views[sectionId]) {
          newViews[sectionId] = visibilityOptions.views[sectionId].map(view => view.id);
        }
      } else {
        // Отключаем все представления для этой страницы
        delete newViews[sectionId];
      }
      
      const newData = { 
        ...prev, 
        visible_sections: newSections,
        visible_views: newViews
      };
      trackFieldChange('visible_sections', newSections);
      trackFieldChange('visible_views', newViews);
      return newData;
    });
  };

  const handleViewVisibilityChange = (sectionId, viewId, checked) => {
    setFormData(prev => {
      const newViews = { ...prev.visible_views };
      
      if (!newViews[sectionId]) {
        newViews[sectionId] = [];
      }
      
      if (checked) {
        if (!newViews[sectionId].includes(viewId)) {
          newViews[sectionId] = [...newViews[sectionId], viewId];
        }
      } else {
        newViews[sectionId] = newViews[sectionId].filter(id => id !== viewId);
      }
      
      const newData = { ...prev, visible_views: newViews };
      trackFieldChange('visible_views', newViews);
      return newData;
    });
  };

  const hasPermission = (module, action) => {
    // Проверяем, есть ли права в массиве permissions
    if (Array.isArray(safeFormData.permissions)) {
      // Если это старый формат (массив строк)
      if (safeFormData.permissions.length > 0 && typeof safeFormData.permissions[0] === 'string') {
        // Для старого формата проверяем наличие 'all' или конкретных прав
        if (safeFormData.permissions.includes('all')) return true;
        if (safeFormData.permissions.includes(action)) return true;
        return false;
      }
      
      // Новый формат (массив объектов)
      const permission = safeFormData.permissions.find(p => p.module === module);
      return permission && permission.actions && permission.actions.includes(action);
    }
    return false;
  };

  const isSectionVisible = (sectionId) => {
    if (Array.isArray(safeFormData.visible_sections)) {
      // Если это старый формат (массив строк)
      if (safeFormData.visible_sections.length > 0 && typeof safeFormData.visible_sections[0] === 'string') {
        if (safeFormData.visible_sections.includes('all')) return true;
        return safeFormData.visible_sections.includes(sectionId);
      }
      
      // Новый формат (массив строк)
      return safeFormData.visible_sections.includes(sectionId);
    }
    return false;
  };

  const isViewVisible = (sectionId, viewId) => {
    if (safeFormData.visible_views && typeof safeFormData.visible_views === 'object') {
      // Если это старый формат (массив строк)
      if (Array.isArray(safeFormData.visible_views) && safeFormData.visible_views.length > 0 && typeof safeFormData.visible_views[0] === 'string') {
        if (safeFormData.visible_views.includes('all')) return true;
        return safeFormData.visible_views.includes(viewId);
      }
      
      // Новый формат (объект с массивами)
      return safeFormData.visible_views[sectionId] && safeFormData.visible_views[sectionId].includes(viewId);
    }
    return false;
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'shield-check': return <Shield className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'user-check': return <UserCheck className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      case 'user-group': return <Users className="w-4 h-4" />;
      case 'briefcase': return <Key className="w-4 h-4" />;
      case 'archive': return <Archive className="w-4 h-4" />;
      case 'settings': return <Settings className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;
  
  // Гарантируем, что formData всегда существует
  const safeFormData = formData || {
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'shield',
    permissions: [],
    visible_sections: [],
    visible_views: []
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <div>
            <h3 className="text-lg font-semibold text-dark">
              {role ? 'Редактировать роль' : 'Добавить роль'}
            </h3>
            {role?.is_system && (
              <p className="text-sm text-gray-500 mt-1">
                {role.name === 'Главный администратор' 
                  ? 'Системная роль (ограниченное редактирование)' 
                  : 'Системная роль'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="role-form" className="space-y-6" onSubmit={handleSubmit}>
            {/* Основная информация */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название роли *
                </label>
                <input
                  type="text"
                  value={safeFormData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    trackFieldChange('name', e.target.value);
                  }}
                  disabled={role?.name === 'Главный администратор'}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
                {role?.name === 'Главный администратор' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Название роли "Главный администратор" нельзя изменить
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={safeFormData.description}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                    trackFieldChange('description', e.target.value);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цвет
                  </label>
                  <input
                    type="color"
                    value={safeFormData.color}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, color: e.target.value }));
                      trackFieldChange('color', e.target.value);
                    }}
                    className="w-full h-10 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Иконка
                  </label>
                  <Select
                    value={iconOptions.find(option => option.value === safeFormData.icon)}
                    onChange={(option) => {
                      setFormData(prev => ({ ...prev, icon: option.value }));
                      trackFieldChange('icon', option.value);
                    }}
                    options={iconOptions}
                    styles={customSelectStyles}
                    formatOptionLabel={(option) => (
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    )}
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                  />
                </div>
              </div>
            </div>

            {/* Видимость разделов и представлений */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Видимость разделов и представлений
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {visibilityOptions.sections.map(section => (
                  <div key={section.id} className="border border-gray/20 rounded-[8px] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={isSectionVisible(section.id)}
                            onChange={(e) => handleSectionVisibilityChange(section.id, e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>{section.label}</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Представления для раздела */}
                    {visibilityOptions.views[section.id] && (
                      <div className="ml-6 space-y-2">
                        {visibilityOptions.views[section.id].map(view => (
                          <label key={view.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isViewVisible(section.id, view.id)}
                              onChange={(e) => handleViewVisibilityChange(section.id, view.id, e.target.checked)}
                              disabled={!isSectionVisible(section.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                            />
                            <span className={!isSectionVisible(section.id) ? 'text-gray-400' : 'text-gray-600'}>
                              {view.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Права доступа */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Права доступа
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {permissionModules.map(module => (
                  <div key={module.value} className="border border-gray/20 rounded-[8px] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{module.label}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {permissionActions.map(action => (
                        <label key={action.value} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={hasPermission(module.value, action.value)}
                            onChange={(e) => handlePermissionChange(module.value, action.value, e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-xs text-gray-600">{action.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Фиксированные кнопки внизу - показываем только если hideButtons = false */}
        {!hideButtons && (
          <div className="p-6 border-t border-gray/20 bg-white">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                form="role-form"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохранение...' : (role ? 'Сохранить' : 'Создать')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 