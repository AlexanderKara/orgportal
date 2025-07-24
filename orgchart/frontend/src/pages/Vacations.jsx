import React, { useState, useMemo, useEffect } from 'react';
import { 
  Table, Calendar, Search, SortAsc, SortDesc, Filter, 
  TrendingUp, User, Building, Calendar as CalendarIcon, Clock, 
  BarChart3, LayoutGrid, Users, Plus, Edit, Trash2, Eye, CheckCircle, ListFilter
} from 'lucide-react';
import api from '../services/api';
import Select from 'react-select';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../components/RoleProvider';

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

const viewOptions = [
  { id: 'table', label: 'Таблица', icon: <Table className="w-4 h-4" /> },
  { id: 'chart', label: 'Диаграмма', icon: <BarChart3 className="w-4 h-4" /> },
];

const chartViewOptions = [
  { id: 'list', label: 'Списки', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'cluster', label: 'Кластеры', icon: <Users className="w-4 h-4" /> },
];

const sortOptions = [
  { id: 'employeeName', label: 'По сотруднику', icon: <User className="w-4 h-4" /> },
  { id: 'department', label: 'По отделу', icon: <Building className="w-4 h-4" /> },
  { id: 'type', label: 'По типу', icon: <Filter className="w-4 h-4" /> },
  { id: 'start_date', label: 'По дате начала', icon: <CalendarIcon className="w-4 h-4" /> },
  { id: 'end_date', label: 'По дате окончания', icon: <CalendarIcon className="w-4 h-4" /> },
  { id: 'days', label: 'По количеству дней', icon: <Clock className="w-4 h-4" /> },
  { id: 'status', label: 'По статусу', icon: <CheckCircle className="w-4 h-4" /> },
];

const vacationTypes = [
  { value: 'all', label: 'Все типы' },
  { value: 'Основной', label: 'Основной' },
  { value: 'Отгул', label: 'Отгул' },
  { value: 'Больничный', label: 'Больничный' },
];

const departments = [
  { value: 'all', label: 'Все отделы' },
  { value: 'Разработка', label: 'Разработка' },
  { value: 'Аналитика', label: 'Аналитика' },
];

const months = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
];

const quarters = [
  { name: '1 кв', months: [0, 1, 2] },
  { name: '2 кв', months: [3, 4, 5] },
  { name: '3 кв', months: [6, 7, 8] },
  { name: '4 кв', months: [9, 10, 11] },
];

