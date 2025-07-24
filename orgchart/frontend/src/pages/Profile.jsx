import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import Button from '../components/ui/Button';
import AnalyticsBlock from '../components/ui/AnalyticsBlock';
import AnalyticsCard from '../components/ui/AnalyticsCard';
import Avatar from '../components/ui/Avatar';
import AppSettings from '../components/ui/AppSettings';
import PageHeader from '../components/ui/PageHeader';
import SkillsEditor from '../components/ui/SkillsEditor';
import VacationModal from '../components/VacationModal';
import Table, { TableBody, TableRow, ActionsCell } from '../components/ui/Table';
import { calculateTimeInTeam, formatDate, getPointsText } from '../utils/dateUtils';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../components/RoleProvider';
import { 
  User, 
  Calendar, 
  Settings, 
  Edit, 
  Save, 
  X, 
  Plus,
  Package,
  CheckCircle,
  Archive,
  Clock,
  Mail,
  Send,
  Phone,
  Gift,
  Trophy,
  Info,
  Trash2,
  Check
} from 'lucide-react';
import { showNotification } from '../utils/notifications';
import RatingWidget from '../components/RatingWidget';
import TokenCard, { TokenStack } from '../components/TokenCard';
import TokenViewModal from '../components/TokenViewModal';
import TokenStackModal from '../components/TokenStackModal';
import { useNavigate, useLocation } from 'react-router-dom';

const viewOptions = [
  { id: 'profile', label: 'Профиль', icon: <User className="w-4 h-4" /> },
  { id: 'vacations', label: 'Отпуска', icon: <Calendar className="w-4 h-4" /> },
  { id: 'rating', label: 'Рейтинг', icon: <Trophy className="w-4 h-4" /> },
  { id: 'settings', label: 'Настройки', icon: <Settings className="w-4 h-4" /> },
];

// Mock skills data for the form
const mockSkillsData = [
  { id: 1, name: 'JavaScript', type: 'hard' },
  { id: 2, name: 'React', type: 'hard' },
  { id: 3, name: 'TypeScript', type: 'hard' },
  { id: 4, name: 'Python', type: 'hard' },
  { id: 5, name: 'Коммуникация', type: 'soft' },
  { id: 6, name: 'Лидерство', type: 'soft' },
  { id: 7, name: 'Командная работа', type: 'soft' },
  { id: 8, name: 'Путешествия', type: 'hobby' },
  { id: 9, name: 'Спорт', type: 'hobby' },
  { id: 10, name: 'Музыка', type: 'hobby' },
];

