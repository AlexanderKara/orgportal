import React, { useMemo, useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Users, Package, Award, Calendar, Settings, LogIn } from 'lucide-react';
import ProfileMenu from './ProfileMenu';
import { useRole } from './RoleProvider';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../res/A_logo.svg?react';

const baseMenu = [
  { to: '/home/hello', icon: <Logo className="w-7 h-7" />, label: '' },
  { to: '/structure', icon: <Users className="w-5 h-5" />, label: 'Орг. схема' },
  { to: '/products', icon: <Package className="w-5 h-5" />, label: 'Продукты' },
  { to: '/competencies', icon: <Award className="w-5 h-5" />, label: 'Компетенции' },
  { to: '/vacations', icon: <Calendar className="w-5 h-5" />, label: 'Отпуска' },
];

const adminMenu = { to: '/admin', icon: <Settings className="w-5 h-5" />, label: 'Администрирование' };

function getScrollbarWidth() {
  if (typeof window === 'undefined') return 0;
  // Всегда измеряем ширину скроллбара
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);
  const inner = document.createElement('div');
  outer.appendChild(inner);
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  document.body.removeChild(outer);
  // Проверяем, есть ли скроллбар у окна
  const hasScrollbar = window.innerWidth > document.documentElement.clientWidth;
  return hasScrollbar ? scrollbarWidth : 0;
}

export default function Header() {
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  // Новый: компенсация скроллбара с учётом брейкпоинтов
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Вычисляем paddingLeft и paddingRight
  let paddingLeft = 16; // px-4 = 16px
  if (windowWidth >= 1024) paddingLeft = 70; // lg:px-[70px]
  let paddingRight = paddingLeft; // Делаем правый паддинг равным левому

  const { activeRole } = useRole();
  const { userData, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Authentication is now handled by AuthContext
  
  // Create menu based on user permissions
  const menu = useMemo(() => {
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
    const visibleSections = activeRoleData?.visible_sections || [];
    let menuItems = [...baseMenu];
    if (hasAdminRoles && activeRole && isAdminRoleActive && hasAdminPermissions) {
      menuItems.push(adminMenu);
    }
    return menuItems;
  }, [userData, activeRole]);

  // Новый флаг: есть ли кнопка администрирования
  const hasAdminMenu = menu.some(item => item.to === '/admin');

  // Новый: отслеживаем ширину окна для адаптива
  useEffect(() => {
    function updateScrollbarWidth() {
      const width = window.innerWidth;
      if (width >= 1340) {
        const scrollDiv = document.createElement('div');
        scrollDiv.style.width = '100px';
        scrollDiv.style.height = '100px';
        scrollDiv.style.overflow = 'scroll';
        scrollDiv.style.position = 'absolute';
        scrollDiv.style.top = '-9999px';
        document.body.appendChild(scrollDiv);
        const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        setScrollbarWidth(scrollbarWidth);
      } else {
        setScrollbarWidth(0);
      }
    }
    updateScrollbarWidth();
    window.addEventListener('resize', updateScrollbarWidth);
    return () => window.removeEventListener('resize', updateScrollbarWidth);
  }, []);

  // Определяем режим меню
  const isCompact = hasAdminMenu && windowWidth < 1340;

  return (
    <header
      className="fixed top-0 left-0 w-full bg-white z-[99999] flex items-center py-[30px]"
      style={{ paddingLeft, paddingRight }}
    >
      {isAuthenticated ? (
        <nav className={`flex items-center bg-gray rounded-[25px] px-1 pr-1 lg:px-2 lg:pr-1 py-1 min-h-[40px] gap-1`}> {/* px-1 и pr-1 для всех размеров, gap-1 между кнопками */}
          {/* Логотип всегда видимый */}
          <NavLink
            to={isAuthenticated ? "/home/hello" : "/"}
            className={({ isActive }) => {
              // Логотип всегда квадратный
              return `flex items-center justify-center px-0 py-0 rounded-[25px] font-medium text-sm transition select-none
                ${isActive
                  ? 'bg-primary text-white w-[40px] h-[40px] shadow-[0_0_8px_#D9D9D9]'
                  : 'bg-transparent text-dark hover:bg-secondary hover:text-white w-[40px] h-[40px] shadow-[0_0_8px_#D9D9D9]'}`;
            }}
          >
            <span className="flex items-center justify-center w-full h-full min-w-[40px] min-h-[40px] text-inherit">
              <Logo className="w-[450%] h-[450%] min-w-[40px] min-h-[40px] max-w-full max-h-full object-contain" />
            </span>
          </NavLink>
          {/* Остальная навигация только для авторизованных */}
          {isAuthenticated && menu.slice(1).map((item, i) => (
            <NavLink
              key={i + 1}
              to={item.to}
              className={({ isActive }) => {
                // Компакт: квадратные, gap-0, px-0, только иконка. Обычный: min-h, min-w, gap-1, px-4, иконка+текст.
                const isMobile = windowWidth < 768;
                const baseClasses = isCompact || isMobile
                  ? 'flex items-center justify-center gap-0 px-0 py-0 rounded-[25px] font-medium text-sm transition select-none w-[40px] h-[40px]'
                  : 'flex items-center justify-center gap-1 px-4 py-2 rounded-[25px] font-medium text-sm transition select-none min-h-[40px] min-w-[40px] xl:w-auto xl:h-auto';
                const stateClasses = isActive
                  ? 'bg-primary text-white'
                  : 'text-dark hover:bg-secondary hover:text-white';
                return `${baseClasses} ${stateClasses}`;
              }}
            >
              {item.icon}
              <span className={isCompact ? 'hidden' : 'hidden xl:inline'}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      ) : (
        <div className="flex items-center gap-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center justify-center px-0 py-0 w-[40px] h-[40px] transition select-none
              ${isActive
                ? 'bg-primary text-white rounded-[25px] shadow-[0_0_8px_#D9D9D9]'
                : 'hover:opacity-80'}`
            }
          >
            <Logo className="w-[450%] h-[450%] min-w-[40px] min-h-[40px] max-w-full max-h-full object-contain" />
          </NavLink>
          <span className="text-[24px] font-accent text-primary font-bold">A-Team</span>
        </div>
      )}
      <div className="flex-1" />
      <div className="ml-2 lg:ml-6">
        {isAuthenticated ? (
          <ProfileMenu />
        ) : isAuthenticated === null ? (
          // Показываем индикатор загрузки пока проверяется аутентификация
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[25px] font-medium text-sm transition hover:bg-primary/90"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden lg:inline">Войти</span>
          </button>
        )}
      </div>
    </header>
  );
} 