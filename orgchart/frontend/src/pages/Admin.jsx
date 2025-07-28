import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Package, Award, Calendar, Settings, 
  UserPlus, Building, FileText, BarChart3, Shield,
  ArrowRight, Lock, UserCheck, Bell, MessageSquare, Cog, Activity, Trophy
} from 'lucide-react';
import EmployeeModal from '../components/EmployeeModal';
import SkillModal from '../components/SkillModal';
import SkillGroupModal from '../components/SkillGroupModal';
import ProductModal from '../components/ProductModal';
import DepartmentModal from '../components/DepartmentModal';
import ProductCategoryModal from '../components/ProductCategoryModal';
import VacationTypeModal from '../components/VacationTypeModal';
import VacationModal from '../components/VacationModal';
import ErrorPagesPreview from '../components/ErrorPagesPreview';
import { ErrorBlock } from '../components/ui';
import { showNotification } from '../utils/notifications';
import apiService from '../services/api.js';
import { useRole } from '../components/RoleProvider';
import api from '../services/api';

// Удаляем моковые данные - теперь используем реальные API



export default function Admin() {
  // Статус сервиса уведомлений
  const [notificationServiceStatus, setNotificationServiceStatus] = useState('unknown');
  // Статус сервиса распределения токенов
  const [tokenDistributionServiceStatus, setTokenDistributionServiceStatus] = useState('unknown');
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await api.getNotificationServiceStatus();
        const status = res?.data?.serviceStatus || res?.serviceStatus || 'unknown';
        if (isMounted) setNotificationServiceStatus(status);
      } catch {
        if (isMounted) setNotificationServiceStatus('unknown');
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);
  useEffect(() => {
    let isMounted = true;
    const fetchTokenStatus = async () => {
      try {
        const res = await api.getTokenDistributionServiceStatus();
        const status = res?.data?.serviceStatus || res?.serviceStatus || 'unknown';
        if (isMounted) setTokenDistributionServiceStatus(status);
      } catch {
        if (isMounted) setTokenDistributionServiceStatus('unknown');
      }
    };
    fetchTokenStatus();
    const interval = setInterval(fetchTokenStatus, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isSkillGroupModalOpen, setIsSkillGroupModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isVacationTypeModalOpen, setIsVacationTypeModalOpen] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editingSkillGroup, setEditingSkillGroup] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [categories, setCategories] = useState([]);



  const [loading, setLoading] = useState(false);

  // Загрузка категорий продуктов
  const loadCategories = useCallback(async () => {
    try {
      const response = await api.getProductCategories();
      const categoriesData = response?.data || response || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  }, []);



  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);



  const adminSections = [
    {
      title: 'Управление персоналом',
      icon: <Users className="w-6 h-6" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      items: [
        { label: 'Сотрудники', to: '/admin/employees', icon: <UserPlus className="w-4 h-4" /> },
        { label: 'Отделы', to: '/admin/departments', icon: <Building className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Управление компетенциями',
      icon: <Award className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      items: [
        { label: 'Навыки', to: '/admin/skills', icon: <FileText className="w-4 h-4" /> },
        { label: 'Группы навыков', to: '/admin/skill-groups', icon: <BarChart3 className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Управление продуктами',
      icon: <Package className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      items: [
        { label: 'Продукты', to: '/admin/products', icon: <Package className="w-4 h-4" /> },
        { label: 'Категории', action: 'categories', icon: <FileText className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Управление отпусками',
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      items: [
        { label: 'Отпуска', to: '/admin/vacations', icon: <Calendar className="w-4 h-4" /> },
        { label: 'Типы отпусков', action: 'vacationTypes', icon: <Calendar className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Управление доступом',
      icon: <Lock className="w-6 h-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      items: [
        { label: 'Роли и права', to: '/admin/roles', icon: <Shield className="w-4 h-4" /> },
        { label: 'Назначение ролей', to: '/admin/user-roles', icon: <UserCheck className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Управление информированием',
      icon: <Bell className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      items: [
        { label: 'Управление уведомлениями', to: '/admin/notifications', icon: <Bell className="w-4 h-4" /> },
        { label: 'Шаблоны уведомлений', to: '/admin/templates', icon: <MessageSquare className="w-4 h-4" /> },
        { label: 'Управление получателями', to: '/admin/notification-settings', icon: <Cog className="w-4 h-4" /> },
        {
          label: (
            <span className="flex items-center gap-2">
              Сервис уведомлений
              <span
                className={
                  'inline-block w-2 h-2 rounded-full ' +
                  (notificationServiceStatus === 'running'
                    ? 'bg-green-500'
                    : notificationServiceStatus === 'stopped'
                    ? 'bg-red-500'
                    : 'bg-yellow-400 animate-pulse')
                }
                title={
                  notificationServiceStatus === 'running'
                    ? 'Сервис работает'
                    : notificationServiceStatus === 'stopped'
                    ? 'Сервис остановлен'
                    : 'Статус неизвестен'
                }
              />
            </span>
          ),
          to: '/admin/notification-service',
          icon: <Activity className="w-4 h-4" />
        },
      ]
    },
    {
      title: 'Управление токенами',
      icon: <Trophy className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10',
      items: [
        { label: 'Управление токенами', to: '/admin/rating-settings', icon: <Cog className="w-4 h-4" /> },
        { label: 'Управление бейджами', to: '/admin/achievements', icon: <Award className="w-4 h-4" /> },
        { label: 'Настройки рассылки', to: '/admin/distribution-settings', icon: <Settings className="w-4 h-4" /> },
        {
          label: (
            <span className="flex items-center gap-2">
              Сервис рассылки токенов
              <span
                className={
                  'inline-block w-2 h-2 rounded-full ' +
                  (tokenDistributionServiceStatus === 'running'
                    ? 'bg-green-500'
                    : tokenDistributionServiceStatus === 'stopped'
                    ? 'bg-red-500'
                    : 'bg-yellow-400 animate-pulse')
                }
                title={
                  tokenDistributionServiceStatus === 'running'
                    ? 'Сервис распределения токенов работает'
                    : tokenDistributionServiceStatus === 'stopped'
                    ? 'Сервис распределения токенов остановлен'
                    : 'Статус неизвестен'
                }
              />
            </span>
          ),
          to: '/admin/token-distribution-service',
          icon: <Activity className="w-4 h-4" />
        },
      ]
    },
  ];

  const quickActions = [
    {
      title: 'Добавить сотрудника',
      icon: <UserPlus className="w-5 h-5" />,
      action: 'employee',
      color: 'bg-primary/10 text-primary hover:bg-primary/20',
      description: 'Создать нового сотрудника в системе'
    },
    {
      title: 'Создать отдел',
      icon: <Building className="w-5 h-5" />,
      action: 'department',
      color: 'bg-primary/10 text-primary hover:bg-primary/20',
      description: 'Создать новый отдел'
    },
    {
      title: 'Создать навык',
      icon: <Award className="w-5 h-5" />,
      action: 'skill',
      color: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
      description: 'Добавить новый навык или компетенцию'
    },
    {
      title: 'Создать группу навыков',
      icon: <BarChart3 className="w-5 h-5" />,
      action: 'skillGroup',
      color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
      description: 'Создать новую группу навыков'
    },
    {
      title: 'Создать продукт',
      icon: <Package className="w-5 h-5" />,
      action: 'product',
      color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
      description: 'Добавить новый продукт'
    },
    {
      title: 'Создать отпуск',
      icon: <Calendar className="w-5 h-5" />,
      action: 'vacation',
      color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
      description: 'Добавить новый отпуск'
    },
    {
      title: 'Настройки системы',
      icon: <Settings className="w-5 h-5" />,
      to: '/admin/settings',
      color: 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20',
      description: 'Общие настройки системы'
    },
  ];

  const recentActivity = [
    { action: 'Добавлен новый сотрудник', user: 'Иван Петров', time: '2 минуты назад', type: 'success' },
    { action: 'Обновлен навык "React"', user: 'Мария Сидорова', time: '15 минут назад', type: 'info' },
    { action: 'Удален продукт "Старая версия"', user: 'Алексей Козлов', time: '1 час назад', type: 'warning' },
    { action: 'Создан новый отдел', user: 'Елена Волкова', time: '3 часа назад', type: 'success' },
  ];

  const handleQuickAction = (action) => {
    switch (action) {
      case 'employee':
        setEditingEmployee(null);
        setIsEmployeeModalOpen(true);
        break;
      case 'skill':
        setEditingSkill(null);
        setIsSkillModalOpen(true);
        break;
      case 'skillGroup':
        setEditingSkillGroup(null);
        setIsSkillGroupModalOpen(true);
        break;
      case 'product':
        setEditingProduct(null);
        setIsProductModalOpen(true);
        break;
      case 'department':
        setEditingDepartment(null);
        setIsDepartmentModalOpen(true);
        break;
      case 'categories':
        setEditingCategory(null);
        setIsCategoryModalOpen(true);
        break;
      case 'vacationTypes':
        setIsVacationTypeModalOpen(true);
        break;
      case 'vacation':
        setIsVacationModalOpen(true);
        break;
    }
  };

  const handleEmployeeSubmit = async (employeeData) => {
    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, employeeData);
      } else {
        await api.createEmployee(employeeData);
      }
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);

    } catch (error) {
      console.error('Error saving employee:', error);
      showNotification('Ошибка при сохранении сотрудника', 'error');
    }
  };

  const handleSkillSubmit = async (skillData) => {
    try {
      if (editingSkill) {
        await api.updateSkill(editingSkill.id, skillData);
        showNotification('Навык обновлен', 'success');
      } else {
        await api.createSkill(skillData);
        showNotification('Навык создан', 'success');
      }
      setIsSkillModalOpen(false);
      setEditingSkill(null);
    } catch (error) {
      console.error('Error saving skill:', error);
      showNotification('Ошибка при сохранении навыка', 'error');
    }
  };

  const handleSkillGroupSubmit = async (skillGroupData) => {
    try {
      if (editingSkillGroup) {
        await api.updateSkillGroup(editingSkillGroup.id, skillGroupData);
        showNotification('Группа навыков обновлена', 'success');
      } else {
        await api.createSkillGroup(skillGroupData);
        showNotification('Группа навыков создана', 'success');
      }
      setIsSkillGroupModalOpen(false);
      setEditingSkillGroup(null);
    } catch (error) {
      console.error('Error saving skill group:', error);
      showNotification('Ошибка при сохранении группы навыков', 'error');
    }
  };

  const handleProductSubmit = async (productData) => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
        showNotification('Продукт обновлен', 'success');
      } else {
        await api.createProduct(productData);
        showNotification('Продукт создан', 'success');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('Ошибка при сохранении продукта', 'error');
    }
  };

  const handleDepartmentSubmit = async (departmentData) => {
    try {
      if (editingDepartment) {
        await api.updateDepartment(editingDepartment.id, departmentData);
        showNotification('Отдел обновлен', 'success');
      } else {
        await api.createDepartment(departmentData);
        showNotification('Отдел создан', 'success');
      }
      setIsDepartmentModalOpen(false);
      setEditingDepartment(null);
    } catch (error) {
      console.error('Error saving department:', error);
      showNotification('Ошибка при сохранении отдела', 'error');
    }
  };

  const handleCategorySubmit = async (categoryData) => {
    try {
      if (editingCategory) {
        await api.updateProductCategory(editingCategory.id, categoryData);
        showNotification('Категория обновлена', 'success');
      } else {
        await api.createProductCategory(categoryData);
        showNotification('Категория создана', 'success');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showNotification('Ошибка при сохранении категории', 'error');
    }
  };

  const handleCategoryArchive = async (categoryId) => {
    try {
      await api.updateProductCategory(categoryId, { status: 'archived' });
      showNotification('Категория архивирована', 'success');
      loadCategories();
    } catch (error) {
      console.error('Error archiving category:', error);
      showNotification('Ошибка при архивировании категории', 'error');
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      try {
        await api.deleteProductCategory(categoryId);
        showNotification('Категория удалена', 'success');
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Ошибка при удалении категории', 'error');
      }
    }
  };

  const handleVacationTypeSubmit = (updatedVacationTypes) => {
    setIsVacationTypeModalOpen(false);
  };

  const handleVacationSubmit = (vacationData) => {
    setIsVacationModalOpen(false);
  };

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold font-accent text-primary mb-2 pb-4 md:pb-0">Администрирование</h1>
      </div>



      {/* Административные разделы */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {adminSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-[15px] border border-gray/50 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-[8px] ${section.bgColor} ${section.color}`}>
                {section.icon}
              </div>
              <h3 className="text-lg font-semibold text-dark">{section.title}</h3>
            </div>
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                item.action ? (
                  <button
                    key={itemIndex}
                    onClick={() => handleQuickAction(item.action)}
                    className="flex items-center justify-between p-3 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors group w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-500">
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </button>
                ) : (
                  <Link
                    key={itemIndex}
                    to={item.to}
                    className="flex items-center justify-between p-3 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-500">
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </Link>
                )
              ))}
            </div>
          </div>
        ))}
        
        {/* Блок страниц ошибок */}
        <ErrorPagesPreview />
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Быстрые действия */}
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              action.to ? (
                <Link
                  key={index}
                  to={action.to}
                  className={`flex items-center gap-3 p-4 rounded-[8px] transition-colors ${action.color}`}
                >
                  {action.icon}
                  <div>
                    <span className="font-medium block">{action.title}</span>
                    <span className="text-xs opacity-75">{action.description}</span>
                  </div>
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  className={`flex items-center gap-3 p-4 rounded-[8px] transition-colors ${action.color} w-full text-left`}
                >
                  {action.icon}
                  <div>
                    <span className="font-medium block">{action.title}</span>
                    <span className="text-xs opacity-75">{action.description}</span>
                  </div>
                </button>
              )
            ))}
          </div>
        </div>

        {/* Последние действия */}
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">Последние действия</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-gray/5 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                  <div className="text-xs text-gray-500">{activity.user} • {activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSubmit={handleEmployeeSubmit}
        existingEmployees={[]}
      />
      
      <SkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        onSubmit={handleSkillSubmit}
        existingSkills={[]}
      />
      
      <SkillGroupModal
        isOpen={isSkillGroupModalOpen}
        onClose={() => setIsSkillGroupModalOpen(false)}
        onSubmit={handleSkillGroupSubmit}
        existingGroups={[]}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        existingProducts={[]}
      />

      <DepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        onSubmit={handleDepartmentSubmit}
        existingDepartments={[]}
      />

      <ProductCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
        categories={categories}
        onArchive={handleCategoryArchive}
        onDelete={handleCategoryDelete}
      />

      <VacationTypeModal
        isOpen={isVacationTypeModalOpen}
        onClose={() => setIsVacationTypeModalOpen(false)}
        onSubmit={handleVacationTypeSubmit}
        vacationTypes={[
          { id: 1, name: 'Ежегодный отпуск', status: 'active' },
          { id: 2, name: 'Больничный', status: 'active' },
          { id: 3, name: 'Декретный отпуск', status: 'active' },
          { id: 4, name: 'Учебный отпуск', status: 'active' },
        ]}
      />

      <VacationModal
        isOpen={isVacationModalOpen}
        onClose={() => setIsVacationModalOpen(false)}
        onSubmit={handleVacationSubmit}
        editingVacation={null}
        existingVacations={[]}
      />
    </div>
  );
} 