import React, { useState, useEffect, useMemo } from 'react';
import {
  Columns2, ListFilter, Users, Calendar, Shield, Package, Award, User, Search, Trash2, SortAsc, SortDesc, Cake, Plane, Clock, HandMetal, Heart, Gift, Archive, Building, ArrowLeft, Building2, Snowflake, Flower2, Sun, Leaf, Star, Crown, UserCheck, Baby, GraduationCap, FileText, Trophy, ChevronDown, Edit
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import Select from 'react-select';
import Avatar from '../components/ui/Avatar';
import EmployeeCard from '../components/EmployeeCard';
import EmployeeModal from '../components/EmployeeModal';
import { calculateTimeInTeam, formatDate, getPointsText } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../components/RoleProvider';

const sortSwitcher = [
  { id: 'departments', label: 'Отделы', icon: <Columns2 className="w-5 h-5" /> },
  { id: 'alphabet', label: 'Алфавит', icon: <ListFilter className="w-5 h-5" /> },
  { id: 'birthdays', label: 'Дни Рождения', icon: <Cake className="w-5 h-5" /> },
  { id: 'vacations', label: 'Отпуска', icon: <Plane className="w-5 h-5" /> },
  { id: 'joined', label: 'Команда А', icon: <Users className="w-5 h-5" /> },
  { id: 'rating', label: 'Рейтинг', icon: <Trophy className="w-5 h-5" /> }
];

const statusSwitcher = [
  { id: 'active', label: 'Активные', icon: <User className="w-4 h-4" /> },
  { id: 'archived', label: 'Архив', icon: <Trash2 className="w-4 h-4" /> },
];

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
    zIndex: 20,
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

function normalizeCompetencies(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    if (raw.includes('\n')) {
      return raw.split('\n').map(c => c.trim()).filter(Boolean);
    }
    if (raw.includes(',')) {
      return raw.split(',').map(c => c.trim()).filter(Boolean);
    }
    return [raw.trim()];
  }
  return [];
}

function getRoleText(role) {
  switch (role) {
    case 'lead': return 'Лид';
    case 'deputy': return 'Зам';
    case 'product': return 'Продакт';
    default: return role || '';
  }
}

// Функция для рендеринга иконки отдела
function getDepartmentIcon(iconName) {
  const iconMap = {
    // Основные иконки
    'building': <Building className="w-6 h-6 text-gray-400" />,
    'building2': <Building2 className="w-6 h-6 text-gray-400" />,
    'users': <Users className="w-6 h-6 text-gray-400" />,
    'user': <User className="w-6 h-6 text-gray-400" />,
    'user-check': <UserCheck className="w-6 h-6 text-gray-400" />,
    'award': <Award className="w-6 h-6 text-gray-400" />,
    'package': <Package className="w-6 h-6 text-gray-400" />,
    'calendar': <Calendar className="w-6 h-6 text-gray-400" />,
    'clock': <Clock className="w-6 h-6 text-gray-400" />,
    'file-text': <FileText className="w-6 h-6 text-gray-400" />,
    'graduation-cap': <GraduationCap className="w-6 h-6 text-gray-400" />,
    'baby': <Baby className="w-6 h-6 text-gray-400" />,
    'crown': <Crown className="w-6 h-6 text-gray-400" />,
    'star-bullet': <Star className="w-6 h-6 text-gray-400" />,
    'snowflake': <Snowflake className="w-6 h-6 text-gray-400" />,
    'flower2': <Flower2 className="w-6 h-6 text-gray-400" />,
    'sun-icon': <Sun className="w-6 h-6 text-gray-400" />,
    'leaf-icon': <Leaf className="w-6 h-6 text-gray-400" />,
    'star-icon': <Star className="w-6 h-6 text-gray-400" />,
    'hand-metal': <HandMetal className="w-6 h-6 text-gray-400" />,
    'heart-icon': <Heart className="w-6 h-6 text-gray-400" />,
    'gift-icon': <Gift className="w-6 h-6 text-gray-400" />,
    'archive': <Archive className="w-6 h-6 text-gray-400" />,
    'shield-icon': <Shield className="w-6 h-6 text-gray-400" />,
    'columns2': <Columns2 className="w-6 h-6 text-gray-400" />,
    'trophy': <Trophy className="w-6 h-6 text-gray-400" />
  };
  
  return iconMap[iconName] || <Building className="w-6 h-6 text-gray-400" />;
}