export default function Vacations() {
  const { userData } = useAuth();
  const { activeRole } = useRole();
  
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
  
  const [view, setView] = useState('table');
  const [chartView, setChartView] = useState('list');
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [sortBy, setSortBy] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [vacations, setVacations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Загружаем данные
  useEffect(() => {
    const loadVacations = async () => {
      try {
        setLoading(true);
        let vacationsResponse;

        try {
          vacationsResponse = await api.getAdminVacations();
        } catch (adminError) {
          vacationsResponse = await api.getVacations();
        }

        const vacationsData = vacationsResponse?.vacations || vacationsResponse?.data || [];
        setVacations(vacationsData);
      } catch (error) {
        console.error('Error loading vacations:', error);
        // showNotification('Ошибка загрузки отпусков', 'error'); // Assuming showNotification is defined elsewhere
      } finally {
        setLoading(false);
      }
    };

    loadVacations();
  }, []);

  // Фильтрация и сортировка данных
  const filteredVacations = useMemo(() => {
    let filtered = [...vacations];

    // Фильтрация по поиску
    if (search.trim()) {
      filtered = filtered.filter(v => {
        const employeeName = v.employeeName || (v.employee ? `${v.employee.first_name} ${v.employee.last_name}` : '') || '';
        const department = v.department || v.employeeDepartment || (v.employee?.department?.name || '') || '';
        
        return employeeName.toLowerCase().includes(search.trim().toLowerCase()) ||
               department.toLowerCase().includes(search.trim().toLowerCase());
      });
    }

    // Фильтрация по отделу
    if (selectedDepartment && selectedDepartment.value !== 'all') {
      filtered = filtered.filter(v => {
        const department = v.department || v.employeeDepartment || (v.employee?.department?.name || '');
        return department === selectedDepartment.value;
      });
    }

    // Фильтрация по типу
    if (selectedType && selectedType.value !== 'all') {
      filtered = filtered.filter(v => {
        const type = v.type || v.vacation_type || '';
        return type === selectedType.value;
      });
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'employeeName':
          aValue = a.employeeName || (a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : '') || '';
          bValue = b.employeeName || (b.employee ? `${b.employee.first_name} ${b.employee.last_name}` : '') || '';
          break;
        case 'department':
          aValue = a.department || a.employeeDepartment || (a.employee?.department?.name || '') || '';
          bValue = b.department || b.employeeDepartment || (b.employee?.department?.name || '') || '';
          break;
        case 'start_date':
          aValue = new Date(a.start_date || 0);
          bValue = new Date(b.start_date || 0);
          break;
        case 'end_date':
          aValue = new Date(a.end_date || 0);
          bValue = new Date(b.end_date || 0);
          break;
        case 'days':
          aValue = a.days || a.days_count || 0;
          bValue = b.days || b.days_count || 0;
          break;
        case 'type':
          aValue = a.type || a.vacation_type || '';
          bValue = b.type || b.vacation_type || '';
          break;
        default:
          aValue = a.start_date || 0;
          bValue = b.start_date || 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [search, selectedDepartment, selectedType, sortBy, sortDirection, vacations]);

  // Статистика
  const stats = useMemo(() => {
    const total = filteredVacations.length;
    const totalDays = filteredVacations.reduce((sum, v) => sum + v.days, 0);

    return { total, totalDays };
  }, [filteredVacations]);

  // Группировка данных для диаграммы
  const chartData = useMemo(() => {
    const grouped = {};
    
    filteredVacations.forEach(vacation => {
      const key = `${vacation.employee_id}-${vacation.employeeName}`;
      if (!grouped[key]) {
        grouped[key] = {
          employee_id: vacation.employee_id,
          employeeName: vacation.employeeName,
          employee: vacation.employee,
          department: vacation.department || vacation.employeeDepartment || vacation.employee?.department?.name,
          vacations: []
        };
      }
      grouped[key].vacations.push(vacation);
    });

    return Object.values(grouped);
  }, [filteredVacations]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getVacationColor = () => {
    return 'bg-orange-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getMonthPosition = (dateString) => {
    const date = new Date(dateString);
    return date.getMonth();
  };

  const getVacationBar = (vacation) => {
    const startDate = new Date(vacation.start_date);
    const endDate = new Date(vacation.end_date);
    
    // Получаем день года (1-365)
    const startDayOfYear = Math.floor((startDate - new Date(startDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const endDayOfYear = Math.floor((endDate - new Date(endDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Вычисляем позицию и ширину в процентах от 365 дней
    const left = (startDayOfYear / 365) * 100;
    const width = ((endDayOfYear - startDayOfYear + 1) / 365) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className="w-full max-w-none mx-auto pt-[50px] md:pt-[70px]">
      {/* Показываем загрузку */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка отпусков...</p>
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
        <h1 className="text-[32px] font-bold font-accent text-primary w-full md:w-auto pb-4 md:pb-0">Отпуска</h1>
        <div className="flex flex-row gap-2 flex-wrap w-full md:w-auto justify-center md:justify-end items-center">
          {/* Кнопка фильтра слева от свитчеров */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-[8px] bg-primary text-white hover:bg-primary/90 transition md:hidden"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <ListFilter className="w-5 h-5" />
          </button>
          {/* Свитчеры */}
          <div className="flex flex-row gap-2 bg-gray rounded-[12px] p-1 flex-wrap flex-1 md:flex-none flex-nowrap">
            {viewOptions.map((item) => (
              <button
                key={item.id}
                className={`flex-1 md:flex-none flex items-center justify-center h-10 px-2 py-2 md:px-4 md:py-2 rounded-[8px] font-medium text-sm transition select-none
                  ${view === item.id ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
                onClick={() => setView(item.id)}
              >
                {item.icon}
                <span className="hidden md:inline ml-2">{item.label}</span>
              </button>
            ))}
          </div>
          {view === 'chart' && (
            <div className="flex flex-row gap-2 bg-gray rounded-[12px] p-1 flex-wrap flex-1 md:flex-none flex-nowrap">
              {chartViewOptions.map((item) => (
                <button
                  key={item.id}
                  className={`flex-1 md:flex-none flex items-center justify-center h-10 px-2 py-2 md:px-4 md:py-2 rounded-[8px] font-medium text-sm transition select-none
                    ${chartView === item.id ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
                  onClick={() => setChartView(item.id)}
                >
                  {item.icon}
                  <span className="hidden md:inline ml-2">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего отпусков</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.total}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Сейчас</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredVacations.filter(v => {
            const now = new Date();
            const start = new Date(v.start_date);
            const end = new Date(v.end_date);
            return start <= now && now <= end;
          }).length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">В следующем месяце</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredVacations.filter(v => {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const start = new Date(v.start_date);
            const end = new Date(v.end_date);
            return start <= nextMonth && nextMonth <= end;
          }).length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Через месяц</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredVacations.filter(v => {
            const twoMonths = new Date();
            twoMonths.setMonth(twoMonths.getMonth() + 2);
            const start = new Date(v.start_date);
            const end = new Date(v.end_date);
            return start <= twoMonths && twoMonths <= end;
          }).length}</div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className={`transition-all duration-300 overflow-hidden ${filtersOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} md:max-h-none md:opacity-100`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white rounded-[12px] md:border border-gray/50 md:p-1 mb-6 min-h-[56px] flex-wrap">
          {/* Сортировка и поиск на одной строке */}
          <div className="flex flex-row gap-1 items-center flex-1 min-w-0">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-[8px] text-dark hover:bg-secondary hover:text-white transition"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            title="Сменить направление сортировки"
          >
            {sortDirection === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
          </button>
          <input
            type="text"
            placeholder="Поиск по сотруднику или отделу..."
            className="w-full bg-transparent outline-none text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
          {/* Фильтры */}
          <div className="relative min-w-[100px] w-auto">
          <Select
            placeholder="Отдел"
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            options={departments}
            styles={customSelectStyles}
          />
          </div>
          <div className="relative min-w-[100px] w-auto">
          <Select
            placeholder="Тип"
            value={selectedType}
            onChange={setSelectedType}
            options={vacationTypes}
            styles={customSelectStyles}
          />
          </div>
        </div>
      </div>

      {/* Контент */}
      {view === 'table' ? (
        <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    <button
                      onClick={() => handleSort('employeeName')}
                      className="flex items-center hover:text-gray-200"
                    >
                      Сотрудник
                      {sortBy === 'employeeName' ? (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                      ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    <button
                      onClick={() => handleSort('department')}
                      className="flex items-center hover:text-gray-200"
                    >
                      Отдел
                      {sortBy === 'department' ? (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                      ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    <button
                      onClick={() => handleSort('start_date')}
                      className="flex items-center hover:text-gray-200"
                    >
                      Дата начала
                      {sortBy === 'start_date' ? (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                      ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Дата окончания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    <button
                      onClick={() => handleSort('days')}
                      className="flex items-center hover:text-gray-200"
                    >
                      Дней
                      {sortBy === 'days' ? (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                      ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    <button
                      onClick={() => handleSort('type')}
                      className="flex items-center hover:text-gray-200"
                    >
                      Тип
                      {sortBy === 'type' ? (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                      ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                    </button>
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray/20">
                {filteredVacations.map((vacation, index) => {
                  const employeeName = vacation.employeeName || (vacation.employee ? `${vacation.employee.first_name} ${vacation.employee.last_name}` : "Неизвестный");
                  const department = vacation.department || vacation.employeeDepartment || vacation.employee?.department?.name || "Без отдела";
                  const days = vacation.days || vacation.days_count || 0;
                  const type = vacation.type || vacation.vacation_type || "Неизвестный";
                  
                  return (
                    <tr key={vacation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={vacation.employee?.avatar || ""}
                            name={employeeName}
                            size="xs"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {employeeName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(vacation.start_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(vacation.end_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVacationColor(type).replace('bg-', 'text-').replace('-500', '-700')} ${getVacationColor(type).replace('bg-', 'bg-').replace('-500', '-100')}`}>
                          {type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider border-r border-gray/20">
                    <button
                      onClick={() => handleSort('employeeName')}
                      className="flex items-center hover:text-gray-200"
                    >
                      Сотрудник
                      {sortBy === 'employeeName' ? (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                      ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider border-r border-gray/20">
                    <button
                      onClick={() => handleSort('department')}
                      className="flex items-center hover:text-gray-200"
                    >
                      Отдел
                      {sortBy === 'department' ? (
                        sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                      ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                    </button>
                  </th>
                                      {quarters.map((quarter, qIndex) => (
                      <th key={quarter.name} colSpan={3} className={`px-6 py-3 text-center text-xs font-medium text-dark tracking-wider ${
                        qIndex < 3 ? 'border-r-2 border-gray/20' : ''
                      }`}>
                        {quarter.name}
                      </th>
                    ))}
                </tr>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider border-r border-gray/20">
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider border-r border-gray/20">
                  </th>
                                      {months.map((month, mIndex) => (
                      <th key={month} className={`px-6 py-3 text-center text-xs font-medium text-dark tracking-wider ${
                        (mIndex + 1) % 3 === 0 && mIndex < 11 ? 'border-r-2 border-gray/20' : 'border-r border-gray/20'
                      }`}>
                        {month}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray/20">
                {chartView === 'list' ? (
                  // Режим списков - каждый отпуск на отдельной строке
                  chartData.flatMap((employee, employeeIndex) => 
                    employee.vacations.map((vacation, vacationIndex) => (
                      <tr key={`${employee.employee_id}-${vacation.id}`} className={(employeeIndex + vacationIndex) % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray/20">
                          <div className="flex items-center">
                            <Avatar
                              src={vacation.employee?.avatar || ""}
                              name={vacation.employeeName || (vacation.employee ? `${vacation.employee.first_name} ${vacation.employee.last_name}` : "Неизвестный")}
                              size="xs"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {vacation.employeeName || (vacation.employee ? `${vacation.employee.first_name} ${vacation.employee.last_name}` : "Неизвестный")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray/20">
                          {vacation.department || vacation.employeeDepartment || vacation.employee?.department?.name || "Без отдела"}
                        </td>
                        <td className="px-6 py-4 border-r-2 border-gray/20" colSpan={12}>
                          <div className="relative h-10 bg-gray-100 rounded">
                            <div
                              className={`absolute h-8 top-1 rounded ${getVacationColor(vacation.type || vacation.vacation_type)}`}
                              style={{
                                left: getVacationBar(vacation).left,
                                width: getVacationBar(vacation).width,
                              }}
                              title={`${vacation.type || vacation.vacation_type || "Неизвестный"}: ${formatDate(vacation.start_date)} - ${formatDate(vacation.end_date)} (${vacation.days || vacation.days_count || 0} дней)`}
                            >
                              <span
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-900 font-bold text-xs"
                                style={{whiteSpace: 'nowrap'}}
                              >
                                {(() => {
                                  const start = new Date(vacation.start_date);
                                  const end = new Date(vacation.end_date);
                                  const format = d => d.toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit'});
                                  return start.getTime() === end.getTime()
                                    ? format(start)
                                    : `${format(start)}-${format(end)}`;
                                })()}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  // Режим кластеров - все отпуска сотрудника на одной строке
                  chartData.map((employee, index) => (
                    <tr key={employee.employee_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray/20">
                        <div className="flex items-center">
                          <Avatar
                            src={employee.employee?.avatar || ""}
                            name={employee.employeeName || (employee.employee ? `${employee.employee.first_name} ${employee.employee.last_name}` : "Неизвестный")}
                            size="xs"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.employeeName || (employee.employee ? `${employee.employee.first_name} ${employee.employee.last_name}` : "Неизвестный")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray/20">
                        {employee.department || employee.employeeDepartment || employee.employee?.department?.name || "Без отдела"}
                      </td>
                      <td className="px-6 py-4 border-r-2 border-gray/20" colSpan={12}>
                        <div className="relative h-10 bg-gray-100 rounded">
                          {employee.vacations.map((vacation, vIndex) => {
                            const bar = getVacationBar(vacation);
                            return (
                              <div
                                key={vacation.id}
                                className={`absolute h-8 top-1 rounded ${getVacationColor(vacation.type || vacation.vacation_type)}`}
                                style={{
                                  left: bar.left,
                                  width: bar.width,
                                  zIndex: vIndex + 1
                                }}
                                title={`${vacation.type || vacation.vacation_type || "Неизвестный"}: ${formatDate(vacation.start_date)} - ${formatDate(vacation.end_date)} (${vacation.days || vacation.days_count || 0} дней)`}
                              >
                                <span
                                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-900 font-bold text-xs"
                                  style={{whiteSpace: 'nowrap'}}
                                >
                                  {(() => {
                                    const start = new Date(vacation.start_date);
                                    const end = new Date(vacation.end_date);
                                    const format = d => d.toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit'});
                                    return start.getTime() === end.getTime()
                                      ? format(start)
                                      : `${format(start)}-${format(end)}`;
                                  })()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}