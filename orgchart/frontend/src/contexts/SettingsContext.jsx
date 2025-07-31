import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export { SettingsContext };

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  const [settings, setSettings] = useState({
    showAnalytics: true,
    notifications: true,
    darkMode: false,
    language: 'ru',
    showHelmetOverlay: true,
    avatarOverlay: 'helmet', // 'helmet' или 'roundstar'
    // Настройки сервисов
    notification_service_enabled: false,
    token_distribution_service_enabled: false,
    meeting_room_service_enabled: false
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Загружаем API настройки и localStorage параллельно
      const [apiSettings, savedSettings] = await Promise.all([
        isAuthenticated ? api.getAppSettings().catch(() => ({})) : Promise.resolve({}),
        Promise.resolve(localStorage.getItem('appSettings'))
      ]);
      
      // Парсим localStorage настройки
      let localSettings = {};
      if (savedSettings) {
        try {
          localSettings = JSON.parse(savedSettings);
        } catch (error) {
          console.error('Error parsing localStorage settings:', error);
        }
      }

      // Объединяем настройки: API имеет приоритет, затем localStorage
      const mergedSettings = {
        ...settings, // значения по умолчанию
        ...localSettings, // localStorage
        ...apiSettings // API (высший приоритет)
      };

      setSettings(mergedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback к localStorage
      try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (localError) {
        console.error('Error loading settings from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    
    // Сохраняем в localStorage для обратной совместимости
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    
    // Сохраняем в API только сервисные настройки для авторизованных пользователей
    if (isAuthenticated) {
      try {
        const serviceSettings = {
          notification_service_enabled: newSettings.notification_service_enabled,
          token_distribution_service_enabled: newSettings.token_distribution_service_enabled,
          meeting_room_service_enabled: newSettings.meeting_room_service_enabled
        };

        // Выполняем все API вызовы параллельно
        const updatePromises = Object.entries(serviceSettings)
          .filter(([key, value]) => value !== undefined)
          .map(([key, value]) => api.updateAppSetting(key, value, 'boolean'));

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      } catch (error) {
        console.error('Error saving settings to API:', error);
      }
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Сохраняем в localStorage
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    
    // Если это сервисная настройка и пользователь авторизован, сохраняем в API
    const serviceKeys = [
      'notification_service_enabled',
      'token_distribution_service_enabled', 
      'meeting_room_service_enabled'
    ];
    
    if (serviceKeys.includes(key) && value !== undefined && isAuthenticated) {
      try {
        await api.updateAppSetting(key, value, 'boolean');
      } catch (error) {
        console.error('Error saving setting to API:', error);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      updateSetting, 
      loading,
      reloadSettings: loadSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}; 