export default function Structure() {
  const navigate = useNavigate();
  const { view: urlView } = useParams();
  const location = useLocation();
  const { hasAdminMenu } = useRole();
  
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingData, setRatingData] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Функция для обработки редактирования сотрудника
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  // Функция для закрытия модального окна
  const handleCloseEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  // Функция для обработки сохранения сотрудника
  const handleSaveEmployee = async (employeeData) => {
    try {
      if (editingEmployee) {
        // Создаем объект только с измененными полями
        const updateData = {};
        
        // Проверяем каждое поле на изменения
        if (employeeData.changedFields?.has('firstName')) {
          updateData.first_name = employeeData.firstName;
        }
        if (employeeData.changedFields?.has('lastName')) {
          updateData.last_name = employeeData.lastName;
        }
        if (employeeData.changedFields?.has('email')) {
          updateData.email = employeeData.email;
        }
        if (employeeData.changedFields?.has('phone')) {
          updateData.phone = employeeData.phone;
        }
        if (employeeData.changedFields?.has('telegram')) {
          updateData.telegram = employeeData.telegram;
        }
        if (employeeData.changedFields?.has('hireDate')) {
          updateData.hire_date = employeeData.hireDate;
        }
        if (employeeData.changedFields?.has('birthDate')) {
          updateData.birth_date = employeeData.birthDate;
        }
        if (employeeData.changedFields?.has('department')) {
          updateData.department_id = employeeData.department;
        }
        if (employeeData.changedFields?.has('role')) {
          updateData.department_role = employeeData.role;
        }
        if (employeeData.changedFields?.has('competencies')) {
          updateData.competencies = employeeData.competencies;
        }
        if (employeeData.changedFields?.has('notes')) {
          updateData.notes = employeeData.notes;
        }
        
        // Обновляем только если есть изменения в основных полях
        if (Object.keys(updateData).length > 0) {
          console.log('Обновляем поля сотрудника:', updateData);
          await api.updateEmployee(editingEmployee.id, updateData);
        } else {
          console.log('Основные поля не изменились, пропускаем обновление');
        }

        // Сохраняем навыки только если они изменились
        if (employeeData.skills && employeeData.skillsChanged) {
          console.log('Навыки изменились, обновляем...');
          
          // Получаем текущие навыки сотрудника
          const existingSkills = editingEmployee.employeeSkills || [];
          const existingSkillIds = new Set(existingSkills.map(es => es.skill.id));
          
          // Получаем новые навыки
          const allSkills = [
            ...employeeData.skills.hardSkills,
            ...employeeData.skills.softSkills,
            ...employeeData.skills.hobbies
          ];
          
          // Фильтруем только валидные навыки
          const validSkills = allSkills.filter(skill => skill && skill.value && skill.value !== '' && skill.value !== null && skill.value !== undefined);
          const newSkillIds = new Set(validSkills.map(skill => skill.value));
          
          // Удаляем навыки, которых больше нет
          for (const existingSkill of existingSkills) {
            if (!newSkillIds.has(existingSkill.skill.id)) {
              try {
                await api.removeEmployeeSkill(editingEmployee.id, existingSkill.skill.id);
                console.log('Удален навык:', existingSkill.skill.name);
              } catch (err) {
                console.error('Ошибка при удалении навыка:', existingSkill.skill.name, err);
              }
            }
          }
          
          // Добавляем новые навыки
          for (const skill of validSkills) {
            if (!existingSkillIds.has(skill.value)) {
              try {
                await api.addEmployeeSkill(editingEmployee.id, skill.value, skill.level || 1);
                console.log('Добавлен навык:', skill.label);
              } catch (err) {
                console.error('Ошибка при добавлении навыка:', skill.label, err);
              }
            }
          }
        }
      }
      
      // Перезагружаем данные
      const loadData = async () => {
        try {
          const [employeesResponse, departmentsResponse, vacationsResponse] = await Promise.all([
            api.getEmployees(),
            api.getDepartments(),
            api.request('/api/vacations')
          ]);
          
          const employees = employeesResponse.data || employeesResponse || [];
          const departments = departmentsResponse.departments || departmentsResponse.data || departmentsResponse || [];
          const vacations = vacationsResponse.vacations || vacationsResponse || [];
          
          // Обрабатываем данные сотрудников для совместимости с фронтендом
          const processedEmployees = employees.map(emp => {
            const employeeVacations = vacations.filter(v => v.employee_id === emp.id);
            
            return {
              ...emp,
              // Обеспечиваем совместимость с существующим кодом
              name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
              birth: emp.birth_date,
              joined: emp.hire_date,
              department: emp.department?.name || '',
              department_id: emp.department_id,
              roleInDept: emp.department_role,
              competencies: emp.competencies ? normalizeCompetencies(emp.competencies) : [],
              vacations: employeeVacations,
              wishlist: emp.wishlist_url || emp.wishlist,
              status: emp.status || 'active'
            };
          });
          
          setAllEmployees(processedEmployees);
          setDepartments(departments);
        } catch (err) {
          console.error('Ошибка перезагрузки данных:', err);
        }
      };
      
      await loadData();
      handleCloseEmployeeModal();
    } catch (error) {
      console.error('Ошибка сохранения сотрудника:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [employeesResponse, departmentsResponse, vacationsResponse] = await Promise.all([
          api.getEmployees(),
          api.getDepartments(),
          api.request('/api/vacations')
        ]);
        
        const employees = employeesResponse.data || employeesResponse || [];
        const departments = departmentsResponse.departments || departmentsResponse.data || departmentsResponse || [];
        const vacations = vacationsResponse.vacations || vacationsResponse || [];
        
        // Временная отладка для проверки данных отпусков
        console.log('Vacations data:', vacations);
        console.log('Employee with ID 1:', employees.find(emp => emp.id === 1));
        
        // Проверяем department_id у Александра Карабчука
        const employee1 = employees.find(emp => emp.id === 1);
        if (employee1) {
          console.log('Employee 1 department_id:', employee1.department_id);
          console.log('Employee 1 department:', employee1.department);
          console.log('Available departments:', departments);
        }
        
        // Проверяем структуру данных отпусков
        if (vacations.length > 0) {
          console.log('First vacation structure:', vacations[0]);
          console.log('Vacation employee_id:', vacations[0].employee_id);
          console.log('Vacation start_date:', vacations[0].start_date);
          console.log('Vacation end_date:', vacations[0].end_date);
        }
        
        // Обрабатываем данные сотрудников для совместимости с фронтендом
        const processedEmployees = employees.map(emp => {
          const employeeVacations = vacations.filter(v => v.employee_id === emp.id);
          console.log(`Employee ${emp.id} (${emp.first_name} ${emp.last_name}) vacations:`, employeeVacations);
          
          return {
            ...emp,
            // Обеспечиваем совместимость с существующим кодом
            name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
            birth: emp.birth_date,
            joined: emp.hire_date,
            department: emp.department?.name || '',
            department_id: emp.department_id,
            roleInDept: emp.department_role,
            competencies: emp.competencies ? normalizeCompetencies(emp.competencies) : [],
            vacations: employeeVacations,
            wishlist: emp.wishlist_url || emp.wishlist,
            status: emp.status || 'active'
          };
        });
        
        setAllEmployees(processedEmployees);
        setDepartments(departments);
        
        // Загружаем рейтинг данные если нужно
        if (urlView === 'rating') {
          try {
            const ratingResponse = await api.request('/api/tokens/top');
            setRatingData(ratingResponse || []);
          } catch (ratingError) {
            setRatingData([]);
          }
        }
      } catch (err) {
        setError(err.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [urlView]);
  
  // Защита от не-массивов для departments
  const safeDepartments = Array.isArray(departments) ? departments : [];
  // Опции для фильтров
  const departmentOptions = safeDepartments.map((d) => ({ id: d.id, name: d.name }));
  const roleOptions = [
    ...Array.from(new Set(Array.isArray(allEmployees) ? allEmployees.map((e) => e.role) : [])).map((role) => ({ id: role, name: role })),
  ];
  
  // Определяем текущее представление из URL или используем 'departments' по умолчанию
  const getCurrentView = () => {
    if (urlView && ['departments', 'alphabet', 'birthdays', 'vacations', 'joined', 'rating'].includes(urlView)) {
      return urlView;
    }
    return 'departments';
  };
  
  const [view, setView] = useState(getCurrentView());
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('departments');
  const [sortDirection, setSortDirection] = useState('asc');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Обновляем URL при смене представления
  const handleViewChange = (newView) => {
    if (newView === view) return; // Предотвращаем лишние обновления
    
    setView(newView);
    setSort(newView);
    const basePath = '/structure';
    const newPath = newView === 'departments' ? basePath : `${basePath}/${newView}`;
    navigate(newPath, { replace: true });
  };

  // Синхронизируем состояние с URL при изменении параметров
  useEffect(() => {
    const currentView = getCurrentView();
    if (currentView !== view) {
      setView(currentView);
      setSort(currentView);
    }
  }, [urlView]); // Убрал view из зависимостей



  // Фильтрация и сортировка сотрудников с мемоизацией
  const filteredEmployees = useMemo(() => {
    let filtered = allEmployees.filter(e =>
      (status === 'active' ? e.status !== 'archived' : e.status === 'archived') &&
      (search.trim() === '' || `${e.first_name || ''} ${e.last_name || ''}`.trim().toLowerCase().includes(search.trim().toLowerCase())) &&
      (!departmentFilter || e.department_id === Number(departmentFilter)) &&
      (!roleFilter || e.role === roleFilter)
    );

    // Отладка для страницы vacations
    if (view === 'vacations') {
      console.log('All employees count:', allEmployees.length);
      console.log('Filtered employees count:', filtered.length);
      console.log('Employees with vacations:', allEmployees.filter(e => e.vacations && e.vacations.length > 0));
      console.log('Filtered employees with vacations:', filtered.filter(e => e.vacations && e.vacations.length > 0));
    }

    if (sort === 'alphabet') {
      filtered = filtered.sort((a, b) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.full_name || a.name || '';
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.full_name || b.name || '';
        return nameA.localeCompare(nameB);
      });
    } else if (sort === 'birthdays') {
      filtered = filtered.sort((a, b) => (a.birth || '').localeCompare(b.birth || ''));
    } else if (sort === 'vacations') {
      filtered = filtered.sort((a, b) => (b.vacation ? 1 : 0) - (a.vacation ? 1 : 0));
    } else if (sort === 'joined') {
      filtered = filtered.sort((a, b) => (a.joined || '').localeCompare(b.joined || ''));
    } else if (sort === 'departments') {
      filtered = filtered.sort((a, b) => (a.department_id || 0) - (b.department_id || 0));
    } else if (sort === 'rating') {
      // Сортируем по рейтингу
      filtered = filtered.sort((a, b) => {
        const aRating = ratingData.find(r => r.id === a.id);
        const bRating = ratingData.find(r => r.id === b.id);
        const aPoints = aRating ? aRating.totalPoints || 0 : 0;
        const bPoints = bRating ? bRating.totalPoints || 0 : 0;
        return bPoints - aPoints; // По убыванию
      });
    }

    if (sortDirection === 'desc') {
      filtered = filtered.reverse();
    }

    return filtered;
  }, [status, search, departmentFilter, roleFilter, sort, sortDirection, ratingData, view]);

  // Статистика
  const stats = useMemo(() => {
    const total = filteredEmployees.length;
    const byStatus = {
      active: filteredEmployees.filter(e => e.status !== 'archived').length,
      archived: filteredEmployees.filter(e => e.status === 'archived').length,
    };
    const byDepartment = {};
    filteredEmployees.forEach(e => {
      const deptName = e.department || 'Без отдела';
      if (!byDepartment[deptName]) byDepartment[deptName] = 0;
      byDepartment[deptName]++;
    });
    const totalDepartments = Object.keys(byDepartment).length;
    const totalRoles = new Set(filteredEmployees.map(e => e.role).filter(Boolean)).size;

    return { total, byStatus, byDepartment, totalDepartments, totalRoles };
  }, [filteredEmployees]);

  return (
    <div className="w-full max-w-none mx-auto pt-[50px] md:pt-[70px]">
      {/* Показываем загрузку */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка оргструктуры...</p>
          </div>
        </div>
      )}

      {/* Показываем ошибку */}
      {error && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Показываем основной контент только если данные загружены */}
      {!loading && !error && (
        <>
      {/* Верхний блок */}
      <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-6 gap-2 sm:gap-4 md:gap-8 flex-wrap text-center md:text-left">
        <h1 className="text-[32px] font-bold font-accent text-primary w-full md:w-auto pb-4 md:pb-0">Оргструктура</h1>
        <div className="flex flex-row gap-2 flex-wrap w-full md:w-auto justify-center md:justify-end items-center">
          {/* Кнопка фильтра слева от свитчеров */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-[8px] bg-primary text-white hover:bg-primary/90 transition md:hidden"
            onClick={() => setFiltersOpen && setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <ListFilter className="w-5 h-5" />
          </button>
          {/* Свитчер сортировки */}
          <div className="flex flex-row gap-2 bg-gray rounded-[12px] p-1 flex-wrap flex-1 md:flex-none md:order-1 flex-nowrap">
            {sortSwitcher.map((item, idx) => (
              <button
                key={item.id}
                className={`flex-1 md:flex-none flex items-center justify-center h-10 px-2 py-2 md:px-4 md:py-2 rounded-[8px] font-medium text-sm transition select-none
                  ${sort === item.id ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
                onClick={() => handleViewChange(item.id)}
              >
                {idx === 1 ? <span style={{fontSize: '1rem', lineHeight: 1}} className="font-semibold whitespace-nowrap">А-Я</span> : item.icon}
                <span className="hidden md:inline ml-2">{item.label}</span>
              </button>
            ))}
          </div>
          {/* Здесь можно добавить второй свитчер, если нужен */}
        </div>
      </div>

      {/* Статистика */}
      <div className="analytics-grid mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего сотрудников</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.total}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Columns2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Отделов</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.totalDepartments}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Активные</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.byStatus.active}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600">В архиве</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.byStatus.archived}</div>
        </div>
      </div>

      {/* Панель поиска и фильтров */}
      <div className={`transition-all duration-300 overflow-hidden ${filtersOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} md:max-h-none md:opacity-100`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white rounded-[12px] md:border border-gray/50 md:p-1 mb-6 min-h-[56px] flex-wrap">
          {/* Сортировка и поиск в одной строке */}
          <div className="flex flex-row gap-1 items-center flex-1 min-w-0">
        <button
            className="w-10 h-10 flex items-center justify-center rounded-[8px] text-dark hover:bg-secondary hover:text-white transition"
          onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
          title="Сменить направление сортировки"
        >
          {sortDirection === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
        </button>
          <input
            type="text"
            placeholder="Поиск сотрудников..."
            className="w-full bg-transparent outline-none text-base"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
          {/* Фильтры (Select) */}
        <div className="relative min-w-[100px] w-auto">
          <Select
            options={[{ value: '', label: 'Все отделы' }, ...departmentOptions.map(d => ({ value: d.id, label: d.name }))]}
            value={[{ value: '', label: 'Все отделы' }, ...departmentOptions.map(d => ({ value: d.id, label: d.name }))].find(opt => String(opt.value) === String(departmentFilter))}
            onChange={opt => setDepartmentFilter(opt.value)}
            placeholder="Все отделы"
            isSearchable={false}
            styles={{
              ...customSelectStyles,
              control: (provided, state) => ({
                ...customSelectStyles.control(provided, state),
                minWidth: '100px',
                width: 'auto',
              }),
              menu: (provided) => ({
                ...customSelectStyles.menu(provided),
                minWidth: 'fit-content',
                width: 'auto',
              }),
            }}
            menuPlacement="auto"
            menuPortalTarget={typeof window !== 'undefined' ? window.document.body : null}
            menuPosition="fixed"
            theme={theme => ({
              ...theme,
              borderRadius: 8,
              colors: {
                ...theme.colors,
                primary: '#FF8A15',
                primary25: '#FFE5CC',
                neutral0: '#fff',
                neutral20: '#D9D9D9',
                neutral30: '#FF8A15',
              },
            })}
          />
        </div>
        <div className="relative min-w-[100px] w-auto">
          <Select
            options={[{ value: '', label: 'Все роли' }, ...roleOptions.map(r => ({ value: r.id, label: r.name }))]}
            value={[{ value: '', label: 'Все роли' }, ...roleOptions.map(r => ({ value: r.id, label: r.name }))].find(opt => String(opt.value) === String(roleFilter))}
            onChange={opt => setRoleFilter(opt.value)}
            placeholder="Все роли"
            isSearchable={false}
            styles={{
              ...customSelectStyles,
              control: (provided, state) => ({
                ...customSelectStyles.control(provided, state),
                minWidth: '100px',
                width: 'auto',
              }),
              menu: (provided) => ({
                ...customSelectStyles.menu(provided),
                minWidth: 'fit-content',
                width: 'auto',
              }),
            }}
            menuPlacement="auto"
            menuPortalTarget={typeof window !== 'undefined' ? window.document.body : null}
            menuPosition="fixed"
            theme={theme => ({
              ...theme,
              borderRadius: 8,
              colors: {
                ...theme.colors,
                primary: '#FF8A15',
                primary25: '#FFE5CC',
                neutral0: '#fff',
                neutral20: '#D9D9D9',
                neutral30: '#FF8A15',
              },
            })}
          />
        </div>
          {/* Свитчер активные-архив отдельной строкой */}
          <div className="flex flex-row gap-2 bg-gray rounded-[8px] p-1 w-full md:w-auto mt-2 md:mt-0">
          {statusSwitcher.map((item) => (
            <button
              key={item.id}
                className={`flex-1 md:flex-none flex items-center justify-center px-2 py-2 md:px-4 md:py-2 rounded-[8px] text-sm font-medium transition select-none
                ${status === item.id ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
              onClick={() => setStatus(item.id)}
            >
                {item.icon}
                <span className="hidden md:inline ml-2">{item.label}</span>
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Контент */}
      {(sort === 'department' || sort === 'departments') && (
        <div className="flex flex-col gap-8">
          {safeDepartments.map((dept) => (
            <DepartmentCard 
              key={dept.id} 
              dept={dept} 
              search={search} 
              status={status} 
              view={sort} 
              allEmployees={allEmployees}
              ratingData={ratingData}
              onEditEmployee={handleEditEmployee}
            />
          ))}
        </div>
      )}
      {sort === 'alphabet' && (
        <div className="flex flex-col gap-6">
          {groupEmployees(filteredEmployees, sort, ratingData).map(([group, emps]) => (
            <div key={group}>
              <div className={`text-lg font-bold mb-2 mt-2 p-2 rounded-[8px] text-blue-600 inline-block flex items-center gap-2`}>
                {group}
                <span className="text-sm font-normal text-gray-500">({emps.length})</span>
              </div>
              <div className="employee-grid pb-2">
                {emps.map(emp => (
                  <StructureEmployeeCard key={emp.id} employee={emp} view={sort} vacationIntervals={[]} ratingData={ratingData} onEditEmployee={handleEditEmployee} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {sort === 'rating' && (
        <div className="flex flex-col gap-6">
          {groupEmployees(filteredEmployees, sort, ratingData).map(([group, emps]) => (
            <div key={group}>
              <div className={`text-lg font-bold mb-2 mt-2 p-2 rounded-[8px] text-purple-600 inline-block flex items-center gap-2`}>
                {group}
                <span className="text-sm font-normal text-gray-500">({emps.length})</span>
              </div>
              <div className="employee-grid pb-2">
                {emps.map(emp => (
                  <StructureEmployeeCard key={emp.id} employee={emp} view={sort} vacationIntervals={[]} ratingData={ratingData} onEditEmployee={handleEditEmployee} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {sort === 'birthdays' && (
        <div className="flex flex-col gap-6">
          {groupEmployees(filteredEmployees, sort, ratingData).map(([month, emps]) => {
            const monthIndex = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'].indexOf(month);
            const season = monthIndex <= 1 || monthIndex === 11 ? 'winter' : 
                          monthIndex <= 4 ? 'spring' : 
                          monthIndex <= 7 ? 'summer' : 'autumn';
            const seasonColors = {
              winter: 'text-blue-600',
              spring: 'text-green-600', 
              summer: 'text-yellow-600',
              autumn: 'text-orange-600'
            };
            const seasonIcons = {
              winter: <Snowflake className="w-5 h-5" />,
              spring: <Flower2 className="w-5 h-5" />,
              summer: <Sun className="w-5 h-5" />,
              autumn: <Leaf className="w-5 h-5" />
            };
            return (
              <div key={month}>
                <div className={`text-lg font-bold mb-2 mt-2 p-2 rounded-[8px] ${seasonColors[season]} flex items-center gap-2 inline-block`}>
                  <span className="text-xl">{seasonIcons[season]}</span>
                  {month}
                  <span className="text-sm font-normal text-gray-500">({emps.length})</span>
                </div>
                <div className="employee-grid pb-2">
                  {emps.map(emp => (
                    <StructureEmployeeCard key={emp.id} employee={emp} view={sort} vacationIntervals={[]} ratingData={ratingData} onEditEmployee={handleEditEmployee} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {sort === 'vacations' && (
        <div className="flex flex-col gap-6">
          {groupEmployees(filteredEmployees, sort, ratingData).map(([month, emps]) => {
            const monthIndex = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'].indexOf(month);
            const season = monthIndex <= 1 || monthIndex === 11 ? 'winter' : 
                          monthIndex <= 4 ? 'spring' : 
                          monthIndex <= 7 ? 'summer' : 'autumn';
            const seasonColors = {
              winter: 'text-blue-600',
              spring: 'text-green-600', 
              summer: 'text-yellow-600',
              autumn: 'text-orange-600'
            };
            const seasonIcons = {
              winter: <Snowflake className="w-5 h-5" />,
              spring: <Flower2 className="w-5 h-5" />,
              summer: <Sun className="w-5 h-5" />,
              autumn: <Leaf className="w-5 h-5" />
            };
            return (
              <div key={month}>
                <div className={`text-lg font-bold mb-2 mt-2 p-2 rounded-[8px] ${seasonColors[season]} flex items-center gap-2 inline-block`}>
                  <span className="text-xl">{seasonIcons[season]}</span>
                  {month}
                  <span className="text-sm font-normal text-gray-500">({emps.length})</span>
                </div>
                <div className="employee-grid pb-2">
                  {emps.map(emp => {
                    // Найти все отпуска сотрудника в этом месяце
                    const intervals = (emp.vacations || [])
                      .filter(v => Number(v.start_date.split('-')[1]) === (['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'].indexOf(month)+1))
                      .map(v => {
                        const start = formatDate(v.start_date, true);
                        const end = formatDate(v.end_date, true);
                        return start === end ? start : `${start}-${end}`;
                      });
                    return (
                      <StructureEmployeeCard key={emp.id} employee={emp} view={sort} vacationIntervals={intervals} ratingData={ratingData} onEditEmployee={handleEditEmployee} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {sort === 'joined' && (
        <div className="flex flex-col gap-6">
          {groupEmployees(filteredEmployees, sort, ratingData).map(([group, emps]) => {
            const groupIcons = {
              'Новички': <Baby className="w-5 h-5" />,
              'Опытные': <Star className="w-5 h-5" />,
              'Старожилы': <Crown className="w-5 h-5" />,
              'Древние': <Building className="w-5 h-5" />,
              'Шпионы': <UserCheck className="w-5 h-5" />
            };
            const groupColors = {
              'Новички': 'text-green-600',
              'Опытные': 'text-blue-600',
              'Старожилы': 'text-purple-600',
              'Древние': 'text-orange-600',
              'Шпионы': 'text-gray-600'
            };
            return (
              <div key={group}>
                <div className={`text-lg font-bold mb-2 mt-2 p-2 rounded-[8px] ${groupColors[group]} flex items-center gap-2 inline-block`}>
                  {groupIcons[group]}
                  {group}
                  <span className="text-sm font-normal text-gray-500">({emps.length})</span>
                </div>
                <div className="employee-grid pb-2">
                  {emps.map(emp => (
                    <StructureEmployeeCard key={emp.id} employee={emp} view={sort} vacationIntervals={[]} ratingData={ratingData} onEditEmployee={handleEditEmployee} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
      
      {/* Модальное окно редактирования сотрудника */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={handleCloseEmployeeModal}
        onSubmit={handleSaveEmployee}
        editingEmployee={editingEmployee}
        existingEmployees={allEmployees}
      />
    </div>
  );
}

function DepartmentCard({ dept, search, status, view, allEmployees, ratingData = [], onEditEmployee }) {
  const navigate = useNavigate();
  const { userData, activeRole } = useAuth();
  const { hasAdminMenu } = useRole();
  
  // Получаем сотрудников отдела из обработанных данных
  const deptEmployees = allEmployees.filter(e => e.department_id === dept.id);
  
  // Отладка для страницы vacations
  if (view === 'vacations') {
    console.log(`Department ${dept.name} (ID: ${dept.id}) employees:`, deptEmployees.length);
    console.log(`Department ${dept.name} employees with vacations:`, deptEmployees.filter(e => e.vacations && e.vacations.length > 0));
  }
  
  // Определяем, есть ли права на редактирование отделов
  const hasDepartmentEditRights = hasAdminMenu && userData?.adminRoles?.some(role => 
    role.id.toString() === activeRole && (
      role.name === 'Главный администратор' || 
      (role.permissions && role.permissions.includes('departments'))
    )
  );

  // Фильтрация сотрудников отдела
  const employeesFiltered = deptEmployees.filter(e =>
    (status === 'active' ? e.status !== 'archived' : e.status === 'archived') &&
    (search.trim() === '' || `${e.first_name || ''} ${e.last_name || ''}`.trim().toLowerCase().includes(search.trim().toLowerCase()))
  );

  // === Сортировка сотрудников: лид, зам, продакты, остальные по алфавиту ===
  const roleOrder = { lead: 0, deputy: 1, product: 2, other: 3 };
  const getRoleSort = (emp) => roleOrder[emp.roleInDept] ?? roleOrder.other;
  const employeesSorted = [...employeesFiltered].sort((a, b) => {
    const roleA = getRoleSort(a);
    const roleB = getRoleSort(b);
    if (roleA !== roleB) return roleA - roleB;
    // Handle cases where name might be undefined - use first_name + last_name or fallback to full_name/name
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.full_name || a.name || '';
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.full_name || b.name || '';
    return nameA.localeCompare(nameB, 'ru');
  });

  // Если нет сотрудников после фильтрации, показываем сообщение
  if (employeesSorted.length === 0) {
    return (
      <div className="department-layout bg-transparent w-full min-h-[180px]">
        <div className="department-info flex flex-col gap-1 sm:gap-2 justify-center">
          <div className="flex items-center gap-2 mb-1">
            {/* {getDepartmentIcon(dept.icon)} */}
            <span className="text-xl font-accent text-dark font-bold">{dept.name}</span>
          </div>
          <div className="text-sm text-gray-600 italic mb-1">{dept.slogan}</div>
          <div className="text-xs text-gray-700 mb-1">
            <ul className="text-left list-none pl-2">
              {normalizeCompetencies(dept.competencies).map((c, i) => (
                <li key={i} className="flex items-start justify-start mb-1">
                  <div className="mt-[3px]">
                    <StarBullet />
                  </div>
                  <span className="text-left ml-1">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="department-employees flex items-center justify-center">
          <div className="text-gray-500 text-center">
            {search.trim() !== '' ? 'Нет сотрудников по запросу' : 'Нет сотрудников в отделе'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="department-layout bg-transparent w-full min-h-[180px] relative group">
      {/* Иконка редактирования для администраторов */}
      {hasDepartmentEditRights && (
        <div 
          className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/departments?edit=${dept.id}`);
          }}
          title="Редактировать отдел"
        >
          <Edit className="w-4 h-4 text-gray-600 hover:text-primary" />
        </div>
      )}
      {/* Левая часть */}
      <div className="department-info flex flex-col gap-1 sm:gap-2 justify-center">
        <div className="flex items-center gap-2 mb-1">
          {/* {getDepartmentIcon(dept.icon)} */}
          <span className="text-xl font-accent text-dark font-bold">{dept.name}</span>
        </div>
        <div className="text-sm text-gray-600 italic mb-1">{dept.slogan}</div>
        <div className="text-sm text-gray-700 mb-1">{dept.description}</div>
        <div className="text-xs text-gray-700 mb-1">
          <ul className="text-left list-none pl-2">
            {normalizeCompetencies(dept.competencies).map((c, i) => (
              <li key={i} className="flex items-start justify-start mb-1">
                <div className="mt-[3px]">
                  <StarBullet />
                </div>
                <span className="text-left ml-1">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Правая часть — сотрудники */}
      <div className="department-employees employee-grid">
        {employeesSorted.map((emp) => {
          // Формируем интервалы отпусков для сотрудника
          const vacationIntervals = emp.vacations && emp.vacations.length > 0 
            ? emp.vacations.map(vacation => {
                const startDate = new Date(vacation.start_date);
                const endDate = new Date(vacation.end_date);
                const startFormatted = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
                const endFormatted = `${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
                
                // Если даты одинаковые, показываем только одну дату
                if (startFormatted === endFormatted) {
                  return startFormatted;
                } else {
                  return `${startFormatted}-${endFormatted}`;
                }
              })
            : [];

          return (
            <StructureEmployeeCard 
              key={emp.id} 
              employee={emp} 
              view={view} 
              vacationIntervals={vacationIntervals}
              ratingData={ratingData}
              onEditEmployee={onEditEmployee}
            />
          );
        })}
      </div>
    </div>
  );
}

// Компонент-обертка для использования нового EmployeeCard в контексте Structure
function StructureEmployeeCard({ employee, view, vacationIntervals, ratingData = [], onEditEmployee }) {
  const navigate = useNavigate();
  
  if (!employee) return <div className="p-4 text-center text-gray-500">Нет данных о сотруднике</div>;
  
  const handleClick = () => {
    if (employee.id) navigate(`/employee/${employee.id}`);
  };

  // Получаем рейтинг сотрудника
  const employeeRating = ratingData.find(r => r.id === employee.id);
  const totalPoints = employeeRating ? employeeRating.totalPoints || 0 : 0;
  const achievements = employeeRating ? employeeRating.achievements || 0 : 0;

  // Формируем унифицированную дополнительную информацию для всех представлений (кроме отделов)
  let additionalInfo = '';
  let departmentInfo = '';
  let teamInfo = '';
  let ratingInfo = '';
  let vacationInfo = '';
  
  if (view !== 'departments') {
    // Отдел
    if (employee.department) {
      departmentInfo = employee.department;
    }
    
    // Дата приема (если есть)
    if (employee.joined) {
      teamInfo = calculateTimeInTeam(employee.joined);
    }
    
    // Рейтинг (если есть)
    if (totalPoints > 0) {
      ratingInfo = `${getPointsText(totalPoints)} • ${achievements} достижений`;
    }
  }
  
  // Отпуска (для всех представлений, включая departments)
  if (vacationIntervals && vacationIntervals.length > 0) {
    vacationInfo = vacationIntervals.join(', ');
  }

  // Передаем дополнительную информацию через employee объект
  const enhancedEmployee = {
    ...employee,
    additionalInfo,
    departmentInfo,
    teamInfo,
    ratingInfo,
    vacationInfo,
    showCompetencies: view === 'departments'
  };

    return (
    <div className="relative">
      <EmployeeCard
        employee={enhancedEmployee}
        variant="compact"
        onClick={handleClick}
        onEdit={onEditEmployee}
        showEditButton={true}
        className="h-full"
      />
      

    </div>
  );
}

function StarBullet() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-[6px] min-w-[14px] rounded-[1px]">
      <polygon points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2" fill="#E42E0F" />
    </svg>
  );
}

function groupEmployees(employees, sort, ratingData = []) {
  if (sort === 'alphabet') {
    // Группировка по первой букве фамилии
    const groups = {};
    employees.forEach(e => {
      const employeeName = `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.full_name || e.name || '';
      const letter = (employeeName.split(' ')[1]?.[0] || employeeName?.[0] || '').toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(e);
    });
    return Object.entries(groups).sort();
  }
  if (sort === 'birthdays') {
    // Группировка по месяцу рождения
    const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const groups = {};
    employees.forEach(e => {
      if (!e.birth) return;
      const m = Number(e.birth.split('-')[1]) - 1;
      const month = months[m] || 'Без даты';
      if (!groups[month]) groups[month] = [];
      groups[month].push(e);
    });
    return months.map(m => [m, groups[m] || []]).filter(([,arr])=>arr.length);
  }
  if (sort === 'vacations') {
    // Группировка по месяцу начала отпуска
    const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const groups = {};
    console.log('groupEmployees отпуска - сотрудники с отпусками:', employees.filter(e => e.vacations && e.vacations.length > 0));
    
    employees.forEach(e => {
      if (!e.vacations?.length) return;
      console.log(`Обработка сотрудника ${e.id} (${e.first_name} ${e.last_name}) с ${e.vacations.length} отпусками`);
      e.vacations.forEach(v => {
        console.log(`Отпуск: дата_начала=${v.start_date}, дата_окончания=${v.end_date}`);
        if (!v.start_date) return;
        try {
        const m = Number(v.start_date.split('-')[1]) - 1;
        const month = months[m] || 'Без даты';
        console.log(`Индекс месяца: ${m}, название месяца: ${month}`);
        if (!groups[month]) groups[month] = [];
        if (!groups[month].includes(e)) groups[month].push(e);
        } catch (error) {
          console.warn('Некорректная дата начала отпуска:', v.start_date);
        }
      });
    });
    console.log('Итоговые группы:', groups);
    return months.map(m => [m, groups[m] || []]).filter(([,arr])=>arr.length);
  }
  if (sort === 'joined') {
    // Группировка по стажу
    const groups = {
      'Новички': [],
      'Опытные': [],
      'Старожилы': [],
      'Древние': [],
      'Шпионы': []
    };
    employees.forEach(e => {
      if (!e.joined) {
        groups['Шпионы'].push(e);
        return;
      }
      try {
        const joined = new Date(e.joined);
        if (isNaN(joined.getTime())) {
          groups['Шпионы'].push(e);
          return;
        }
        
        const now = new Date();
        let years = now.getFullYear() - joined.getFullYear();
        let months = now.getMonth() - joined.getMonth();
        
        if (months < 0) {
          years--;
          months += 12;
        }
        
        if (now.getDate() < joined.getDate()) {
          months--;
          if (months < 0) {
            years--;
            months += 12;
          }
        }
        
        const totalMonths = years * 12 + months;
        
        if (totalMonths < 12) groups['Новички'].push(e);
        else if (totalMonths < 36) groups['Опытные'].push(e);
        else if (totalMonths < 60) groups['Старожилы'].push(e);
        else groups['Древние'].push(e);
      } catch (error) {
        groups['Шпионы'].push(e);
      }
    });
    return Object.entries(groups).filter(([,arr])=>arr.length);
  }
  if (sort === 'rating') {
    // Группировка по уровню рейтинга
    const groups = {
      'Легенды': [],
      'Мастера': [],
      'Эксперты': [],
      'Специалисты': [],
      'Новички': []
    };
    employees.forEach(e => {
      // Находим рейтинг сотрудника
      const employeeRating = ratingData.find(r => r.id === e.id);
      const totalPoints = employeeRating ? employeeRating.totalPoints || 0 : 0;
      
      if (totalPoints >= 1000) groups['Легенды'].push(e);
      else if (totalPoints >= 500) groups['Мастера'].push(e);
      else if (totalPoints >= 200) groups['Эксперты'].push(e);
      else if (totalPoints >= 50) groups['Специалисты'].push(e);
      else groups['Новички'].push(e);
    });
    return Object.entries(groups).filter(([,arr])=>arr.length);
  }
  return [];
} 