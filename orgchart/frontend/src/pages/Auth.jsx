import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, MessageCircle, ArrowLeft, CheckCircle, AlertCircle, X } from 'lucide-react';
import { ParticlesBackground } from '../components/ParticlesBackground';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Auth() {
  const [login, setLogin] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [rememberedUser, setRememberedUser] = useState(null);
  const [countdown, setCountdown] = useState(60); // 60 секунд = 1 минута
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  // expanded: 'left' | 'right' — какая кнопка развернута
  const [expanded, setExpanded] = useState('left'); // левая всегда активна
  const [showLeftText, setShowLeftText] = useState(true);
  const [showRightText, setShowRightText] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [inputAltLoginRight, setInputAltLoginRight] = useState('');

  // Проверяем сохраненного пользователя при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setRememberedUser(user);
        setLogin(user.login);
      } catch (error) {
        console.error('Error parsing remembered user:', error);
        localStorage.removeItem('rememberedUser');
      }
    }
  }, []);

  // Автоматическая верификация при заполнении всех полей
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 4 && isCodeSent) {
      handleVerifyCode();
    }
  }, [code, isCodeSent]);

  // Обратный отсчет для кода
  useEffect(() => {
    let interval = null;
    
    if (isCountdownActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsCountdownActive(false);
            // Когда таймер заканчивается, возвращаемся к форме ввода логина
            handleBackToLogin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isCountdownActive, countdown]);

  // Состояние для анимации переключения способов
  const [expandedSecondary, setExpandedSecondary] = useState(false);
  const [showSecondaryText, setShowSecondaryText] = useState(false);
  const [showMainText, setShowMainText] = useState(true);

  // Определяем тип введенного логина
  const getLoginType = (value) => {
    if (value.startsWith('@') || value.includes('t.me/')) return 'telegram';
    if (value.includes('@')) return 'email';
    return 'unknown';
  };

  // Валидация email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Валидация telegram
  const isValidTelegram = (telegram) => {
    return telegram.startsWith('@') || telegram.includes('t.me/');
  };

  // Проверка валидности введенного логина
  const isLoginValid = () => {
    if (!login.trim()) return false;
    const loginType = getLoginType(login);
    if (loginType === 'email') return isValidEmail(login);
    if (loginType === 'telegram') return isValidTelegram(login);
    return false;
  };

  // Определяем второй способ авторизации
  const getSecondaryType = () => {
    if (!rememberedUser) return null;
    return rememberedUser.type === 'email' ? 'telegram' : 'email';
  };

  // Получить иконку по типу
  const getAuthIcon = (type, className = '', style = {}) => {
    if (type === 'email') {
      return <Mail className={className} style={{ color: '#222', ...style }} />;
    } else if (type === 'telegram') {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#222', ...style }}>
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
        </svg>
      );
    }
    return null;
  };

  // Получить надпись для вторичного способа
  const getSecondaryButtonText = () => {
    const type = getSecondaryType();
    if (type === 'email') return 'Прислать код на email';
    if (type === 'telegram') return 'Прислать код в Telegram';
    return '';
  };

  // Обработчик анимации
  const handleExpandSecondaryAuth = () => {
    setShowMainText(false); // Скрыть текст до анимации
    window.requestAnimationFrame(() => {
      setExpandedSecondary(true);
      setTimeout(() => setShowSecondaryText(true), 500);
    });
  };

  const handleCollapseSecondaryAuth = () => {
    setExpandedSecondary(false);
    setShowSecondaryText(false);
    setTimeout(() => {
      if (expandedSecondary) setShowMainText(true);
    }, 500);
  };

  // Обработка отправки кода
  const handleSendCode = async () => {
    setIsLoading(true);
    setNotification({ type: '', message: '' });

    const loginType = getLoginType(login);
    
    if (loginType === 'unknown') {
      setNotification({ 
        type: 'error', 
        message: 'Введите корректный email или аккаунт Telegram' 
      });
      setIsLoading(false);
      return;
    }

    if (loginType === 'email' && !isValidEmail(login)) {
      setNotification({ 
        type: 'error', 
        message: 'Почта введена некорректно' 
      });
      setIsLoading(false);
      return;
    }

    if (loginType === 'telegram' && !isValidTelegram(login)) {
      setNotification({ 
        type: 'error', 
        message: 'Аккаунт Telegram введен некорректно' 
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.sendCode(login);
      
      setIsCodeSent(true);
      setNotification({ 
        type: 'success', 
        message: response.message
      });
      
      // Запускаем обратный отсчет
      setCountdown(60);
      setIsCountdownActive(true);
      
      // Сохраняем пользователя для запоминания
      const userToRemember = {
        login: login,
        type: loginType
      };
      localStorage.setItem('rememberedUser', JSON.stringify(userToRemember));
      setRememberedUser(userToRemember);
      
      // Очищаем уведомление через 10 секунд
      setTimeout(() => {
        setNotification({ type: '', message: '' });
      }, 10000);
      
    } catch (error) {
      let errorMessage = error.message || 'Ошибка отправки кода. Попробуйте еще раз.';
      
      // Специальная обработка ошибки с ботом
      if (error.response?.data?.error === 'BOT_NOT_ADDED') {
        errorMessage = 'Бот не связан с аккаунтом. Перейдите к @atmsrvs_bot, запустите его командой /start и выполните команду/link.';
      }
      
      setNotification({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Универсальная отправка кода по login
  const handleSendCodeUniversal = async (login) => {
    setLogin(login);
    await handleSendCode();
  };

  // Обработка ввода кода
  const handleCodeChange = (index, value) => {
    // Ограничиваем ввод одной цифрой
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    
    // Проверяем, что это цифра
    if (!/^\d$/.test(value) && value !== '') return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Автоматический переход к следующему полю
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Автоматическая верификация будет вызвана через useEffect
  };

  // Обработка нажатия клавиш в полях кода
  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Если поле пустое, переходим к предыдущему
        const prevInput = document.getElementById(`code-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          // Очищаем предыдущее поле
          const newCode = [...code];
          newCode[index - 1] = '';
          setCode(newCode);
        }
      } else if (code[index]) {
        // Если в поле есть символ, очищаем его
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  // Обработка вставки из буфера обмена
  const handleCodePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Проверяем, что вставлены 4 цифры
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      
      // Автоматическая верификация будет вызвана через useEffect
    }
  };

  // Верификация кода
  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    
    // Проверяем, что код полный
    if (fullCode.length !== 4) {
      setNotification({
        type: 'error',
        message: 'Введите полный код из 4 цифр'
      });
      return;
    }
    
    setIsLoading(true);
    setNotification({ type: '', message: '' });

    try {
      const response = await api.verifyCode(login, fullCode);
      // Сохраняем токен и данные пользователя через AuthContext
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      // Получаем профиль сотрудника
      let employeeData = null;
      try {
        const me = await api.getMe();
        // Данные пользователя находятся в поле employee
        employeeData = me.employee || me;
      } catch (e) {
        console.error('Auth.jsx - Error getting user data:', e);
      }
      
      // Используем AuthContext для входа
      if (employeeData) {
        authLogin(response.token, employeeData);
      }
      
      // Обновляем rememberedUser с именем
      const userToRemember = {
        login: login,
        type: getLoginType(login),
        name: employeeData?.first_name || ''
      };
      localStorage.setItem('rememberedUser', JSON.stringify(userToRemember));
      setRememberedUser(userToRemember);

      // Перенаправление после успешного входа
      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect');
      const redirectTo = redirectParam || location.state?.from || '/home/hello';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      // Очищаем код при неправильном вводе
      setCode(['', '', '', '']);
      
      // Показываем ошибку
      setNotification({
        type: 'error',
        message: error.message || 'Код введен неверно. Попробуйте еще раз.'
      });
      
      // Очищаем уведомление через 5 секунд
      setTimeout(() => {
        setNotification({ type: '', message: '' });
      }, 5000);
      
      // Фокусируемся на первом поле кода
      const firstInput = document.getElementById('code-0');
      if (firstInput) {
        firstInput.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Возврат к вводу логина
  const handleBackToLogin = () => {
    setIsCodeSent(false);
    setCode(['', '', '', '']);
    setNotification({ type: '', message: '' });
    setIsCountdownActive(false);
    setCountdown(60);
  };

  // Сброс запомненного пользователя
  const handleResetUser = () => {
    localStorage.removeItem('rememberedUser');
    setRememberedUser(null);
    setLogin('');
    setIsCodeSent(false);
    setCode(['', '', '', '']);
    setNotification({ type: '', message: '' });
  };

  // Получаем отображаемое имя пользователя
  const getDisplayName = () => {
    if (!rememberedUser) return '';
    if (rememberedUser.name) return rememberedUser.name;
    if (rememberedUser.type === 'email') {
      return rememberedUser.login;
    } else if (rememberedUser.type === 'telegram') {
      const telegram = rememberedUser.login.startsWith('@') ? rememberedUser.login : `@${rememberedUser.login}`;
      // Извлекаем имя пользователя без @
      const username = telegram.replace('@', '');
      return username;
    }
    return rememberedUser.login;
  };

  // Форматирование времени для обратного отсчета
  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Получаем текст для кнопки
  const getButtonText = () => {
    if (!rememberedUser) return 'Прислать код';
    
    if (rememberedUser.type === 'email') {
      return `Прислать код на ${rememberedUser.login}`;
    } else if (rememberedUser.type === 'telegram') {
      return `Прислать код в Telegram`;
    }
    return 'Прислать код';
  };

  // Проверяем, нужно ли показывать футер с Telegram
  const shouldShowTelegramFooter = () => {
    if (rememberedUser && rememberedUser.type === 'telegram') return true;
    if (login.startsWith('@')) return true;
    return false;
  };

  // Определяем параметры для левой и правой кнопки
  const leftExpanded = expanded === 'left';
  const rightExpanded = expanded === 'right';
  const leftCollapsed = !leftExpanded && !isAnimating;
  const rightCollapsed = !rightExpanded && !isAnimating;

  // Текст для кнопок
  const leftText = leftExpanded ? getButtonText() : getSecondaryButtonText();
  const rightText = getSecondaryButtonText();
  const leftIcon = leftExpanded ? getAuthIcon(rememberedUser?.type, 'w-6 h-6', { color: '#222' }) : getAuthIcon(getSecondaryType(), 'w-6 h-6', { color: '#222' });
  const rightIcon = getAuthIcon(getSecondaryType(), 'w-6 h-6', { color: '#222' });

  // Переключение expand
  const handleExpand = (side) => {
    setIsAnimating(true);
    setShowLeftText(false);
    setShowRightText(false);
    window.requestAnimationFrame(() => {
      setExpanded(side);
      setTimeout(() => {
        setIsAnimating(false);
        if (side === 'left') setShowLeftText(true);
        if (side === 'right') setShowRightText(true);
      }, 500);
    });
  };

  // Для футера: показывать если активная кнопка — Telegram или вводится @
  const isActiveTelegramButton =
    (expanded === 'left' && rememberedUser?.type === 'telegram') ||
    (expanded === 'right' && getSecondaryType() === 'telegram') ||
    (!rememberedUser && login.startsWith('@'));

  // Для альтернативного способа
  const altLoginRight = rememberedUser?.type === 'email' ? (rememberedUser?.telegram || '') : (rememberedUser?.email || '');

  // Обработчик подтверждения альтернативного логина
  const handleConfirmAltLogin = async (value) => {
    if (!value) return;
    
    const loginType = getLoginType(value);
    if (loginType === 'unknown') {
      setNotification({ 
        type: 'error', 
        message: 'Введите корректный email или аккаунт Telegram' 
      });
      return;
    }
    
    if (loginType === 'email' && !isValidEmail(value)) {
      setNotification({ 
        type: 'error', 
        message: 'Почта введена некорректно' 
      });
      return;
    }
    
    if (loginType === 'telegram' && !isValidTelegram(value)) {
      setNotification({ 
        type: 'error', 
        message: 'Аккаунт Telegram введен некорректно' 
      });
      return;
    }
    
    const updated = { ...rememberedUser };
    if (rememberedUser?.type === 'email') {
      updated.telegram = value;
    } else {
      updated.email = value;
    }
    setRememberedUser(updated);
    
    // Отправляем код напрямую с правильным типом
    setIsLoading(true);
    setNotification({ type: '', message: '' });
    
    try {
      const response = await api.sendCode(value);
      
      setIsCodeSent(true);
      setNotification({ 
        type: 'success', 
        message: response.message
      });
      
      // Запускаем обратный отсчет
      setCountdown(60);
      setIsCountdownActive(true);
      
      // Очищаем уведомление через 10 секунд
      setTimeout(() => {
        setNotification({ type: '', message: '' });
      }, 10000);
      
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error.message || 'Ошибка отправки кода. Попробуйте еще раз.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setExpanded('left'); // левая кнопка всегда активна при старте
  }, [rememberedUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Particles Background */}
      <ParticlesBackground enabled={true} isDark={false} />

      <div className="backdrop-blur-sm bg-white/20 border border-white/20 rounded-[20px] shadow-2xl p-6 sm:p-8 w-full max-w-md mx-4 min-h-[500px] flex flex-col justify-between relative z-10">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {/* Кнопка закрытия */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          {/* Логотип */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path d="M29.447 25.4667C27.3177 31.6767 20.2319 35.6873 14.2718 33.4566C8.33703 31.2353 5.29109 24.7463 7.34687 18.8441C7.40891 18.666 7.60843 18.5764 7.78635 18.643L10.0415 19.4871C10.2194 19.5537 10.3083 19.751 10.2473 19.9294C8.54458 24.9034 11.1179 30.3563 16.116 32.227C21.1396 34.1072 26.7904 30.1028 28.8073 25.2064C28.8733 25.0463 29.0945 25.0104 29.2691 25.0757C29.4051 25.1266 29.5014 25.3332 29.447 25.4667Z" fill="currentColor"/>
                <path d="M23.6505 25.0223C25.1363 20.8471 22.9764 16.2356 18.7598 14.6574C14.5929 13.0978 9.95558 15.076 8.23293 19.0846C8.15843 19.258 8.2487 19.4555 8.42662 19.5221L9.83369 20.0488C10.0116 20.1154 10.2096 20.026 10.2854 19.8532C11.7574 16.4983 15.6554 14.849 19.1596 16.1605C22.7135 17.4907 23.9912 21.3504 23.0016 24.6836C22.9678 24.7798 22.9356 25.0223 23.1995 25.1411C23.3339 25.2015 23.5954 25.1772 23.6505 25.0223Z" fill="currentColor"/>
                <path d="M21.2575 7.89493C29.7659 10.158 34.9297 18.755 32.8236 27.2748C32.1983 29.8046 31.0013 32.047 29.4022 33.9002C29.3262 33.9883 29.2018 34.0176 29.0932 33.9744L26.1435 32.8012C25.944 32.7219 25.9084 32.4559 26.076 32.3224C28.3458 30.5144 30.0555 27.9797 30.8018 24.9607C32.5769 17.7798 28.2401 10.5339 21.0831 8.5994C20.8883 8.54673 20.767 8.35082 20.8151 8.15647C20.8631 7.96212 21.0624 7.84304 21.2575 7.89493Z" fill="currentColor"/>
                <path d="M18.7678 8.99095C18.8439 9.19606 19.1423 9.19606 19.2184 8.99095L19.8348 7.33108C19.9139 7.11799 20.0848 6.94913 20.3027 6.86879L21.9803 6.25015C22.1864 6.17413 22.1864 5.89062 21.9803 5.8146L20.3027 5.19596C20.0848 5.11562 19.9139 4.94676 19.8348 4.73367L19.2184 3.0738C19.1423 2.86869 18.8439 2.86869 18.7678 3.0738L18.1514 4.73367C18.0723 4.94676 17.9014 5.11562 17.6835 5.19597L16.0059 5.8146C15.7998 5.89062 15.7998 6.17414 16.0059 6.25015L17.6835 6.86879C17.9014 6.94913 18.0723 7.11799 18.1514 7.33108L18.7678 8.99095Z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Портал Team-A</h1>
          </div>

          {/* Форма ввода логина */}
          {!isCodeSent ? (
            <div className="space-y-4 w-full">
              {rememberedUser ? (
                <div className="space-y-4 w-full">
                  <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900">Привет, {getDisplayName()}</h2>
                  </div>
                  <div className="flex flex-row items-center gap-2 w-full justify-center h-12">
                    {/* Левая кнопка */}
                    <button
                      type="button"
                      className={`h-12 rounded-[8px] flex items-center justify-center transition-all duration-500 ease-in-out font-medium
                        ${leftExpanded ? 'flex-[2] bg-primary text-white border-none hover:bg-primary/90 hover:scale-[1.02] px-4' : 'w-12 flex-none bg-white text-primary border-corporate-gray shadow-none hover:scale-105'}
                      `}
                      style={{ minWidth: leftExpanded ? '120px' : '48px', fontSize: '1.1rem', boxShadow: leftExpanded ? undefined : 'none' }}
                      onClick={async () => {
                        if (!leftExpanded) { handleExpand('left'); return; }
                        await handleSendCodeUniversal(rememberedUser?.login);
                      }}
                      aria-label={leftExpanded ? leftText : 'Сменить способ авторизации'}
                      disabled={isLoading && leftExpanded}
                    >
                      {leftExpanded && showLeftText ? leftText : leftCollapsed ? leftIcon : null}
                    </button>
                    {/* Правая кнопка */}
                    {rightExpanded && !altLoginRight ? (
                      <input
                        type="text"
                        className="h-12 rounded-[8px] px-4 border border-gray-300 text-base font-medium bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary flex-[2]"
                        style={{ minWidth: '120px', fontSize: '1.1rem' }}
                        placeholder={rememberedUser?.type === 'email' ? '@username' : 'email'}
                        value={inputAltLoginRight}
                        onChange={e => setInputAltLoginRight(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleConfirmAltLogin(inputAltLoginRight);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        className={`h-12 rounded-[8px] flex items-center justify-center transition-all duration-500 ease-in-out font-medium
                          ${rightExpanded ? 'flex-[2] bg-primary text-white border-none hover:bg-primary/90 hover:scale-[1.02] px-4' : 'w-12 flex-none bg-white text-primary border-corporate-gray shadow-none hover:scale-105'}
                        `}
                        style={{ minWidth: rightExpanded ? '120px' : '48px', fontSize: '1.1rem', boxShadow: rightExpanded ? undefined : 'none' }}
                        onClick={async () => {
                          if (!rightExpanded) { handleExpand('right'); return; }
                          await handleSendCodeUniversal(altLoginRight);
                        }}
                        aria-label={rightExpanded ? rightText : 'Сменить способ авторизации'}
                        disabled={isLoading && rightExpanded}
                      >
                        {rightExpanded && showRightText ? rightText : rightCollapsed ? rightIcon : null}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleResetUser}
                    className="w-full text-red-500 text-sm hover:text-red-700 transition-colors"
                  >
                    Это не вы?
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative transition-all duration-300 ease-in-out animate-fade-in">
                    <input
                      type="text"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="Введите email или @username"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out hover:border-primary/50 focus:scale-[1.02] placeholder-gray-600"
                      onKeyPress={(e) => e.key === 'Enter' && isLoginValid() && handleSendCode()}
                      autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-200 ease-in-out">
                      {getLoginType(login) === 'email' ? (
                        <Mail className="w-5 h-5 text-gray-400 transition-all duration-200 ease-in-out" />
                      ) : getLoginType(login) === 'telegram' ? (
                        <svg className="w-5 h-5 text-gray-400 transition-all duration-200 ease-in-out" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                        </svg>
                      ) : null}
                    </div>
                  </div>

                  {isLoginValid() && (
                    <button
                      onClick={handleSendCode}
                      disabled={isLoading}
                      className="w-full bg-primary text-white py-3 rounded-[12px] font-medium transition-all duration-300 ease-in-out hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] mt-4"
                    >
                      {isLoading ? 'Отправка...' : 'Прислать код'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Форма ввода кода */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Введите код</h2>
                <button
                  onClick={handleBackToLogin}
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <div 
                className="flex gap-3 justify-center transition-all duration-300 ease-in-out animate-slide-in" 
                onPaste={handleCodePaste}
                tabIndex={-1}
              >
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-bold bg-white border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out hover:border-primary/50 focus:scale-105"
                    placeholder=""
                    autoComplete="off"
                  />
                ))}
              </div>

              <p className="text-sm text-gray-500 text-center">
                {isCountdownActive ? (
                  <span className="font-mono">
                    Код действителен: {formatCountdown(countdown)}
                  </span>
                ) : (
                  "Код действителен в течение 1 минуты"
                )}
              </p>
            </div>
          )}

          {/* Адаптивная область уведомлений */}
          {notification.message && (
            <div className="mt-4 flex items-start transition-all duration-300 ease-in-out">
              <div className={`w-full p-3 rounded-[8px] flex items-start gap-2 transition-all duration-300 ease-in-out animate-fade-in backdrop-blur-sm ${
                notification.type === 'success' 
                  ? 'bg-green-50/80 text-green-700 border border-green-200/50' 
                  : notification.type === 'error'
                  ? 'bg-red-50/80 text-red-700 border border-red-200/50'
                  : 'bg-blue-50/80 text-blue-700 border border-blue-200/50'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 transition-all duration-200 ease-in-out" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 transition-all duration-200 ease-in-out" />
                ) : (
                  <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0 transition-all duration-200 ease-in-out" />
                )}
                <span className="text-sm leading-relaxed transition-all duration-200 ease-in-out">{notification.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Футер с Telegram */}
        <div className="flex items-center justify-center min-h-[28px]">
          {isActiveTelegramButton && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
              <a 
                href="https://t.me/atmsrvs_bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-800 transition-colors cursor-pointer"
              >
                настройка бота авторизации
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 