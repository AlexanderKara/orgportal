import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, MessageCircle, ArrowLeft, CheckCircle, AlertCircle, X } from 'lucide-react';
import { ParticlesBackground } from '../components/ParticlesBackground';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { showNotification } from '../utils/notifications';

export default function Auth() {
  const [login, setLogin] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberedUser, setRememberedUser] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  // Состояние для управления переворотом карточки
  const [isFlipped, setIsFlipped] = useState(false);

  // expanded: 'left' | 'right' — какая кнопка развернута
  const [expanded, setExpanded] = useState('left');
  const [showLeftText, setShowLeftText] = useState(true);
  const [showRightText, setShowRightText] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [inputAltLoginRight, setInputAltLoginRight] = useState('');

  // Ref для Telegram Widget
  const telegramWrapperRef = useRef(null);

  // Callback функция для Telegram авторизации
  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      try {
        
        const response = await fetch('/api/auth/telegram-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url,
            auth_date: user.auth_date,
            hash: user.hash
          })
        });

        const data = await response.json();
        
        if (data.success) {
          localStorage.setItem('token', data.token);
          await authLogin(data.token, data.employee || data.user);
          navigate('/home');
        } else {
          showNotification(data.message || 'Ошибка авторизации через Telegram', 'error');
        }
      } catch (error) {
        console.error('Telegram auth error:', error);
        showNotification('Ошибка авторизации через Telegram', 'error');
      }
    };
  }, [authLogin, navigate]);

  // Динамическое создание Telegram Widget
  useEffect(() => {
    if (telegramWrapperRef.current) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'atmsrvs_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '20');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      
      telegramWrapperRef.current.appendChild(script);
    }
  }, []);

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

  // Функция для управления переворотом карточки (только горизонтальный)
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Обработчик кликов по карточке для переворота
  useEffect(() => {
    const handleCardClick = (e) => {
      // Проверяем, что клик не по кнопкам, инпутам или виджету
      if (!e.target.closest('button') && 
          !e.target.closest('input') && 
          !e.target.closest('a') && 
          !e.target.closest('iframe') &&
          !e.target.closest('[data-telegram-login]') &&
          !e.target.closest('.telegram-login-widget') &&
          !e.target.closest('script') &&
          !e.target.closest('div[style*="telegram"]') &&
          !e.target.closest('div[style*="Telegram"]')) {
        handleFlip();
      }
    };

    const cardElement = document.querySelector('.flip-card');
    if (cardElement) {
      cardElement.addEventListener('click', handleCardClick);
    }

    return () => {
      if (cardElement) {
        cardElement.removeEventListener('click', handleCardClick);
      }
    };
  }, [isFlipped]); // Добавляем isFlipped в зависимости

  const getLoginType = (value) => {
    if (value.includes('@') && value.includes('.')) return 'email';
    if (value.startsWith('@')) return 'telegram';
    return 'unknown';
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidTelegram = (telegram) => {
    return /^@[a-zA-Z0-9_]{5,}$/.test(telegram);
  };

  const isLoginValid = () => {
    if (!login.trim()) return false;
    const type = getLoginType(login);
    if (type === 'email') return isValidEmail(login);
    if (type === 'telegram') return isValidTelegram(login);
    return false;
  };

  const getSecondaryType = () => {
    if (!rememberedUser) return 'unknown';
    return rememberedUser.type === 'email' ? 'telegram' : 'email';
  };

  const getAuthIcon = (type, className = '', style = {}) => {
    if (type === 'email') {
      return <Mail className={className} style={style} />;
    } else if (type === 'telegram') {
      return <MessageCircle className={className} style={style} />;
    }
    return null;
  };

  const getSecondaryButtonText = () => {
    const type = getSecondaryType();
    if (type === 'email') return 'Email';
    if (type === 'telegram') return 'Telegram';
    return 'Другой способ';
  };

  const handleExpandSecondaryAuth = () => {
    setExpanded('right');
    setShowRightText(true);
    setShowLeftText(false);
  };

  const handleCollapseSecondaryAuth = () => {
    setExpanded('left');
    setShowRightText(false);
    setShowLeftText(true);
  };

  const handleSendCode = async () => {
    if (!isLoginValid()) {
      showNotification('Введите корректный email или аккаунт Telegram', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.sendCode(login);
      
      setIsCodeSent(true);
      showNotification(response.message || 'Код отправлен на ваш email или Telegram', 'success');
      
      setCountdown(60);
      setIsCountdownActive(true);
      
    } catch (error) {
      showNotification(error.message || 'Ошибка отправки кода. Попробуйте еще раз.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCodeUniversal = async (login) => {
    return api.sendCode(login);
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    // Автоматическая отправка кода при вводе последнего символа
    if (value && index === 5) {
      setTimeout(() => {
        const finalCode = newCode.join('');
        console.log('Автоматическая отправка кода:', finalCode);
        if (finalCode.length === 6) {
          handleVerifyCodeWithCode(finalCode);
        }
      }, 100);
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numbers = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (numbers.length === 6) {
      const newCode = numbers.split('');
      setCode(newCode);
      
      // Автоматическая отправка кода при вставке
      setTimeout(() => {
        console.log('Автоматическая отправка кода при вставке:', numbers);
        handleVerifyCodeWithCode(numbers);
      }, 100);
    }
  };

  const handleVerifyCodeWithCode = async (fullCode) => {
    console.log('handleVerifyCodeWithCode вызвана с кодом:', fullCode);
    console.log('login:', login);
    if (fullCode.length !== 6) return;

    setIsLoading(true);

    try {
      const response = await api.verifyCode(login, fullCode);
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        
        if (rememberedUser) {
          localStorage.setItem('rememberedUser', JSON.stringify(rememberedUser));
        }
        
        await authLogin(response.token, response.employee || response.user);
        navigate('/home');
      } else {
        showNotification(response.message || 'Неверный код', 'error');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (error) {
      showNotification(error.message || 'Ошибка верификации кода', 'error');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setIsLoading(true);

    try {
      const response = await api.verifyCode(login, fullCode);
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        
        if (rememberedUser) {
          localStorage.setItem('rememberedUser', JSON.stringify(rememberedUser));
        }
        
        await authLogin(response.token, response.employee || response.user);
        navigate('/home');
      } else {
        showNotification(response.message || 'Неверный код', 'error');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (error) {
      showNotification(error.message || 'Ошибка верификации кода', 'error');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsCodeSent(false);
    setCode(['', '', '', '', '', '']);
    setIsCountdownActive(false);
    setCountdown(60);
  };

  const handleResetUser = () => {
    setRememberedUser(null);
    setLogin('');
    localStorage.removeItem('rememberedUser');
    setExpanded('left');
    setShowLeftText(true);
    setShowRightText(false);
  };

  const getDisplayName = () => {
    if (!rememberedUser) return '';
    return rememberedUser.first_name || rememberedUser.login || 'Пользователь';
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonText = () => {
    if (isLoading) return 'Отправка...';
    if (isCodeSent) return 'Отправить снова';
    return 'Получить код';
  };

  const shouldShowTelegramFooter = () => {
    if (!rememberedUser) return login.startsWith('@');
    return rememberedUser.type === 'telegram' || 
           (expanded === 'right' && getSecondaryType() === 'telegram');
  };

  const handleExpand = (side) => {
    if (side === 'left') {
      setExpanded('left');
      setShowLeftText(true);
      setShowRightText(false);
    } else {
      setExpanded('right');
      setShowRightText(true);
      setShowLeftText(false);
    }
  };

  const handleConfirmAltLogin = async (value) => {
    if (!value.trim()) {
      showNotification('Введите значение', 'error');
      return;
    }
    
    const loginType = getLoginType(value);
    
    if (loginType === 'email' && !isValidEmail(value)) {
      showNotification('Почта введена некорректно', 'error');
      return;
    }
    
    if (loginType === 'telegram' && !isValidTelegram(value)) {
      showNotification('Аккаунт Telegram введен некорректно', 'error');
      return;
    }
    
    const updated = { ...rememberedUser };
    if (rememberedUser?.type === 'email') {
      updated.telegram = value;
    } else {
      updated.email = value;
    }
    setRememberedUser(updated);
    
    setIsLoading(true);
    
    try {
      const response = await api.sendCode(value);
      
      setIsCodeSent(true);
      showNotification(response.message || 'Код отправлен на ваш email или Telegram', 'success');
      
      setCountdown(60);
      setIsCountdownActive(true);
      
    } catch (error) {
      showNotification(error.message || 'Ошибка отправки кода. Попробуйте еще раз.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setExpanded('left');
  }, [rememberedUser]);

  return (
          <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Particles Background */}
      <ParticlesBackground enabled={true} isDark={false} />

      {/* Разворачивающаяся карточка */}
      <div className="flip-card w-full max-w-md mx-4 h-[500px] perspective-1000 rounded-[20px] border border-white/30 relative z-50 backdrop-blur-sm">
        <div 
          className="flip-card-inner relative w-full h-[500px] transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Лицевая сторона - существующая форма авторизации */}
          <div className="flip-card-front absolute w-full h-[500px]">
            <div className="rounded-[20px] shadow-2xl p-6 sm:p-8 w-full h-full flex flex-col justify-between relative z-10 backdrop-blur-sm">
              <div className="flex-1 flex flex-col items-center justify-center w-full">
                {/* Кнопка закрытия */}
                <button
                  onClick={() => navigate('/')}
                  className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20 z-20"
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
                            className={`h-12 rounded-[8px] flex items-center justify-center transition-all duration-500 ease-in-out font-medium ${
                              expanded === 'left'
                                ? 'bg-primary text-white shadow-lg scale-105'
                                : 'bg-white/30 text-gray-600 hover:bg-white/50'
                            }`}
                            onClick={() => handleExpand('left')}
                            style={{ flex: showLeftText ? 1 : 0.3 }}
                          >
                            <div className="flex items-center gap-2">
                              {getAuthIcon(rememberedUser.type, 'w-5 h-5')}
                              <span className={`transition-all duration-500 ${showLeftText ? 'opacity-100' : 'opacity-0'}`}>
                                {rememberedUser.type === 'email' ? 'Email' : 'Telegram'}
                              </span>
                            </div>
                          </button>

                          {/* Правая кнопка */}
                          <button
                            type="button"
                            className={`h-12 rounded-[8px] flex items-center justify-center transition-all duration-500 ease-in-out font-medium ${
                              expanded === 'right'
                                ? 'bg-primary text-white shadow-lg scale-105'
                                : 'bg-white/30 text-gray-600 hover:bg-white/50'
                            }`}
                            onClick={() => handleExpand('right')}
                            style={{ flex: showRightText ? 1 : 0.3 }}
                          >
                            <div className="flex items-center gap-2">
                              {getAuthIcon(getSecondaryType(), 'w-5 h-5')}
                              <span className={`transition-all duration-500 ${showRightText ? 'opacity-100' : 'opacity-0'}`}>
                                {getSecondaryButtonText()}
                              </span>
                            </div>
                          </button>
                        </div>

                        {/* Поле ввода для альтернативного способа */}
                        {expanded === 'right' && (
                          <div className="space-y-4 animate-slide-in">
                            <div className="relative">
                              <input
                                type="text"
                                value={inputAltLoginRight}
                                onChange={(e) => setInputAltLoginRight(e.target.value)}
                                placeholder={getSecondaryType() === 'email' ? 'Введите email' : 'Введите @username'}
                                className="w-full px-4 py-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/80"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleConfirmAltLogin(inputAltLoginRight);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleConfirmAltLogin(inputAltLoginRight)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-[6px] text-sm hover:bg-primary/90 transition-colors"
                              >
                                Отправить
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Кнопка отправки кода */}
                        <button
                          onClick={handleSendCode}
                          disabled={isLoading}
                          className="w-full bg-primary text-white py-3 px-4 rounded-[8px] font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {getButtonText()}
                        </button>

                        <button
                          onClick={handleResetUser}
                          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Войти под другим пользователем
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        <div className="relative">
                          <input
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="Email или @username"
                            className="w-full px-4 py-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/80"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSendCode();
                              }
                            }}
                          />
                        </div>

                        <button
                          onClick={handleSendCode}
                          disabled={isLoading || !isLoginValid()}
                          className="w-full bg-primary text-white py-3 px-4 rounded-[8px] font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {getButtonText()}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 w-full">
                    <div className="text-center">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Введите код</h2>
                      <p className="text-sm text-gray-600">
                        Код отправлен на {login}
                      </p>
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
                          className="w-12 h-12 text-center text-lg font-bold bg-white/80 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out hover:border-primary/50 focus:scale-105"
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


              </div>

              {/* Футер с Telegram */}
              <div className="flex items-center justify-center min-h-[28px]">
                {shouldShowTelegramFooter() && (
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

          {/* Тыльная сторона - Telegram Login Widget */}
          <div className="flip-card-back absolute w-full h-[500px]">
            <div className="rounded-[20px] shadow-2xl p-6 sm:p-8 w-full h-full flex flex-col justify-between relative z-10 backdrop-blur-sm">
              <div className="flex-1 flex flex-col items-center justify-center w-full">
                {/* Кнопка закрытия */}
                <button
                  onClick={() => navigate('/')}
                  className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20 z-20"
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

                {/* Telegram Login Widget */}
                <div className="w-full max-w-sm">
                  <div className="flex justify-center mb-6">
                    <div ref={telegramWrapperRef} className="telegram-login-widget"></div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Авторизуйтесь под виджетом
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
} 