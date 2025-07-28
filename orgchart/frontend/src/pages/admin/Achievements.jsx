import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Award, Star, Heart, Users, Zap, Calendar, Crown, Search, Filter, Shuffle, X, Trophy, Medal, Gem, Target, Shield } from 'lucide-react';
import { showNotification } from '../../utils/notifications';
import { getProportionalPadding } from '../../utils/padding';
import api from '../../services/api';
import ViewSwitcher from '../../components/ui/ViewSwitcher';
import AchievementModal from '../../components/admin/AchievementModal';
import AssignAchievementModal from '../../components/admin/AssignAchievementModal';

const getAchievementIcon = (icon) => {
  const iconMap = {
    'award': <Award className="w-6 h-6 text-primary" />,
    'star': <Star className="w-6 h-6 text-yellow-500" />,
    'crown': <Crown className="w-6 h-6 text-purple-500" />,
    'heart': <Heart className="w-6 h-6 text-red-500" />,
    'trophy': <Trophy className="w-6 h-6 text-orange-500" />,
    'medal': <Medal className="w-6 h-6 text-blue-500" />,
    'gem': <Gem className="w-6 h-6 text-green-500" />,
    'zap': <Zap className="w-6 h-6 text-yellow-400" />,
    'target': <Target className="w-6 h-6 text-red-400" />,
    'shield': <Shield className="w-6 h-6 text-blue-400" />
  };
  return iconMap[icon] || <Award className="w-6 h-6 text-primary" />;
};

const getTypeTranslation = (type) => {
  switch (type) {
    case 'social': return 'Социальный';
    case 'activity': return 'Активность';
    case 'generosity': return 'Щедрость';
    case 'team': return 'Команда';
    case 'special': return 'Особый';
    case 'seasonal': return 'Сезонный';
    case 'unique': return 'Уникальный';
    default: return type;
  }
};

