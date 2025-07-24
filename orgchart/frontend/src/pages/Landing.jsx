import React, { useState, useEffect } from 'react';
import { Home, Users, Clock, Trophy, Package, Plane, Calendar } from 'lucide-react';
import ViewSwitcher from '../components/ui/ViewSwitcher';
import PageHeader from '../components/ui/PageHeader';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPointsText } from '../utils/dateUtils';

// Компонент дашборда сотрудника
const DashboardView = ({ employees, products, vacations, topRating = [] }) => {
  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать!</h2>
        <p className="text-gray-600">Здесь вы можете найти всю важную информацию о компании</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Сотрудников</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-[12px] flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Продуктов</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-[12px] flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-[15px] border border-gray/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">В отпуске</p>
              <p className="text-2xl font-bold text-gray-900">{vacations.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-[12px] flex items-center justify-center">
              <Plane className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Последние отпуска */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Последние отпуска
          </h3>
          <button 
            onClick={() => window.location.href = '/account/vacations'}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Посмотреть все →
          </button>
        </div>
        <div className="space-y-3">
          {vacations.length > 0 ? (
            vacations.slice(0, 3).map(vacation => (
              <div key={vacation.id} className="flex items-center p-3 rounded-[8px] bg-gray-50">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <Plane className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{vacation.employee?.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(vacation.startDate).toLocaleDateString('ru-RU')} - {new Date(vacation.endDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">{vacation.daysCount} дней</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Нет активных отпусков</p>
          )}
        </div>
      </div>

      {/* Последние новости */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Последние новости
          </h3>
        </div>
        <div className="space-y-3">
          {[
            { id: 1, title: 'Запущен новый продукт', description: 'Product Y успешно вышел в продакшн', date: '2 часа назад' },
            { id: 2, title: 'Новый сотрудник', description: 'К нам присоединился новый разработчик', date: '1 день назад' },
            { id: 3, title: 'Обновление системы', description: 'Вышла новая версия CRM-системы', date: '3 дня назад' }
          ].map(news => (
            <div key={news.id} className="flex items-center p-3 rounded-[8px] bg-gray-50">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600">📰</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{news.title}</p>
                <p className="text-sm text-gray-600">{news.description}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">{news.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Рейтинг компании */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Топ рейтинга компании
          </h3>
          <button 
            onClick={() => window.location.href = '/account/rating'}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Посмотреть всех →
          </button>
        </div>
        <div className="space-y-3">
          {topRating.length > 0 ? topRating.slice(0, 5).map((emp, index) => (
            <div key={emp.id} className="flex items-center p-3 rounded-[8px] bg-gray-50">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-yellow-400 text-white' :
                index === 1 ? 'bg-gray-300 text-white' :
                index === 2 ? 'bg-orange-400 text-white' :
                'bg-gray-200 text-gray-700'
              }`}>
                {index + 1}
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">{emp.name}</p>
                <p className="text-sm text-gray-600">{emp.position}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {getPointsText(emp.totalPoints || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  {emp.achievements || 0} достижений
                </div>
              </div>
            </div>
          )) : (
            <p className="text-gray-500">Нет данных рейтинга</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент "О нас"
const AboutView = ({ products = [] }) => {
  return (
    <div className="space-y-6">
      {/* Кто мы */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Кто мы</h3>
        <p className="text-lg text-gray-700 leading-relaxed">
          Мы - команда профессионалов, объединенных общей целью создавать инновационные решения 
          для бизнеса. Наша миссия - помогать компаниям расти и развиваться через технологии.
        </p>
      </div>

      {/* Чем занимаемся */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Чем мы занимаемся</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Разработка продуктов</h4>
            <p className="text-gray-700">
              Создаем корпоративные решения, мобильные приложения и веб-платформы, 
              которые помогают бизнесу работать эффективнее.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Аналитика данных</h4>
            <p className="text-gray-700">
              Разрабатываем системы аналитики и машинного обучения для принятия 
              обоснованных бизнес-решений.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Управление проектами</h4>
            <p className="text-gray-700">
              Обеспечиваем качественную реализацию проектов от идеи до запуска, 
              используя современные методологии.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">HR-технологии</h4>
            <p className="text-gray-700">
              Создаем инструменты для управления персоналом, автоматизации процессов 
              и повышения эффективности HR-функций.
            </p>
          </div>
        </div>
      </div>

      {/* Вызовы */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Вызовы перед нами</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span className="text-red-600 font-bold">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Цифровая трансформация</h4>
              <p className="text-gray-700">Помогаем компаниям адаптироваться к цифровой экономике</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Инновации</h4>
              <p className="text-gray-700">Создаем прорывные технологии для будущего</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
              <span className="text-green-600 font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Устойчивое развитие</h4>
              <p className="text-gray-700">Разрабатываем экологичные и социально ответственные решения</p>
            </div>
          </div>
        </div>
      </div>

      {/* Что создаем */}
      <div className="bg-white rounded-[15px] border border-gray/50 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Что мы создаем</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.slice(0, 3).map(product => (
            <div key={product.id} className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-[12px] mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Компонент таймлайна
const TimelineView = () => {
  // Создаем события для таймлайна
  const timelineEvents = [
    {
      id: 1,
      date: '2024-12-15',
      title: 'Запуск Product Y в релиз',
      description: 'Мобильное приложение для отпусков вышло в продакшн',
      type: 'product',
      icon: '📱'
    },
    {
      id: 2,
      date: '2024-12-10',
      title: 'Новый сотрудник в команде',
      description: 'К нам присоединился новый разработчик',
      type: 'team',
      icon: '👥'
    },
    {
      id: 3,
      date: '2024-12-05',
      title: 'Обновление Product X',
      description: 'Вышла новая версия CRM-системы',
      type: 'update',
      icon: '🔄'
    },
    {
      id: 4,
      date: '2024-11-28',
      title: 'Корпоративное мероприятие',
      description: 'Годовое собрание команды',
      type: 'event',
      icon: '🎉'
    },
    {
      id: 5,
      date: '2024-11-20',
      title: 'Product Z получил награду',
      description: 'Лучшая аналитическая платформа года',
      type: 'award',
      icon: '🏆'
    }
  ].sort((a, b) => new Date(b.date) - new Date(a.date)); // Сортировка по дате (новые сверху)

  return (
    <div className="bg-white rounded-[15px] border border-gray/50 p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-8">Что происходит?</h3>
      
      <div className="relative">
        {/* Центральная линия */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gray-300 h-full"></div>
        
        <div className="space-y-8">
          {timelineEvents.map((event, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={event.id} className={`relative flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Содержимое события */}
                <div className={`w-5/12 ${isEven ? 'pr-8' : 'pl-8'}`}>
                  <div className="bg-gray-50 rounded-[12px] p-4 border border-gray/50">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">{event.icon}</span>
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
                
                {/* Центральная точка */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                
                {/* Дата */}
                <div className={`w-5/12 ${isEven ? 'pl-8' : 'pr-8'}`}>
                  <div className={`text-center ${isEven ? 'text-left' : 'text-right'}`}>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(event.date).toLocaleDateString('ru-RU', { 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).getFullYear()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function Landing() {
  const [activeView, setActiveView] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [topRating, setTopRating] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Определяем активное представление из URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/home/hello')) {
      setActiveView('dashboard');
    } else if (path.includes('/home/team-a')) {
      setActiveView('about');
    } else if (path.includes('/home/timeline')) {
      setActiveView('timeline');
    }
  }, [location.pathname]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Загружаем публичные данные (сотрудники и продукты) без авторизации
        const [employeesResponse, productsResponse] = await Promise.all([
          api.getEmployees().catch(err => {
            console.warn('Failed to load employees:', err);
            return { data: [] };
          }),
          api.getProducts().catch(err => {
            console.warn('Failed to load products:', err);
            return { data: [] };
          })
        ]);
        
        setEmployees(employeesResponse.data || employeesResponse || []);
        setProducts(productsResponse.data || productsResponse || []);
        
        // Пытаемся загрузить отпуска и рейтинг только если пользователь авторизован
        if (isAuthenticated) {
          try {
            const [vacationsResponse, ratingResponse] = await Promise.all([
              api.getVacations().catch(err => {
                console.warn('Failed to load vacations:', err);
                return { data: [] };
              }),
              api.request('/api/tokens/top').catch(err => {
                console.warn('Failed to load rating:', err);
                return [];
              })
            ]);
            setVacations(vacationsResponse.data || vacationsResponse || []);
            setTopRating(ratingResponse || []);
          } catch (authError) {
            console.warn('Failed to load auth data:', authError);
            setVacations([]);
            setTopRating([]);
          }
        } else {
          setVacations([]);
          setTopRating([]);
        }
      } catch (err) {
        console.error('Error loading landing data:', err);
        setError(err.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Определяем доступные представления в зависимости от статуса авторизации
  const getAvailableViews = () => {
    const baseViews = [
      {
        id: 'about',
        label: 'О нас',
        icon: <Users className="w-4 h-4" />
      },
      {
        id: 'timeline',
        label: 'Таймлайн',
        icon: <Clock className="w-4 h-4" />
      }
    ];

    // Добавляем дашборд только для авторизованных пользователей
    if (isAuthenticated) {
      baseViews.unshift({
        id: 'dashboard',
        label: 'Привет!',
        icon: <Home className="w-4 h-4" />
      });
    }

    return baseViews;
  };

  const views = getAvailableViews();

  // Если пользователь не авторизован и пытается открыть дашборд, перенаправляем на "О нас"
  useEffect(() => {
    if (!isAuthenticated && activeView === 'dashboard') {
      setActiveView('about');
    }
  }, [isAuthenticated, activeView]);

  const handleViewChange = (viewId) => {
    setActiveView(viewId);
    const routes = {
      dashboard: '/home/hello',
      about: '/home/team-a',
      timeline: '/home/timeline'
    };
    navigate(routes[viewId]);
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка данных...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView employees={employees} products={products} vacations={vacations} topRating={topRating} />;
      case 'about':
        return <AboutView products={products} />;
      case 'timeline':
        return <TimelineView />;
      default:
        return <AboutView products={products} />;
    }
  };

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Верхний блок */}
      <div className="flex items-center justify-between mb-6 gap-2 sm:gap-4 md:gap-8 flex-wrap">
        <h1 className="text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Корпоративный портал</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-2 bg-gray rounded-[12px] p-1 flex-wrap">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => handleViewChange(view.id)}
                className={`flex items-center px-4 py-2 rounded-[8px] font-medium text-sm transition select-none
                  ${activeView === view.id ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
              >
                {view.icon}
                <span className="ml-[5px]">{view.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {renderView()}
    </div>
  );
} 