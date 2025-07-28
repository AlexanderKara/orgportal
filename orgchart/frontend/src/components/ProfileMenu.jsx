import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, User, Shield, Users, UserCheck, Briefcase } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useRole } from './RoleProvider';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Avatar from './ui/Avatar';
import ReactDOM from 'react-dom';

const themes = [
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
];

// Функция для получения иконки роли
const getRoleIcon = (iconName) => {
  switch (iconName) {
    case 'shield': return <Shield className="w-4 h-4" />;
    case 'shield-check': return <Shield className="w-4 h-4" />;
    case 'users': return <Users className="w-4 h-4" />;
    case 'user-check': return <UserCheck className="w-4 h-4" />;
    case 'user': return <Users className="w-4 h-4" />;
    case 'user-group': return <Users className="w-4 h-4" />;
    case 'briefcase': return <Briefcase className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
};

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const { activeRole, setActiveRole } = useRole();
  const [activeTheme, setActiveTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef(null);
  const location = useLocation();
  const { userData, logout, loading: authLoading } = useAuth();
  
  const isProfilePage = location.pathname.startsWith('/account/');

  // Загружаем данные пользователя
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (userData) {
          setUser(userData);
          
          // Загружаем доступные роли пользователя
          if (userData?.adminRoles && userData.adminRoles.length > 0) {
            // Создаем массив ролей на основе adminRoles пользователя
            const userRoles = userData.adminRoles.map(role => ({
              id: role.id.toString(),
              label: role.name,
              icon: role.icon,
              color: role.color
            }));
            
            setAvailableRoles(userRoles);
            
            // Устанавливаем активную роль
            const savedRole = localStorage.getItem('activeRole');
            if (savedRole && userRoles.find(role => role.id === savedRole)) {
              setActiveRole(savedRole);
            } else if (userRoles.length > 0) {
              setActiveRole(userRoles[0].id);
              localStorage.setItem('activeRole', userRoles[0].id);
            }
          }
        }
      } catch (error) {
        // Ошибка загрузки пользователя
      } finally {
        setLoading(false);
      }
    };

    // Если AuthContext еще загружается, ждем
    if (authLoading) {
      setLoading(true);
      return;
    }

    loadUser();
    
    // Добавляем обработчик события обновления аватара
    const handleAvatarUpdate = () => {
      loadUser();
    };
    
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
    };
  }, [userData, authLoading]);

  // Получаем текущую активную роль
  const getCurrentRole = () => {
    if (activeRole && availableRoles.length > 0) {
      return availableRoles.find(role => role.id === activeRole);
    }
    return availableRoles.length > 0 ? availableRoles[0] : null;
  };

  const currentRole = getCurrentRole();

  // Проверяем, есть ли у пользователя роли
  const hasRoles = availableRoles.length > 0;

  // Обработчик клика вне меню
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        // Проверяем, что клик не был на элементе дропдауна
        const dropdownElement = document.querySelector('.profile-dropdown');
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setOpen(false);
        }
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  const handleMenuClose = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      // Ошибка выхода
    } finally {
      logout();
      window.location.href = '/';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center gap-3 py-[0.3rem] pl-[0.3rem] pr-2 lg:pr-4 rounded-[25px] min-w-[50px] lg:min-w-[180px]">
        <div className="w-[40px] h-[40px] rounded-full bg-gray-200 animate-pulse"></div>
        <div className="hidden lg:flex flex-col items-start text-left">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-16 mt-1"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef} style={{ position: 'relative', zIndex: 999999 }}>
      <button
        className={`flex items-center gap-3 py-[0.3rem] pl-[0.3rem] pr-2 lg:pr-4 rounded-[25px] min-w-[50px] lg:min-w-[180px] transition select-none group ${
          isProfilePage 
            ? 'bg-primary text-white' 
            : 'hover:bg-secondary hover:text-white'
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Профиль"
      >
        <Avatar
          src={user.avatar}
          name={`${user.first_name} ${user.last_name}`}
          size="40"
          roleInDept={user.department_role}
          clickable={false}
          onAvatarChange={undefined}
        />
        <span className="hidden lg:flex flex-col items-start text-left">
          <span className={`font-bold text-sm leading-tight transition-colors ${
            isProfilePage ? 'text-white' : 'text-dark group-hover:text-white'
          }`}>
            {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || user.last_name || user.email || 'Пользователь'
            }
          </span>
          <span className={`text-xs leading-tight transition-colors flex items-center gap-1 ${
            isProfilePage ? 'text-white/80' : 'text-gray-600 group-hover:text-white'
          }`}>
            {currentRole && (
              <>
                {getRoleIcon(currentRole.icon)}
                <span>{currentRole.label}</span>
              </>
            )}
            {!currentRole && 'Пользователь'}
          </span>
        </span>
        <ChevronDown className={`w-5 h-5 ml-auto transition-colors hidden sm:inline ${
          isProfilePage ? 'text-white' : 'text-gray-500'
        }`} />
      </button>
      {open && ReactDOM.createPortal(
        <div 
          className="fixed bg-white rounded-[15px] shadow-lg py-2 z-[999999] p-2 w-56 md:w-56 w-48 profile-dropdown"
          style={{
            top: menuRef.current ? menuRef.current.getBoundingClientRect().bottom + 8 : 0,
            right: menuRef.current ? window.innerWidth - menuRef.current.getBoundingClientRect().right : 0,
          }}
        >
          <Link
            to="/account/profile"
            className={`w-full text-left px-4 py-2 text-sm rounded-none flex items-center ${
              isProfilePage ? 'bg-primary text-white font-bold' : 'hover:bg-secondary hover:text-white'
            }`}
            onClick={handleMenuClose}
          >
            <User className="w-4 h-4 mr-2" />
            Личный кабинет
          </Link>
          <div className="border-t my-2" style={{borderColor: '#E5E7EB'}} />
          <div className="px-4 py-2 text-xs text-gray-500">Роли</div>
          {availableRoles.length > 0 ? (
            availableRoles.map((role) => (
              <button
                key={role.id}
                className={`w-full text-left px-4 py-2 text-sm rounded-none flex items-center gap-2 ${
                  activeRole === role.id 
                    ? 'bg-gray-200 text-dark font-bold' 
                    : 'hover:bg-secondary hover:text-white'
                }`}
                onClick={() => {
                  // Сохраняем новую роль
                  setActiveRole(role.id);
                  
                  // Очищаем кэш API
                  if (window.api && window.api.clearCache) {
                    window.api.clearCache();
                  }
                  
                  // Сохраняем все важные данные авторизации
                  const authData = {};
                  const keysToPreserve = ['token', 'user', 'auth', 'session', 'rememberedUser'];
                  
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && keysToPreserve.some(preserveKey => key.startsWith(preserveKey))) {
                      authData[key] = localStorage.getItem(key);
                    }
                  }
                  
                  // Очищаем только кэш и данные ролей, НЕ трогаем авторизацию
                  const keysToRemove = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && !keysToPreserve.some(preserveKey => key.startsWith(preserveKey))) {
                      keysToRemove.push(key);
                    }
                  }
                  
                  // Удаляем только ненужные ключи
                  keysToRemove.forEach(key => localStorage.removeItem(key));
                  
                  // Устанавливаем новую роль
                  localStorage.setItem('activeRole', role.id);
                  
                  // Отправляем событие о смене роли
                  window.dispatchEvent(new Event('role-change'));
                  
                  // Принудительно перезагружаем страницу для полной переинициализации
                  window.location.reload();
                  
                  handleMenuClose();
                }}
              >
                {getRoleIcon(role.icon)}
                <span>{role.label}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-400 italic">
              Роли не назначены
            </div>
          )}
          <div className="border-t my-2" style={{borderColor: '#E5E7EB'}} />
          <div className="px-4 py-2 text-xs text-gray-500">Тема</div>
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`w-full text-left px-4 py-2 text-sm rounded-none ${activeTheme === theme.id ? 'bg-gray-200 text-dark font-bold' : 'hover:bg-secondary hover:text-white'}`}
              onClick={() => {
                setActiveTheme(theme.id);
                handleMenuClose();
              }}
            >
              {theme.label}
            </button>
          ))}
          <div className="border-t my-2" style={{borderColor: '#E5E7EB'}} />
          <button 
            className="w-full text-left px-4 py-2 text-sm text-red-600 rounded-none hover:bg-secondary/30"
            onClick={handleLogout}
          >
            Выйти
          </button>
        </div>,
        document.body
      )}
    </div>
  );
} 