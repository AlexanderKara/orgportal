import React, { useState } from 'react';
import { Users, Clock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from './ui/PageHeader';
import ViewSwitcher from './ui/ViewSwitcher';

// Компонент "О нас" для публичного доступа
const AboutView = () => {
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
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-[12px] mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">CRM-система</h4>
            <p className="text-sm text-gray-600">Управление клиентами и продажами</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-[12px] mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🏖️</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Приложение отпусков</h4>
            <p className="text-sm text-gray-600">Управление отпусками сотрудников</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-[12px] mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Аналитическая платформа</h4>
            <p className="text-sm text-gray-600">Анализ данных и отчетность</p>
          </div>
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
      title: 'Запуск приложения отпусков в релиз',
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
      title: 'Обновление CRM-системы',
      description: 'Вышла новая версия системы управления клиентами',
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
      title: 'Аналитическая платформа получила награду',
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

export default function PublicLanding() {
  const [activeView, setActiveView] = useState('about');
  const navigate = useNavigate();

  const views = [
    {
      id: 'about',
      label: 'Кто мы',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'timeline',
      label: 'Что происходит?',
      icon: <Clock className="w-4 h-4" />
    }
  ];

  const renderView = () => {
    switch (activeView) {
      case 'about':
        return <AboutView />;
      case 'timeline':
        return <TimelineView />;
      default:
        return <AboutView />;
    }
  };

  return (
    <div className="w-full max-w-none mx-auto pt-[70px]">
      {/* Заголовок страницы */}
      <PageHeader 
        title="Портал Team-A"
        subtitle="Добро пожаловать в нашу команду"
        actions={
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
          >
            <LogIn className="w-4 h-4" />
            <span>Войти</span>
          </button>
        }
      >
        <ViewSwitcher
          views={views}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      </PageHeader>
      
      {/* Контент */}
      {renderView()}
    </div>
  );
} 