export default function Achievements() {
  const [activeTab, setActiveTab] = useState('types'); // 'types' или 'employees'
  
  // Проверяем токен при загрузке компонента
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Необходима авторизация', 'error');
    }
  }, []);
  
  // Состояние для типов достижений
  const [achievements, setAchievements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [loading, setLoading] = useState(true);

  // Состояние для достижений сотрудников
  const [employees, setEmployees] = useState([]);
  const [employeeAchievements, setEmployeeAchievements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  // Фильтры для типов достижений
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Определяем представления для ViewSwitcher
  const views = [
    {
      id: 'types',
      label: 'Типы бейджей',
      icon: <Award className="w-4 h-4" />
    },
    {
      id: 'employees',
      label: 'Распределение бейджей',
      icon: <Users className="w-4 h-4" />
    }
  ];

  // Загрузка типов достижений
  useEffect(() => {
    if (activeTab === 'types') {
      loadAchievements();
    }
  }, [activeTab]);

  // Загрузка данных сотрудников
  useEffect(() => {
    if (activeTab === 'employees') {
      loadEmployeesData();
    }
  }, [activeTab]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await api.getAchievements();
      
      let data;
      if (response && response.success) {
        data = response.achievements;
      } else if (Array.isArray(response)) {
        data = response;
      } else if (response && Array.isArray(response.data)) {
        data = response.data;
      } else {
        data = [];
      }
      
      setAchievements(data);
    } catch (error) {
      console.error('Error loading achievements:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      if (error.status === 401) {
        showNotification('Необходима авторизация', 'error');
      } else if (error.status === 403) {
        showNotification('Доступ запрещен', 'error');
      } else {
        showNotification('Ошибка загрузки достижений', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeesData = async () => {
    try {
      setEmployeesLoading(true);
      
      const [employeesResponse, achievementsResponse] = await Promise.all([
        api.getEmployees(),
        api.getAchievements()
      ]);
      
      let employeesData;
      if (employeesResponse && employeesResponse.success) {
        employeesData = employeesResponse.data || employeesResponse.employees || [];
      } else if (Array.isArray(employeesResponse)) {
        employeesData = employeesResponse;
      } else if (employeesResponse && Array.isArray(employeesResponse.data)) {
        employeesData = employeesResponse.data;
      } else {
        employeesData = [];
      }
      
      let achievementsData;
      if (achievementsResponse && achievementsResponse.success) {
        achievementsData = achievementsResponse.achievements || achievementsResponse.data || [];
      } else if (Array.isArray(achievementsResponse)) {
        achievementsData = achievementsResponse;
      } else if (achievementsResponse && Array.isArray(achievementsResponse.data)) {
        achievementsData = achievementsResponse.data;
      } else {
        achievementsData = [];
      }
      
      setEmployees(employeesData);
      setAchievements(achievementsData);
      
      // Отладочная информация
      console.log('Employees data structure:', employeesData.slice(0, 2));
      if (employeesData.length > 0) {
        console.log('First employee data:', employeesData[0]);
      }
      
      // Загружаем достижения для каждого сотрудника
      const employeeAchievementsPromises = employeesData.map(employee => 
        api.getEmployeeAchievements(employee.id)
      );
      
      const employeeAchievementsResponses = await Promise.all(employeeAchievementsPromises);
      
      const employeeAchievementsMap = {};
      employeesData.forEach((employee, index) => {
        const achievementsResponse = employeeAchievementsResponses[index];
        let achievements;
        
        if (achievementsResponse && achievementsResponse.success) {
          achievements = achievementsResponse.achievements || achievementsResponse.data || [];
        } else if (Array.isArray(achievementsResponse)) {
          achievements = achievementsResponse;
        } else if (achievementsResponse && Array.isArray(achievementsResponse.data)) {
          achievements = achievementsResponse.data;
        } else {
          achievements = [];
        }
        
        employeeAchievementsMap[employee.id] = achievements;
      });
      
      setEmployeeAchievements(employeeAchievementsMap);
    } catch (error) {
      console.error('Error loading employees data:', error);
      showNotification('Ошибка загрузки данных сотрудников', 'error');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAchievement(null);
    setShowModal(true);
  };

  const handleEdit = (achievement) => {
    setEditingAchievement(achievement);
    setShowModal(true);
  };

  const handleSubmit = async (achievementData) => {
    try {
      if (editingAchievement) {
        await api.updateAchievement(editingAchievement.id, achievementData);
        showNotification('Достижение обновлено', 'success');
      } else {
        await api.createAchievement(achievementData);
        showNotification('Достижение создано', 'success');
      }
      setShowModal(false);
      loadAchievements();
    } catch (error) {
      console.error('Error saving achievement:', error);
      showNotification('Ошибка сохранения достижения', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это достижение?')) {
      try {
        await api.deleteAchievement(id);
        showNotification('Достижение удалено', 'success');
        loadAchievements();
      } catch (error) {
        console.error('Error deleting achievement:', error);
        showNotification('Ошибка удаления достижения', 'error');
      }
    }
  };

  const handleAssignAchievement = (employee) => {
    setSelectedEmployee(employee);
    setShowAssignModal(true);
  };

  const handleSubmitAssignment = async (data) => {
    try {
      await api.assignAchievementToEmployee(data);
      showNotification('Достижение назначено', 'success');
      setShowAssignModal(false);
      loadEmployeesData();
    } catch (error) {
      console.error('Error assigning achievement:', error);
      showNotification('Ошибка назначения достижения', 'error');
    }
  };

  const getEmployeeAchievements = (employeeId) => {
    return employeeAchievements[employeeId] || [];
  };

  const getStatistics = () => {
    const totalAchievements = achievements.length;
    const activeAchievements = achievements.filter(a => a.isActive).length;
    const uniqueAchievements = achievements.filter(a => a.is_unique).length;
    const totalAssignments = Object.values(employeeAchievements).reduce((sum, achievements) => sum + achievements.length, 0);
    
    return { totalAchievements, activeAchievements, uniqueAchievements, totalAssignments };
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         achievement.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || achievement.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && achievement.isActive) ||
                         (statusFilter === 'inactive' && !achievement.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'with_achievements' && getEmployeeAchievements(employee.id).length > 0) ||
                         (selectedFilter === 'without_achievements' && getEmployeeAchievements(employee.id).length === 0);
    
    return matchesSearch && matchesFilter;
  });

  const stats = getStatistics();

  if (loading && activeTab === 'types') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка достижений...</div>
      </div>
    );
  }

  if (employeesLoading && activeTab === 'employees') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка данных сотрудников...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Достижения</h1>
        </div>
        <div className="flex items-center gap-4">
          {activeTab === 'types' && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Добавить бейдж
            </button>
          )}
          
          {/* Переключатель представлений */}
          <ViewSwitcher
            views={views}
            activeView={activeTab}
            onViewChange={setActiveTab}
            className="flex-1 min-w-0"
          />
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего достижений</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.totalAchievements}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Активных</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.activeAchievements}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Уникальных</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.uniqueAchievements}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Назначений</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.totalAssignments}</div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="flex items-center gap-2 bg-white rounded-[12px] border border-gray/50 p-1 mb-6 min-h-[56px] flex-wrap">
        <div className="flex-1 flex items-center">
          <Search className="w-4 h-4 text-gray-400 ml-3 mr-2" />
          <input
            type="text"
            placeholder={activeTab === 'types' ? "Поиск по названию или описанию..." : "Поиск по имени или email..."}
            className="w-full bg-transparent outline-none text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {activeTab === 'types' ? (
            <>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray/20 rounded-[6px] text-sm bg-white"
              >
                <option value="all">Все типы</option>
                <option value="social">Социальный</option>
                <option value="activity">Активность</option>
                <option value="generosity">Щедрость</option>
                <option value="team">Команда</option>
                <option value="special">Особый</option>
                <option value="seasonal">Сезонный</option>
                <option value="unique">Уникальный</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray/20 rounded-[6px] text-sm bg-white"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>
            </>
          ) : (
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray/20 rounded-[6px] text-sm bg-white"
            >
              <option value="all">Все сотрудники</option>
              <option value="with_achievements">С достижениями</option>
              <option value="without_achievements">Без достижений</option>
            </select>
          )}
        </div>
      </div>

      {/* Контент в зависимости от активной вкладки */}
      {activeTab === 'types' ? (
        /* Представление типов бейджей */
        <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Уникальный
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray/20">
                {filteredAchievements.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg">Достижения не найдены</p>
                      <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
                    </td>
                  </tr>
                ) : (
                  filteredAchievements.map((achievement) => (
                    <tr key={achievement.id} className="hover:bg-gray/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {achievement.image ? (
                            <div 
                              className="w-10 h-10 rounded-full overflow-hidden"
                              style={{ padding: `${getProportionalPadding(40)}px` }}
                            >
                              <img 
                                src={achievement.image} 
                                alt={achievement.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ 
                                backgroundColor: achievement.color,
                                padding: `${getProportionalPadding(40)}px`
                              }}
                            >
                              {getAchievementIcon(achievement.icon)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-dark">{achievement.name}</div>
                            <div className="text-sm text-gray-500">{achievement.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getTypeTranslation(achievement.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          achievement.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {achievement.isActive ? 'Активный' : 'Неактивный'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          achievement.type === 'unique'
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {achievement.type === 'unique' ? 'Да' : 'Нет'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(achievement)}
                            className="text-primary hover:text-primary/80 transition"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(achievement.id)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Представление распределения бейджей */
        <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Сотрудник
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Отдел
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Достижения
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray/20">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg">Сотрудники не найдены</p>
                      <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => {
                    const employeeAchievementsList = getEmployeeAchievements(employee.id);
                    return (
                      <tr key={employee.id} className="hover:bg-gray/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {employee.avatar ? (
                              <img 
                                src={employee.avatar} 
                                alt={employee.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {(() => {
                                    console.log('Employee data for initials:', {
                                      id: employee.id,
                                      firstName: employee.firstName,
                                      lastName: employee.lastName,
                                      name: employee.name,
                                      full_name: employee.full_name
                                    });
                                    return employee.firstName && employee.lastName 
                                      ? `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`
                                      : employee.name?.charAt(0) || employee.full_name?.charAt(0) || '?'
                                  })()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-dark">
                                {employee.firstName && employee.lastName 
                                  ? `${employee.firstName} ${employee.lastName}`
                                  : employee.name || employee.full_name || 'Неизвестный сотрудник'
                                }
                              </div>
                              <div className="text-sm text-gray-500">{employee.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.department?.name || 'Не указан'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{employeeAchievementsList.length}</span>
                            {employeeAchievementsList.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {employeeAchievementsList.slice(0, 3).map((ea) => (
                                  <div key={ea.id} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: ea.achievement?.color }}>
                                    {getAchievementIcon(ea.achievement?.icon)}
                                  </div>
                                ))}
                                {employeeAchievementsList.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{employeeAchievementsList.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAssignAchievement(employee)}
                              className="text-primary hover:text-primary/80 transition"
                              title="Назначить достижение"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {/* TODO: Просмотр достижений */}}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Просмотреть достижения"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальные окна */}
      {showModal && (
        <AchievementModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          achievement={editingAchievement}
        />
      )}

      {showAssignModal && selectedEmployee && (
        <AssignAchievementModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSubmit={handleSubmitAssignment}
          employee={selectedEmployee}
          achievements={achievements}
        />
      )}
    </div>
  );
}