export default function Profile() {
  const [activeView, setActiveView] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [profile, setProfile] = useState(null);
  const [employeeTokens, setEmployeeTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [vacations, setVacations] = useState([]);
  const [vacationsLoading, setVacationsLoading] = useState(false);
  const [addingVacation, setAddingVacation] = useState(false);
  const [vacationsSortBy, setVacationsSortBy] = useState('start_date');
  const [vacationsSortDirection, setVacationsSortDirection] = useState('desc');
  const { settings, updateSettings } = useSettings();
  const { userData, isAuthenticated } = useAuth();
  const { activeRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  // Состояние для создания нового отпуска
  const [isCreatingNewVacation, setIsCreatingNewVacation] = useState(false);
  const [newVacation, setNewVacation] = useState({
    vacation_type: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  
  // Состояние для инлайн редактирования
  const [editingVacations, setEditingVacations] = useState({});
  const [availableTokens, setAvailableTokens] = useState([]);
  const [receivedTokens, setReceivedTokens] = useState([]);
  const [showStackModal, setShowStackModal] = useState(false);
  const [stackTokens, setStackTokens] = useState([]);

  // Определяем активное представление из URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/account/profile')) {
      setActiveView('profile');
    } else if (path.includes('/account/vacations')) {
      setActiveView('vacations');
      loadVacations();
    } else if (path.includes('/account/rating')) {
      setActiveView('rating');
      // Загружаем токены при переходе на вкладку рейтинга
      loadEmployeeTokens();
    } else if (path.includes('/account/settings')) {
      setActiveView('settings');
    }
  }, [location.pathname]);
  // Определяем, есть ли кнопка администрирования
  const hasAdminMenu = (() => {
    const hasAdminRoles = userData?.adminRoles && userData.adminRoles.length > 0;
    const isAdminRoleActive = hasAdminRoles && activeRole && userData.adminRoles.some(role => role.id.toString() === activeRole);
    const activeRoleData = hasAdminRoles && activeRole ? userData.adminRoles.find(role => role.id.toString() === activeRole) : null;
    const hasAdminPermissions = activeRoleData && (
      activeRoleData.name === 'Главный администратор' ||
      (activeRoleData.permissions && activeRoleData.permissions.some(permission => {
        const adminModules = ['employees', 'departments', 'skills', 'skillGroups', 'products', 'vacations', 'roles', 'system'];
        return adminModules.includes(permission);
      }))
    );
    return hasAdminRoles && activeRole && isAdminRoleActive && hasAdminPermissions;
  })();

  // Загружаем данные пользователя
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userData) return;
      
      setLoading(true);
      setRefreshing(true);
      
      try {
        const response = await api.getMe();
        const employeeData = response.employee || response;
        
        // Преобразуем данные из API в формат профиля
        const profileData = {
          id: employeeData?.id,
          name: `${employeeData?.first_name || ''} ${employeeData?.last_name || ''}`,
          avatar: employeeData?.avatar,
          position: employeeData?.position,
          department: employeeData?.department?.name || 'Без отдела',
          department_id: employeeData?.department_id,
          roleInDept: employeeData?.department_role || '',
          email: employeeData?.email,
          phone: employeeData?.phone,
          telegram: employeeData?.telegram,
          birth: employeeData?.birth_date,
          birth_date: employeeData?.birth_date,
          wishlist: employeeData?.wishlist_url,
          wishlist_url: employeeData?.wishlist_url,
          joined: employeeData?.hire_date,
          hire_date: employeeData?.hire_date,
          competencies: employeeData?.competencies ? employeeData.competencies.split('\n') : [],
          hardSkills: employeeData?.hardSkills || [],
          softSkills: employeeData?.softSkills || [],
          hobbies: employeeData?.hobbies || [],
          vacations: employeeData?.vacations?.map(v => ({
            id: v.id,
            type: v.vacation_type,
            start_date: v.start_date,
            end_date: v.end_date
          })) || [],
          products: employeeData?.productParticipants?.map(pp => ({
            id: pp.product.id,
            name: pp.product.name,
            role: pp.role
          })) || [],
          news: [],
          is_lead: false // Определяется по роли
        };
        
        setProfile(profileData);
        
        // Загружаем отпуска пользователя
        try {
          setVacationsLoading(true);
          const vacationsResponse = await api.getVacations();
          setVacations(vacationsResponse.vacations || []);
        } catch (vacationError) {
          // Если не удалось загрузить отпуска, оставляем пустой массив
          setVacations([]);
        } finally {
          setVacationsLoading(false);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
        setRefreshing(false); // Сбрасываем индикатор обновления
      }
    };

    loadUserProfile();
  }, [userData]);

  const handleProfileUpdate = (field, value) => {
    
    // Валидация для телефона
    if (field === 'phone' && value) {
      // Убираем все символы кроме цифр и +
      const cleaned = value.replace(/[^\d+]/g, '');
      // Проверяем, что номер начинается с + и содержит минимум 10 цифр
      const digits = cleaned.replace(/\D/g, '');
      if (cleaned.startsWith('+') && digits.length >= 10) {
        setProfile(prev => ({ ...prev, [field]: cleaned }));
      } else if (cleaned === '') {
        setProfile(prev => ({ ...prev, [field]: '' }));
      }
      return;
    }
    
    // Валидация для телеграма
    if (field === 'telegram' && value) {
      // Убираем все символы кроме букв, цифр, подчеркиваний и @
      const cleaned = value.replace(/[^a-zA-Z0-9_@]/g, '');
      // Проверяем, что начинается с @ и содержит минимум 5 символов после @
      if (cleaned.startsWith('@') && cleaned.length >= 6) {
        setProfile(prev => ({ ...prev, [field]: cleaned }));
      } else if (cleaned === '') {
        setProfile(prev => ({ ...prev, [field]: '' }));
      }
      return;
    }
    
    setProfile(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  };

  const handleSaveProfile = () => {
    const saveProfile = async () => {
      setSaving(true);
      try {
        // Подготавливаем данные для отправки на сервер
        const profileData = {
          phone: profile.phone,
          telegram: profile.telegram,
          birth_date: profile.birth,
          wishlist_url: profile.wishlist,
          email: profile.email,
          avatar: profile.avatar, // Добавляем аватар
          hire_date: profile.joined, // Добавляем дату вступления в команду
          hardSkills: profile.hardSkills,
          softSkills: profile.softSkills,
          hobbies: profile.hobbies,
        };

        // Удаляем пустые поля
        Object.keys(profileData).forEach(key => {
          if (profileData[key] === null || profileData[key] === undefined || profileData[key] === '') {
            delete profileData[key];
          }
        });

        await api.updateProfile(profileData);
        setIsEditing(false);
        
        // Показываем уведомление об успешном сохранении
        showNotification('Профиль успешно сохранен!', 'success');
      } catch (error) {
        console.error('Profile update error:', error);
        let message = 'Ошибка при сохранении профиля. Попробуйте еще раз.';
        // Проверяем, не истёк ли токен авторизации
        if (error && error.status === 401) {
          message = 'Сессия истекла. Вы будете перенаправлены на страницу входа.';
          // Очищаем токен и перенаправляем на страницу входа
          localStorage.removeItem('token');
          window.location.href = '/auth';
          return;
        }
        if (error && error.status === 403) {
          message = 'Доступ запрещен. Вы будете перенаправлены на страницу входа.';
          // Очищаем токен и перенаправляем на страницу входа
          localStorage.removeItem('token');
          window.location.href = '/auth';
          return;
        }
        // Проверяем сетевые ошибки
        if (error && error.status === 0) {
          message = 'Сервер недоступен. Проверьте подключение к интернету.';
        }
        // Проверяем ошибки валидации (400 Bad Request)
        if (error && error.status === 400) {
          console.error('Validation error response:', error.response);
          if (error.response && error.response.data && error.response.data.errors) {
            const validationErrors = error.response.data.errors.map(err => err.msg).join(', ');
            message = `Ошибка валидации: ${validationErrors}`;
          } else if (error.response && error.response.data && error.response.data.message) {
            message = error.response.data.message;
          } else {
            message = 'Ошибка валидации данных. Проверьте правильность введенных данных.';
          }
        }
        showNotification(message, 'error');
      } finally {
        setSaving(false);
      }
    };
    
    saveProfile();
  };

  const handleAvatarChange = async (newAvatar) => {
    setProfile(prev => ({ ...prev, avatar: newAvatar }));
    try {
      await api.updateProfile({ avatar: newAvatar });
      
      // После успешного сохранения обновляем профиль из API
      const response = await api.getMe();
      const employee = response.employee;
      
      const employeeData = {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        avatar: employee.avatar,
        position: employee.position,
        department: employee.department?.name || 'Без отдела',
        department_id: employee.department_id,
        roleInDept: employee.department_role || '',
        email: employee.email,
        phone: employee.phone,
        telegram: employee.telegram,
        birth: employee.birth_date,
        birth_date: employee.birth_date,
        wishlist: employee.wishlist_url,
        wishlist_url: employee.wishlist_url,
        joined: employee.hire_date,
        hire_date: employee.hire_date,
        competencies: employee.competencies ? employee.competencies.split('\n') : [],
        hardSkills: employee.hardSkills || [],
        softSkills: employee.softSkills || [],
        hobbies: employee.hobbies || [],
        vacations: employee.vacations?.map(v => ({
          id: v.id,
          type: v.vacation_type,
          start_date: v.start_date,
          end_date: v.end_date
        })) || [],
        products: employee.productParticipants?.map(pp => ({
          id: pp.product.id,
          name: pp.product.name,
          role: pp.role
        })) || [],
        news: [],
        is_lead: false
      };
      setProfile(employeeData);
      
      // Отправляем событие об обновлении аватара
      window.dispatchEvent(new Event('avatar-updated'));
    } catch (error) {
      console.error('Error saving avatar:', error);
      showNotification('Ошибка при сохранении аватара. Попробуйте еще раз.', 'error');
    }
  };

  const handleAddVacation = () => {
    setShowVacationModal(true);
  };

  const handleVacationSubmit = async (vacationData) => {
    setAddingVacation(true);
    try {
      
      // Преобразуем данные для API
      const apiData = {
        vacation_type: vacationData.type,
        start_date: vacationData.startDate,
        end_date: vacationData.endDate,
        days_count: vacationData.daysCount,
        description: vacationData.description
      };
      
      const response = await api.createVacation(apiData);
      
      // Добавляем новый отпуск в список
      setVacations(prev => [...prev, response.vacation]);
      showNotification('Отпуск добавлен!', 'success');
      setShowVacationModal(false);
    } catch (error) {
      console.error('Error adding vacation:', error);
      showNotification('Ошибка при добавлении отпуска. Попробуйте еще раз.', 'error');
    } finally {
      setAddingVacation(false);
    }
  };

  const loadVacations = async () => {
    try {
      setVacationsLoading(true);
      const response = await api.getVacations();
      
      // Преобразуем данные в нужный формат
      const vacationsData = response.vacations || response || [];
      setVacations(vacationsData);
    } catch (error) {
      console.error('Error loading vacations:', error);
      showNotification('Ошибка при загрузке отпусков', 'error');
    } finally {
      setVacationsLoading(false);
    }
  };

  const handleVacationUpdate = (id, field, value) => {
    // Обновляем локальное состояние для инлайн редактирования
    setEditingVacations(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));

    // Обновляем в базе
    const updateVacation = async () => {
      try {
        const vacation = vacations.find(v => v.id === id);
        if (!vacation) return;

        // Создаем объект с обновленными данными
        const updatedData = { [field]: value };
        
        const response = await api.updateVacation(id, updatedData);
        setVacations(prev => prev.map(v => 
          v.id === id ? response.vacation : v
        ));
      } catch (error) {
        console.error('Error updating vacation:', error);
        showNotification('Ошибка при обновлении отпуска. Попробуйте еще раз.', 'error');
      }
    };

    updateVacation();
  };

  // Функция для создания нового отпуска
  const handleCreateNewVacation = async () => {
    if (!newVacation.vacation_type || !newVacation.start_date || !newVacation.end_date) {
      showNotification('Заполните обязательные поля', 'error');
      return;
    }

    try {
      setAddingVacation(true);
      
      // Вычисляем количество дней
      const startDate = new Date(newVacation.start_date);
      const endDate = new Date(newVacation.end_date);
      
      // Устанавливаем время в 00:00:00 для корректного расчета
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const apiData = {
        vacation_type: newVacation.vacation_type,
        start_date: newVacation.start_date,
        end_date: newVacation.end_date,
        days_count: diffDays,
        description: newVacation.description || null
      };

      const response = await api.createVacation(apiData);
      setVacations(prev => [...prev, response.vacation]);
      
      // Сбрасываем форму
      setNewVacation({
        vacation_type: '',
        start_date: '',
        end_date: '',
        description: ''
      });
      setIsCreatingNewVacation(false);
      
      showNotification('Отпуск добавлен!', 'success');
    } catch (error) {
      console.error('Error creating vacation:', error);
      showNotification('Ошибка при создании отпуска. Попробуйте еще раз.', 'error');
    } finally {
      setAddingVacation(false);
    }
  };

  // Функция для отмены создания нового отпуска
  const handleCancelNewVacation = () => {
    setNewVacation({
      vacation_type: '',
      start_date: '',
      end_date: '',
      description: ''
    });
    setIsCreatingNewVacation(false);
  };

  // Функция для начала редактирования описания
  const handleStartEditDescription = (vacationId, currentDescription) => {
    setEditingVacations(prev => ({
      ...prev,
      [vacationId]: {
        ...prev[vacationId],
        editingDescription: true,
        tempDescription: currentDescription || ''
      }
    }));
  };

  // Функция для сохранения описания
  const handleSaveDescription = async (vacationId) => {
    const editData = editingVacations[vacationId];
    if (!editData) return;

    try {
      await handleVacationUpdate(vacationId, 'description', editData.tempDescription);
      
      setEditingVacations(prev => ({
        ...prev,
        [vacationId]: {
          ...prev[vacationId],
          editingDescription: false
        }
      }));
      
      showNotification('Описание обновлено', 'success');
    } catch (error) {
      showNotification('Ошибка при сохранении описания', 'error');
    }
  };

  // Функция для отмены редактирования описания
  const handleCancelEditDescription = (vacationId) => {
    setEditingVacations(prev => ({
      ...prev,
      [vacationId]: {
        ...prev[vacationId],
        editingDescription: false,
        tempDescription: ''
      }
    }));
  };

  // Вычисление количества дней для нового отпуска
  const calculateDaysForNewVacation = () => {
    if (newVacation.start_date && newVacation.end_date) {
      const startDate = new Date(newVacation.start_date);
      const endDate = new Date(newVacation.end_date);
      
      // Устанавливаем время в 00:00:00 для корректного расчета
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };

  const handleVacationDelete = (id) => {
    const deleteVacation = async () => {
      try {
        await api.deleteVacation(id);
        setVacations(prev => prev.filter(v => v.id !== id));
        showNotification('Отпуск удален!', 'success');
      } catch (error) {
        console.error('Error deleting vacation:', error);
        showNotification('Ошибка при удалении отпуска. Попробуйте еще раз.', 'error');
      }
    };

    deleteVacation();
  };



  const getVacationStats = () => {
    const total = vacations.length;
    const used = vacations.reduce((sum, v) => sum + (v.days_count || v.days || 0), 0);
    
    return { total, used };
  };

  const sortVacations = (vacations) => {
    return [...vacations].sort((a, b) => {
      const aValue = a[vacationsSortBy];
      const bValue = b[vacationsSortBy];
      
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      let comparison = 0;
      if (vacationsSortBy === 'start_date' || vacationsSortBy === 'end_date') {
        comparison = new Date(aValue) - new Date(bValue);
      } else {
        comparison = aValue.toString().localeCompare(bValue.toString());
      }
      
      return vacationsSortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const stats = getVacationStats();

  const getRoleText = (role) => {
    if (!role || role === '') return '';
    switch (role) {
      case 'lead': return 'Лид';
      case 'deputy': return 'Зам';
      case 'product': return 'Продакт';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'lead': return 'bg-[#E42E0F] text-white';
      case 'deputy': return 'bg-red-100 text-red-800';
      case 'product': return 'bg-red-100 text-red-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  // StarBullet component for competencies
  function StarBullet() {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-[6px] min-w-[14px] rounded-[1px]">
        <polygon points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2" fill="#E42E0F" />
      </svg>
    );
  }

  const handleViewChange = (viewId) => {
    setActiveView(viewId);
    const routes = {
      profile: '/account/profile',
      vacations: '/account/vacations',
      rating: '/account/rating',
      settings: '/account/settings'
    };
    navigate(routes[viewId]);
  };

  // Загрузка токенов сотрудника
  const loadEmployeeTokens = async () => {
    if (!userData?.id) return;
    
    try {
      setTokensLoading(true);
      
      const response = await api.request(`/api/tokens/employee/${userData.id}`);
      
      // Используем новую структуру данных
      if (response.individualTokens) {
        setEmployeeTokens(response.individualTokens);
      } else {
        // Обратная совместимость со старой структурой
        setEmployeeTokens(response || []);
      }
      setAvailableTokens(response.available || []);
      setReceivedTokens(response.received || []);
    } catch (error) {
      console.error('Error loading employee tokens:', error);
      setAvailableTokens([]);
      setReceivedTokens([]);
    } finally {
      setTokensLoading(false);
    }
  };

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Показываем загрузку только если нет данных профиля */}
      {loading && !profile && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка профиля...</p>
          </div>
        </div>
      )}

      {/* Показываем основной контент если есть данные профиля */}
      {profile && (
        <>
          {/* Заголовок страницы */}
          <PageHeader 
            title="Личный кабинет"
          >
            <div className="flex items-center gap-4">
              {refreshing && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Обновление данных...</span>
                </div>
              )}
              <ViewSwitcher
                views={viewOptions}
                activeView={activeView}
                onViewChange={handleViewChange}
                useAdminBreakpoint={hasAdminMenu}
              />
            </div>
          </PageHeader>

      {/* Контент в зависимости от выбранного вида */}
      {activeView === 'profile' && (
        <div className="space-y-6">
          {/* Основная информация профиля */}
          <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
            {/* Заголовок с кнопкой редактирования */}
            <div className="px-6 py-8 border-b border-gray/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 pl-8">
                  <Avatar
                    src={profile?.avatar}
                    name={profile?.name}
                    size="lg"
                    clickable={isEditing}
                    onAvatarChange={handleAvatarChange}
                    disabled={!isEditing}
                    roleInDept={profile?.roleInDept}
                  />
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-600">{profile?.position}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{profile?.department}</span>
                      {profile?.roleInDept && profile.roleInDept !== '' && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(profile.roleInDept)}`}>
                            {getRoleText(profile.roleInDept)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isEditing ? 'danger' : 'primary'}
                    icon={isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  >
                    {isEditing ? 'Отменить' : 'Редактировать'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Содержимое профиля */}
            <div className="p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Левая колонка: Личная информация */}
                <div className="space-y-6">
                  {/* Личная информация */}
                  <div className="bg-gray/5 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Личная информация
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            День рождения
                          </label>
                          {isEditing ? (
                            <input
                              type="date"
                              value={profile?.birth}
                              onChange={(e) => handleProfileUpdate('birth', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{formatDate(profile?.birth) || 'Не указано'}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            В команде
                          </label>
                          {isEditing ? (
                            <input
                              type="date"
                              value={profile?.joined ? (() => {
                                const date = new Date(profile.joined);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                return `${year}-${month}-${day}`;
                              })() : ''}
                              onChange={(e) => handleProfileUpdate('joined', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.joined ? calculateTimeInTeam(profile.joined) : 'Не указано'}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Вишлист
                        </label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={profile?.wishlist}
                            onChange={(e) => handleProfileUpdate('wishlist', e.target.value)}
                            placeholder="https://wishlist.example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            {profile?.wishlist ? (
                              <a href={profile.wishlist} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 flex items-center gap-2">
                                <Gift className="w-4 h-4" />
                                Открыть вишлист
                              </a>
                            ) : (
                              <span className="text-gray-500 flex items-center gap-2">
                                <Gift className="w-4 h-4" />
                                Не указано
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Контактная информация */}
                  <div className="bg-gray/5 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      Контактная информация
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={profile?.email}
                            onChange={(e) => handleProfileUpdate('email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="email@example.com"
                          />
                        ) : (
                          <a href={`mailto:${profile?.email}`} className="text-primary hover:text-primary/80">
                            {profile?.email}
                          </a>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telegram
                        </label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={profile?.telegram}
                              onChange={(e) => handleProfileUpdate('telegram', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="@username"
                            />
                            <p className="text-xs text-gray-500 mt-1">Формат: @username (минимум 5 символов)</p>
                          </div>
                        ) : (
                          <a href={`https://t.me/${profile?.telegram?.replace('@','')}`} className="text-primary hover:text-primary/80">
                            {profile?.telegram || 'Не указано'}
                          </a>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Телефон
                        </label>
                        {isEditing ? (
                          <div>
                            <input
                              type="tel"
                              value={profile?.phone}
                              onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="+79991234567"
                            />
                            <p className="text-xs text-gray-500 mt-1">Формат: +79991234567 (только цифры и +)</p>
                          </div>
                        ) : (
                          <a href={`tel:${profile?.phone}`} className="text-primary hover:text-primary/80">
                            {profile?.phone || 'Не указано'}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ключевые компетенции */}
                  {profile?.competencies && profile.competencies.length > 0 && (
                    <div className="bg-gray/5 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        Ключевые компетенции
                      </h3>
                      <ul className="space-y-2">
                        {profile.competencies.map((comp, index) => (
                          <li key={index} className="flex items-start">
                            <span className="flex items-center justify-center mt-[3px]">
                              <StarBullet />
                            </span>
                            <span className="ml-2 text-gray-700">{comp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Правая колонка: Навыки */}
                <div className="space-y-6">
                  <div className="bg-gray/5 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Навыки и компетенции
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Хард навыки */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Хард навыки</h4>
                        <SkillsEditor
                          skills={profile?.hardSkills}
                          type="hard"
                          isEditing={isEditing}
                          onSkillsChange={(skills) => handleProfileUpdate('hardSkills', skills)}
                        />
                      </div>

                      {/* Софт навыки */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Софт навыки</h4>
                        <SkillsEditor
                          skills={profile?.softSkills}
                          type="soft"
                          isEditing={isEditing}
                          onSkillsChange={(skills) => handleProfileUpdate('softSkills', skills)}
                        />
                      </div>

                      {/* Хобби */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Хобби и интересы</h4>
                        <SkillsEditor
                          skills={profile?.hobbies}
                          type="hobby"
                          isEditing={isEditing}
                          onSkillsChange={(skills) => handleProfileUpdate('hobbies', skills)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Виджет рейтинга */}
                  {/* {profile?.id && (
                    <RatingWidget employeeId={profile.id} />
                  )} */}
                </div>
              </div>

              {/* Кнопки действий */}
              {isEditing && (
                <div className="mt-8 pt-6 border-t border-gray/20 flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Отменить
                  </Button>
                  <Button
                    variant="primary"
                    icon={saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="w-4 h-4" />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Сохраняется...' : 'Сохранить изменения'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeView === 'vacations' && (
        <div className="space-y-6">
          {/* Управление отпусками */}
          <div className="bg-white rounded-[15px] border border-gray/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Мои отпуска</h2>
              {!isCreatingNewVacation && (
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsCreatingNewVacation(true)}
                >
                  Добавить отпуск
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              {vacationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <span className="ml-2 text-gray-600">Загрузка отпусков...</span>
                </div>
              ) : (
                <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                            Тип
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                            Начало
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                            Конец
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                            Количество дней
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                            Описание
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray/20">
                        {/* Строка создания нового отпуска */}
                        {isCreatingNewVacation && (
                          <tr className="bg-blue-50/50 border-l-4 border-l-primary">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={newVacation.vacation_type}
                                onChange={(e) => setNewVacation(prev => ({ ...prev, vacation_type: e.target.value }))}
                                className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Выберите тип"
                              >
                                <option value="">Выберите тип</option>
                                <option value="Основной">Основной</option>
                                <option value="Больничный">Больничный</option>
                                <option value="Декретный">Декретный</option>
                                <option value="Учебный">Учебный</option>
                                <option value="Без содержания">Без содержания</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="date"
                                value={newVacation.start_date}
                                onChange={(e) => setNewVacation(prev => ({ ...prev, start_date: e.target.value }))}
                                className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Дата начала"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="date"
                                value={newVacation.end_date}
                                onChange={(e) => setNewVacation(prev => ({ ...prev, end_date: e.target.value }))}
                                className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Дата окончания"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-full px-2 py-1 bg-gray-50 border border-gray/20 rounded text-gray-600 text-center">
                                {calculateDaysForNewVacation() || '—'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={newVacation.description}
                                onChange={(e) => setNewVacation(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Описание (необязательно)"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {(newVacation.vacation_type && newVacation.start_date && newVacation.end_date) && (
                                  <button
                                    onClick={handleCreateNewVacation}
                                    disabled={addingVacation}
                                    className="text-green-600 hover:text-green-900 p-1 rounded transition-colors disabled:opacity-50"
                                    title="Сохранить отпуск"
                                  >
                                    {addingVacation ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={handleCancelNewVacation}
                                  className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                                  title="Отмена"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Существующие отпуска */}
                        {sortVacations(vacations).map((vacation, index) => {
                          const editData = editingVacations[vacation.id] || {};
                          const isEditingDesc = editData.editingDescription;
                          
                          return (
                            <tr key={vacation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={vacation.vacation_type || vacation.type}
                                  onChange={(e) => handleVacationUpdate(vacation.id, 'vacation_type', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <option value="Основной">Основной</option>
                                  <option value="Больничный">Больничный</option>
                                  <option value="Декретный">Декретный</option>
                                  <option value="Учебный">Учебный</option>
                                  <option value="Без содержания">Без содержания</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="date"
                                  value={vacation.start_date || vacation.start}
                                  onChange={(e) => handleVacationUpdate(vacation.id, 'start_date', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="date"
                                  value={vacation.end_date || vacation.end}
                                  onChange={(e) => handleVacationUpdate(vacation.id, 'end_date', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-full px-2 py-1 bg-gray-50 border border-gray/20 rounded text-gray-600 text-center">
                                  {vacation.days_count || vacation.days || 0}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {isEditingDesc ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editData.tempDescription || ''}
                                      onChange={(e) => setEditingVacations(prev => ({
                                        ...prev,
                                        [vacation.id]: {
                                          ...prev[vacation.id],
                                          tempDescription: e.target.value
                                        }
                                      }))}
                                      className="flex-1 px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                      placeholder="Описание отпуска"
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => handleStartEditDescription(vacation.id, vacation.description)}
                                    className="w-full px-2 py-1 border border-transparent rounded hover:border-gray/20 hover:bg-gray-50 cursor-pointer transition-colors min-h-[32px] flex items-center"
                                  >
                                    {vacation.description || <span className="text-gray-400">Нажмите для добавления описания</span>}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {isEditingDesc ? (
                                    <>
                                      <button
                                        onClick={() => handleSaveDescription(vacation.id)}
                                        className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                                        title="Сохранить описание"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleCancelEditDescription(vacation.id)}
                                        className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                                        title="Отмена"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleVacationDelete(vacation.id)}
                                      className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                      title="Удалить отпуск"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeView === 'rating' && (
        <div>
          {/* Текущий уровень */}
          <div className="bg-white rounded-lg p-6 border border-gray/20 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Мой рейтинг</h2>
              <span className="text-blue-600 flex items-center gap-2 text-lg font-medium">
                <Trophy className="w-5 h-5" />
                Новичок
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">Начинающий сотрудник</p>
            
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">Общий рейтинг</span>
              <span className="font-bold text-gray-900">{getPointsText(0)}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full" style={{width: '0%'}}></div>
            </div>
            
            <p className="text-sm text-gray-500">
              До следующего уровня: <span className="font-medium">50</span> {getPointsText(50).split(' ')[1]}
            </p>
          </div>

          {/* У меня есть токены */}
          <div className="bg-white rounded-lg p-6 border border-gray/20 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">У меня есть токены</h2>
            
            <div className="w-full min-h-[200px] pt-4">
              {tokensLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Загрузка токенов...</p>
                </div>
              ) : availableTokens.length > 0 ? (
                <div className="w-full">
                  {/* Группируем токены по типам */}
                  {(() => {
                    const tokensByType = {};
                    
                    availableTokens.forEach(token => {
                      // Fallback: если нет tokenType, используем name/points из самого токена
                      const type = token.tokenType?.name || token.name || 'Неизвестный';
                      
                      if (!tokensByType[type]) {
                        tokensByType[type] = [];
                      }
                      tokensByType[type].push(token);
                    });

                    return (
                      <div className="flex flex-wrap gap-8 justify-start">
                        {Object.entries(tokensByType).map(([type, tokens]) => {
                          // Fallback для value
                          const value = tokens[0]?.tokenType?.value || tokens[0]?.points || tokens[0]?.value || 1;
                          return (
                            <div key={type} className="flex flex-col items-center">
                              <h3 className="text-lg font-medium text-gray-700 capitalize mb-4 text-center">
                                {type}, {value} очков ({tokens.length})
                              </h3>
                              <TokenStack 
                                tokens={tokens}
                                onTokenClick={(clickedToken, stackIndex) => {
                                  setSelectedToken(clickedToken);
                                  setShowTokenModal(true);
                                }}
                                maxVisible={5}
                                onShowAll={(stack) => {
                                  setStackTokens(stack);
                                  setShowStackModal(true);
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Пока нет доступных токенов</p>
                </div>
              )}
            </div>
          </div>

          {/* Я получил токены */}
          <div className="bg-white rounded-lg p-6 border border-gray/20 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Я получил токены</h2>
            
            <div>
              <div className="w-full min-h-[200px] pt-4">
                {tokensLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Загрузка токенов...</p>
                  </div>
                ) : receivedTokens.length > 0 ? (
                  <div className="w-full">
                    {/* Группировка и отображение receivedTokens */}
                    {(() => {
                      const tokensByType = {};
                      receivedTokens.forEach(token => {
                        const type = token.tokenType?.name || token.name || 'Неизвестный';
                        if (!tokensByType[type]) tokensByType[type] = [];
                        tokensByType[type].push(token);
                      });
                      return (
                        <div className="flex flex-wrap gap-8 justify-start">
                          {Object.entries(tokensByType).map(([type, tokens]) => {
                            const value = tokens[0]?.tokenType?.value || tokens[0]?.points || tokens[0]?.value || 1;
                            return (
                              <div key={type} className="flex flex-col items-center">
                                <h3 className="text-xl font-bold text-primary mb-2 text-center">
                                  {type}, {getPointsText(value)} <span className="text-gray-500">({tokens.length})</span>
                                </h3>
                                <TokenStack 
                                  tokens={tokens}
                                  onTokenClick={(clickedToken, stackIndex) => {
                                    setSelectedToken(clickedToken);
                                    setShowTokenModal(true);
                                  }}
                                  maxVisible={5}
                                  onShowAll={(stack) => {
                                    setStackTokens(stack);
                                    setShowStackModal(true);
                                  }}
                                  extraClassName="bg-gray hover:bg-secondary/80"
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Пока нет полученных токенов</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Информация о системе */}
          <div className="bg-white rounded-lg p-6 border border-gray/20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              О системе рейтинга
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700">
            <div>
                <h3 className="font-medium text-gray-900 mb-2">Как работает система</h3>
                <p>Токены можно дарить коллегам за помощь, достижения и вдохновение. Каждый тип токена имеет свою ценность в очках рейтинга.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Конвертация токенов</h3>
                <ul className="space-y-1">
                  <li>• 10 белых = 1 желтый</li>
                  <li>• 10 желтых = 1 красный</li>
                  <li>• Серые токены нельзя конвертировать, только получить от лидов и топов</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Бумажные эквиваленты</h3>
                <p>Токены могут иметь бумажные эквиваленты, которые можно получить в офисе для физического обмена с коллегами.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Пополнение токенов</h3>
                <p>Обычные токены пополняются по графику, Разовые коллекции и тиражи - однократно и внепланово.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Полученные токены</h3>
                <p>Полученные токены остаются в вашей коллекции навсегда.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'settings' && (
        <div className="space-y-6">
          <AppSettings
            settings={settings}
            onSettingsChange={updateSettings}
          />
        </div>
      )}

      {/* Модальное окно для просмотра токена */}
      <TokenViewModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        token={selectedToken}
        onTokenUpdate={(updatedToken) => {
          if (updatedToken === null) {
            // Токен был отправлен (удален), убираем его из списка
            setEmployeeTokens(prev => prev.filter(token => token.id !== selectedToken.id));
            setShowTokenModal(false);
            setSelectedToken(null);
          } else {
            // Токен был обновлен
            setEmployeeTokens(prev => prev.map(token => 
              token.id === updatedToken.id ? updatedToken : token
            ));
            setSelectedToken(updatedToken);
          }
        }}
      />

      {/* Модальное окно для создания отпуска */}
      <VacationModal
        isOpen={showVacationModal}
        onClose={() => setShowVacationModal(false)}
        onSubmit={handleVacationSubmit}
        hideEmployeeSelect={true}
        currentEmployee={userData}
      />
        </>
      )}
      {showStackModal && (
        <TokenStackModal
          isOpen={showStackModal}
          tokens={stackTokens}
          onClose={() => setShowStackModal(false)}
        />
      )}
    </div>
  );
}