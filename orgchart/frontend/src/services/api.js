// Используем относительные пути для работы с прокси Vite
const API_BASE_URL = '';

console.log('API_BASE_URL from env:', import.meta.env.VITE_API_URL);
console.log('API_BASE_URL final:', API_BASE_URL);

// Кэш для API запросов
const cache = new Map();
const cacheTimeout = 5 * 60 * 1000; // 5 минут
const profileCacheTimeout = 10 * 60 * 1000; // 10 минут для профиля

// Throttling для API запросов
const requestQueue = new Map();
const throttleDelay = 1000; // 1 секунда между запросами

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('ApiService constructor - baseURL:', this.baseURL);
  }

  // Проверка кэша
  getFromCache(key) {
    const cached = cache.get(key);
    if (cached) {
      const now = Date.now();
      const age = now - cached.timestamp;
      
      // Проверяем возраст кэша с учетом TTL
      const maxAge = cached.ttl || cacheTimeout;
      
      if (age < maxAge) {
        return cached.data;
      } else {
        // Удаляем устаревший кэш
        cache.delete(key);
      }
    }
    
    // Проверяем localStorage для профиля и данных сотрудника
    if (key.includes('/api/auth/me') || key.includes('/employees/')) {
      try {
        const cacheKey = key.includes('/api/auth/me') ? 'profile_cache' : `employee_cache_${key.split('/').pop()}`;
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const cachedData = JSON.parse(stored);
          const now = Date.now();
          const age = now - cachedData.timestamp;
          
          // Проверяем возраст кэша с учетом TTL
          const maxAge = cachedData.ttl || (key.includes('/api/auth/me') ? 15 * 60 * 1000 : profileCacheTimeout);
          
          if (age < maxAge) {
            return cachedData.data;
          } else {
            // Удаляем устаревший кэш
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.warn('Error reading cache from localStorage:', error);
      }
    }
    
    return null;
  }

  // Сохранение в кэш
  setCache(key, data, ttl = 60000) {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl
    });
    
    // Сохраняем профиль и данные сотрудника в localStorage
    if (key.includes('/api/auth/me') || key.includes('/employees/')) {
      try {
        const cacheKey = key.includes('/api/auth/me') ? 'profile_cache' : `employee_cache_${key.split('/').pop()}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl: ttl
        }));
      } catch (e) {
        // Сохранение в localStorage
        localStorage.setItem(key, JSON.stringify({
          timestamp: Date.now(),
          data: data,
          ttl: ttl
        }));
      }
    }
  }

  // Throttling для предотвращения слишком частых запросов
  throttledRequests = new Map();

  // Улучшенный throttling с разными задержками для разных endpoints
  getThrottleDelay(endpoint) {
    if (endpoint.includes('/api/auth/me')) return 3000; // 3 секунды для auth
    if (endpoint.includes('/api/auth/')) return 2000; // 2 секунды для других auth запросов
    if (endpoint.includes('/employees/')) return 1500; // 1.5 секунды для employees
    if (endpoint.includes('/skills/') || endpoint.includes('/skill-groups/')) return 2000; // 2 секунды для skills
    if (endpoint.includes('/api/departments/')) return 1500; // 1.5 секунды для departments
    return 1000; // 1 секунда по умолчанию
  }

  async throttledRequest(endpoint, options = {}) {
    const now = Date.now();
    const lastRequest = this.throttledRequests.get(endpoint);
    const delay = this.getThrottleDelay(endpoint);
    
    if (lastRequest && (now - lastRequest) < delay) {
      const waitTime = delay - (now - lastRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.throttledRequests.set(endpoint, now);
    return this.request(endpoint, options);
  }

  // Generic request method
  async request(endpoint, options = {}) {
    // Применяем throttling для всех запросов
    const now = Date.now();
    const lastRequest = this.throttledRequests.get(endpoint);
    const delay = this.getThrottleDelay(endpoint);
    
    if (lastRequest && (now - lastRequest) < delay) {
      const waitTime = delay - (now - lastRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.throttledRequests.set(endpoint, now);
    
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
    
    // Проверяем кэш для GET запросов
    if (options.method === 'GET' || !options.method) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Добавляем timestamp для предотвращения кэширования в Chrome
    const timestamp = Date.now();
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseURL}${endpoint}${separator}_t=${timestamp}`;
    
    console.log('API Request URL:', url);
    console.log('API baseURL:', this.baseURL);
    console.log('API endpoint:', endpoint);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers,
      },
      ...options,
    };

    // Преобразуем data в body для POST/PUT/PATCH запросов
    if (options.data && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
      config.body = JSON.stringify(options.data);
      delete config.data; // Удаляем data, так как теперь используем body
    }

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Проверяем Content-Type для определения типа ответа
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Если ответ не JSON, читаем как текст
        const textData = await response.text();
        try {
          // Пытаемся распарсить как JSON на всякий случай
          data = JSON.parse(textData);
        } catch (parseError) {
          // Если не удалось распарсить как JSON, создаем объект с текстом
          data = { message: textData };
        }
      }

      if (response.status >= 400) {
        let errorData = {};
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Используем уже прочитанные данные
        if (data) {
          errorData = data;
          errorMessage = data.message || data.error || errorMessage;
        }
        
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          data: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = { data: errorData };
        
        // Специальная обработка для rate limiting
        if (response.status === 429) {
          console.warn('Rate limiting detected, waiting before retry...');
          
          // Проверяем количество 429 ошибок за последние 5 минут
          const now = Date.now();
          const recentErrors = this.throttledRequests.get('_429_errors') || [];
          const fiveMinutesAgo = now - 5 * 60 * 1000;
          
          // Очищаем старые ошибки
          const recentErrorsFiltered = recentErrors.filter(time => time > fiveMinutesAgo);
          recentErrorsFiltered.push(now);
          
          // Если слишком много ошибок, сбрасываем все ограничения
          if (recentErrorsFiltered.length > 10) {
            console.warn('Too many 429 errors detected, resetting all throttling');
            this.resetThrottling();
            this.throttledRequests.set('_429_errors', []);
          } else {
            this.throttledRequests.set('_429_errors', recentErrorsFiltered);
          }
          
          // Увеличиваем время ожидания в зависимости от endpoint
          let waitTime = 15000; // 15 секунд по умолчанию
          if (endpoint.includes('/api/auth/me')) waitTime = 60000; // 1 минута для auth
          else if (endpoint.includes('/api/auth/')) waitTime = 30000; // 30 секунд для других auth
          else if (endpoint.includes('/employees/')) waitTime = 20000; // 20 секунд для employees
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Очищаем кэш для этого endpoint
          this.clearCacheFor(endpoint);
          
          // Увеличиваем throttling delay для этого endpoint
          const currentDelay = this.getThrottleDelay(endpoint);
          this.throttledRequests.set(endpoint, Date.now() + currentDelay * 2);
          
          // Не повторяем запрос для критических endpoints
          if (endpoint.includes('/api/auth/me') || endpoint.includes('/api/auth/')) {
            const rateLimitError = new Error('Rate limit exceeded for authentication');
            rateLimitError.status = 429;
            throw rateLimitError;
          }
          
          // Для остальных endpoints можно попробовать повторить запрос
    
          return this.request(endpoint, options);
        }
        
        // Специальная обработка для 500 ошибок
        if (response.status === 500) {
          console.error('Server error details:', {
            endpoint: endpoint,
            requestData: options.body,
            responseData: errorData
          });
          
          // Создаем специальную ошибку для 500 статуса
          const serverError = new Error('Internal Server Error');
          serverError.status = 500;
          serverError.isServerError = true;
          serverError.endpoint = endpoint;
          serverError.responseData = errorData;
          throw serverError;
        }
        
        throw error;
      }

      // Кэшируем успешные GET запросы с увеличенным временем для разных типов данных
      if (options.method === 'GET' && response.ok) {
        let cacheTime = 60000; // 1 минута по умолчанию
        
        // Увеличиваем время кэширования для стабильных данных
        if (endpoint.includes('/api/departments')) cacheTime = 5 * 60 * 1000; // 5 минут
        if (endpoint.includes('/skills') || endpoint.includes('/skill-groups')) cacheTime = 10 * 60 * 1000; // 10 минут
        if (endpoint.includes('/roles')) cacheTime = 5 * 60 * 1000; // 5 минут
        if (endpoint.includes('/api/auth/me')) cacheTime = 2 * 60 * 1000; // 2 минуты
        
        this.setCache(cacheKey, data, cacheTime);
      }

      return data;
    } catch (error) {
      // Если это наша ошибка с API, возвращаем её как есть
      if (error.status) {
        throw error;
      }
      // Если это сетевая ошибка, добавляем информацию о статусе
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error('Network error - server unavailable');
        networkError.status = 0;
        throw networkError;
      }
      // Дополнительная обработка для мобильных устройств
      if (error.name === 'TypeError' && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        const mobileNetworkError = new Error('Network error - server unavailable');
        mobileNetworkError.status = 0;
        mobileNetworkError.isMobileError = true;
        throw mobileNetworkError;
      }
      throw error;
    }
  }

  // Очистка кэша
  clearCache() {
    cache.clear();
    requestQueue.clear();
    this.throttledRequests.clear();
  }

  // Очистка кэша для конкретного endpoint
  clearCacheFor(endpoint) {
    // Удаляем из памяти
    for (const [key] of cache) {
      if (key.includes(endpoint)) {
        cache.delete(key);
      }
    }
    
    // Удаляем throttling для этого endpoint
    this.throttledRequests.delete(endpoint);
    
    // Удаляем из localStorage для профиля
    if (endpoint.includes('/api/auth/me')) {
      try {
        localStorage.removeItem('profile_cache');
      } catch (error) {
        console.warn('Error clearing profile cache from localStorage:', error);
      }
    }
  }

  // Очистка кэша профиля
  clearProfileCache() {
    // Удаляем из памяти
    for (const [key] of cache) {
      if (key.includes('/api/auth/me')) {
        cache.delete(key);
      }
    }
    
    // Удаляем throttling для auth endpoints
    for (const [key] of this.throttledRequests) {
      if (key.includes('/api/auth/')) {
        this.throttledRequests.delete(key);
      }
    }
    
    // Удаляем из localStorage
    try {
      localStorage.removeItem('profile_cache');
    } catch (error) {
      console.warn('Error clearing profile cache:', error);
    }
  }

  // Принудительный сброс всех ограничений при критических ошибках
  resetThrottling() {
    this.throttledRequests.clear();
  }

  // Send authentication code
  async sendCode(login) {
    try {
      // Проверяем доступность localStorage для Chrome на мобильном
      if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent) {
        const isChromeMobile = /Chrome/.test(window.navigator.userAgent) && /Mobile/.test(window.navigator.userAgent);
        if (isChromeMobile) {
          console.log('Chrome mobile detected, using enhanced error handling');
          // Очищаем кэш для Chrome на мобильном
          this.clearCache();
        }
      }
      
      return this.request('/api/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ login }),
      });
    } catch (error) {
      // Специальная обработка для Chrome на мобильном
      if (error.message && error.message.includes('Network error')) {
        console.error('Chrome mobile network error:', error);
        // Попробуем повторить запрос с задержкой
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request('/api/auth/send-code', {
          method: 'POST',
          body: JSON.stringify({ login }),
        });
      }
      throw error;
    }
  }

  // Verify authentication code
  async verifyCode(login, code) {
    return this.request('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ login, code }),
    });
  }

  // Confirm authentication code (for Telegram mini-app)
  async confirmCode(code) {
    return this.request('/api/auth/confirm-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Get current user profile
  async getMe() {
    // Увеличиваем время кэширования для профиля до 5 минут
    const cacheKey = '/api/auth/me';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const result = await this.request('/api/auth/me');
    
    // Кэшируем результат на 5 минут
    this.setCache(cacheKey, result, 300000);
    
    return result;
  }

  // Update user profile
  async updateProfile(profileData) {
    return this.request('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Logout
  async logout() {
    // Очищаем кеш профиля при выходе
    this.clearProfileCache();
    
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Employees
  async getEmployees() {
    const token = localStorage.getItem('token');
    const endpoint = token ? '/api/employees' : '/api/public/employees';
    return this.throttledRequest(endpoint);
  }

  // Получить сотрудников (дублирующий метод - удаляем)
  // async getEmployees() {
  //   return this.request('/employees');
  // }

  // Получить сотрудников для Telegram мини-приложения (без авторизации)
  async getEmployeesForTelegram() {
    return this.request('/employees/telegram-miniapp');
  }

  // Найти сотрудника по Telegram ID
  async findEmployeeByTelegramId(telegramId) {
    return this.request(`/employees/telegram-id/${telegramId}`);
  }

  async getEmployee(id) {
    const token = localStorage.getItem('token');
    const endpoint = token ? `/api/employees/${id}` : `/api/public/employees/${id}`;
    return this.throttledRequest(endpoint);
  }

  async createEmployee(employeeData) {
    // Создаём сотрудника
    const result = await this.request('/api/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
    return result;
  }

  async updateEmployee(id, employeeData) {
    return this.request(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  async deleteEmployee(id) {
    return this.request(`/api/employees/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadEmployeeAvatar(employeeId, formData) {
    const url = `${this.baseURL}/api/employees/${employeeId}/avatar`;
    const token = localStorage.getItem('token');
    
    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Не устанавливаем Content-Type для FormData, браузер сам установит с boundary
      },
      body: formData
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = { data: errorData };
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  // Employee Skills
  async addEmployeeSkill(employeeId, skillData) {
    return this.request(`/api/employees/${employeeId}/skills`, {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  }

  async removeEmployeeSkill(employeeId, skillId) {
    return this.request(`/api/employees/${employeeId}/skills/${skillId}`, {
      method: 'DELETE',
    });
  }

  // Departments
  async getDepartments() {
    const token = localStorage.getItem('token');
    const endpoint = token ? '/api/departments' : '/api/public/departments';
    return this.throttledRequest(endpoint);
  }

  async getDepartment(id) {
    return this.request(`/api/departments/${id}`);
  }

  async createDepartment(departmentData) {
    return this.request('/api/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  }

  async updateDepartment(id, departmentData) {
    return this.request(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
  }

  async deleteDepartment(id) {
    return this.request(`/api/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Roles
  async getRoles() {
    const response = await this.request('/api/roles');
    // Проверяем структуру ответа
    if (response && response.success && response.data) {
      return response;
    } else if (Array.isArray(response)) {
      return { success: true, data: response };
    } else {
      return { success: true, data: [] };
    }
  }

  async getRole(id) {
    const response = await this.request(`/api/roles/${id}`);
    if (response && response.success && response.data) {
      return response;
    } else {
      return { success: true, data: response };
    }
  }

  async createRole(roleData) {
    const response = await this.request('/api/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
    if (response && response.success && response.data) {
      return response;
    } else {
      return { success: true, data: response };
    }
  }

  async updateRole(id, roleData) {
    const response = await this.request(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
    if (response && response.success && response.data) {
      return response;
    } else {
      return { success: true, data: response };
    }
  }

  async deleteRole(id) {
    return this.request(`/api/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Role visibility
  async getRoleVisibility(id) {
    return this.request(`/api/roles/${id}/visibility`);
  }

  async updateRoleVisibility(id, visibilityData) {
    return this.request(`/api/roles/${id}/visibility`, {
      method: 'PUT',
      body: JSON.stringify(visibilityData),
    });
  }

  async getVisibilityOptions() {
    return this.request('/api/roles/options/visibility');
  }

  // User roles
  async getUserRoles() {
    return this.request('/api/user-roles');
  }

  async assignUserRole(userRoleData) {
    return this.request('/api/user-roles', {
      method: 'POST',
      body: JSON.stringify(userRoleData),
    });
  }

  async updateUserRole(id, userRoleData) {
    return this.request(`/api/user-roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userRoleData),
    });
  }

  async deleteUserRole(id) {
    return this.request(`/api/user-roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Bulk role assignment
  async assignEmployeeRoles(employeeId, roleIds) {
    return this.request(`/api/employees/${employeeId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roleIds }),
    });
  }

  async assignBulkRoles(employeeIds, roleIds) {
    // Преобразуем данные в формат, который ожидает backend
    const assignments = employeeIds.map(employeeId => ({
      employeeId: parseInt(employeeId), // Убеждаемся, что employeeId - это число
      roleIds: roleIds.map(id => parseInt(id)) // Убеждаемся, что roleIds - это числа
    }));
    
    // Отправляем данные на сервер
    return await this.request('/api/user-roles/bulk', {
      method: 'PUT',
      body: JSON.stringify({ assignments }),
    });
  }

  // Skills
  async getSkills() {
    return this.request('/api/skills');
  }

  async getSkill(id) {
    return this.request(`/api/skills/${id}`);
  }

  async createSkill(skillData) {
    return this.request('/api/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  }

  async updateSkill(id, skillData) {
    return this.request(`/api/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(skillData),
    });
  }

  async deleteSkill(id) {
    return this.request(`/api/skills/${id}`, {
      method: 'DELETE',
    });
  }

  // Skill Groups
  async getSkillGroups() {
    return this.request('/api/skill-groups');
  }

  async getSkillGroup(id) {
    return this.request(`/api/skill-groups/${id}`);
  }

  async createSkillGroup(skillGroupData) {
    return this.request('/api/skill-groups', {
      method: 'POST',
      body: JSON.stringify(skillGroupData),
    });
  }

  async updateSkillGroup(id, skillGroupData) {
    return this.request(`/api/skill-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(skillGroupData),
    });
  }

  async deleteSkillGroup(id) {
    return this.request(`/api/skill-groups/${id}`, {
      method: 'DELETE',
    });
  }

  // Products
  async getProducts() {
    const token = localStorage.getItem('token');
    const endpoint = token ? '/api/products' : '/api/public/products';
    return this.throttledRequest(endpoint);
  }

  async getProduct(id) {
    const token = localStorage.getItem('token');
    const endpoint = token ? `/api/products/${id}` : `/api/public/products/${id}`;
    return this.throttledRequest(endpoint);
  }

  async createProduct(productData) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return this.request(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Product Categories
  async getProductCategories() {
    return this.request('/api/product-categories');
  }

  async getProductCategory(id) {
    return this.request(`/api/product-categories/${id}`);
  }

  async createProductCategory(categoryData) {
    return this.request('/api/product-categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateProductCategory(id, categoryData) {
    return this.request(`/api/product-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteProductCategory(id) {
    return this.request(`/api/product-categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Vacations
  async getVacations() {
    return this.request('/api/vacations');
  }

  async getVacationsAdmin() {
    return this.request('/api/vacations/admin');
  }

  async getVacation(id) {
    return this.request(`/api/vacations/${id}`);
  }

  async createVacation(vacationData) {
    // Преобразуем данные из фронтенда в формат бэкенда
    const backendData = {
      type: vacationData.vacation_type || vacationData.type,
      start_date: vacationData.start_date || vacationData.startDate,
      end_date: vacationData.end_date || vacationData.endDate,
      description: vacationData.description || null
    };
    
    return this.request('/api/vacations', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
  }

  async updateVacation(id, vacationData) {
    // Преобразуем данные из фронтенда в формат бэкенда
    const backendData = {
      type: vacationData.vacation_type || vacationData.type,
      start_date: vacationData.start_date || vacationData.startDate,
      end_date: vacationData.end_date || vacationData.endDate,
      description: vacationData.description || null
    };
    
    return this.request(`/api/vacations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    });
  }

  async deleteVacation(id) {
    return this.request(`/api/vacations/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request('/api/notifications');
  }

  async getNotification(id) {
    return this.request(`/api/notifications/${id}`);
  }

  async createNotification(notificationData) {
    return this.request('/api/notifications', {
      method: 'POST',
      data: notificationData,
    });
  }

  async updateNotification(id, notificationData) {
    return this.request(`/api/notifications/${id}`, {
      method: 'PUT',
      data: notificationData,
    });
  }

  async deleteNotification(id) {
    return this.request(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // User Notifications
  async getUserNotifications() {
    return this.request('/api/notifications/user');
  }

  async markNotificationAsRead(id) {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/api/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  // Templates
  async getTemplates() {
    return this.request('/api/templates');
  }

  async getTemplate(id) {
    return this.request(`/api/templates/${id}`);
  }

  async createTemplate(templateData) {
    return this.request('/api/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateTemplate(id, templateData) {
    return this.request(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(id) {
    return this.request(`/api/templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Notification Settings (Chats)
  async getNotificationChats() {
    return this.request('/api/notification-chats');
  }

  async getNotificationChat(id) {
    return this.request(`/api/notification-chats/${id}`);
  }

  async createNotificationChat(chatData) {
    return this.request('/api/notification-chats', {
      method: 'POST',
      body: JSON.stringify(chatData),
    });
  }

  async updateNotificationChat(id, chatData) {
    return this.request(`/api/notification-chats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chatData),
    });
  }

  async deleteNotificationChat(id) {
    return this.request(`/api/notification-chats/${id}`, {
      method: 'DELETE',
    });
  }

  // Notification Service
  async startNotificationService() {
    return this.request('/api/notification-service/start', {
      method: 'POST',
    });
  }

  async stopNotificationService() {
    return this.request('/api/notification-service/stop', {
      method: 'POST',
    });
  }

  async getNotificationServiceStatus() {
    return this.request('/api/notification-service/status');
  }

  async sendNotificationManually(notificationId) {
    return this.request(`/api/notification-service/send/${notificationId}`, {
      method: 'POST',
    });
  }

  async processNotificationsNow() {
    return this.request('/api/notification-service/process-now', {
      method: 'POST',
    });
  }

  // Token Distribution Service
  async getTokenDistributionServiceStatus() {
    return this.request('/api/tokens/distribution-service/status');
  }

  async startTokenDistributionService() {
    return this.request('/api/tokens/distribution-service/start', {
      method: 'POST',
    });
  }

  async stopTokenDistributionService() {
    return this.request('/api/tokens/distribution-service/stop', {
      method: 'POST',
    });
  }

  async checkAutoDistribution() {
    return this.request('/api/tokens/check-auto-distribution', {
      method: 'POST',
    });
  }

  // Admin Tokens
  async getAdminTokens() {
    return this.request('/api/admin/tokens');
  }

  async getAdminToken(id) {
    return this.request(`/api/admin/tokens/${id}`);
  }

  async createAdminToken(tokenData) {
    return this.request('/api/admin/tokens', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
  }

  async updateAdminToken(id, tokenData) {
    return this.request(`/api/admin/tokens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tokenData),
    });
  }

  async deleteAdminToken(id) {
    return this.request(`/api/admin/tokens/${id}`, {
      method: 'DELETE',
    });
  }

  async assignTokenToEmployee(tokenId, employeeId) {
    return this.request('/api/admin/tokens/assign', {
      method: 'POST',
      body: JSON.stringify({ tokenId, employeeId })
    });
  }

  async uploadTokenImage(formData) {
    const url = `${this.baseURL}/api/admin/tokens/upload-image`;
    const config = {
      method: 'POST',
      body: formData,
      headers: {
        // Не устанавливаем Content-Type для FormData, браузер сам установит правильный
      },
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (parseError) {
          data = { message: textData };
        }
      }

      return data;
    } catch (error) {
      console.error('Error uploading token image:', error);
      throw error;
    }
  }

  // Telegram avatar methods
  async getTelegramAvatar(chatId, userId) {
    const cacheKey = `telegram-avatar-${chatId}-${userId}`;
    
    // Проверяем кеш
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const result = await this.request(`/telegram/avatar/${chatId}/${userId}`);
      
      // Кешируем результат на 1 час
      this.setCache(cacheKey, result, 60 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error('Error getting Telegram avatar:', error);
      return null;
    }
  }

  // Generic HTTP methods for convenience
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'POST',
      data: data 
    });
  }

  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'PUT',
      data: data 
    });
  }

  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'PATCH',
      data: data 
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Получить отправленные токены (админ)
  async getSentTokens({ page = 1, limit = 10 } = {}) {
    return this.request(`/tokens/sent?page=${page}&limit=${limit}`);
  }

  // Отправить токен напрямую
  async sendTokenDirect(tokenData) {
    return this.request('/tokens/send-direct', {
      method: 'POST',
      body: JSON.stringify(tokenData)
    });
  }

  // Получить токены сотрудника
  async getEmployeeTokens(employeeId) {
    return this.request(`/tokens/employee/${employeeId}`);
  }

  // Получить токены сотрудника для Telegram мини-приложения (только доступные)
  async getEmployeeTokensForTelegram(employeeId) {
    return this.request(`/tokens/telegram-miniapp/employee/${employeeId}`);
  }

  // Получить запланированные тиражи токенов (админ, если появится отдельный эндпоинт)
  async getPlannedTokenDistributions({ page = 1, limit = 10 } = {}) {
    // Пока нет отдельного эндпоинта, возвращаем пустой массив
    return { success: true, data: [], pagination: { page, limit, total: 0, pages: 1 } };
  }

  // Achievement methods
  async getAchievements() {
    return this.throttledRequest('/api/achievements');
  }

  async getAchievementById(id) {
    return this.request(`/api/achievements/${id}`);
  }

  async createAchievement(data) {
    return this.request('/api/achievements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAchievement(id, data) {
    return this.request(`/api/achievements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAchievement(id) {
    return this.request(`/api/achievements/${id}`, {
      method: 'DELETE',
    });
  }

  async getEmployeeAchievements(employeeId) {
    return this.request(`/api/achievements/employee/${employeeId}`);
  }

  async assignAchievementToEmployee(data) {
    return this.request('/api/achievements/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeAchievementFromEmployee(employeeId, achievementId) {
    return this.request(`/api/achievements/employee/${employeeId}/achievement/${achievementId}`, 'DELETE');
  }

  async getBadgeImages() {
    return this.throttledRequest('/api/achievements/images/list');
  }

  async getTokenTypes() {
    return this.throttledRequest('/api/admin/token-types');
  }

  async checkAndAssignAchievements() {
    return this.throttledRequest('/api/achievements/check-and-assign');
  }

  // Meeting Rooms API
  async getMeetingRooms() {
    console.log('API: Запрос переговорных комнат');
    const result = await this.request('/api/meeting-rooms/rooms');
    console.log('API: Ответ переговорных комнат:', result);
    return result;
  }

  async getMeetingRoomsAdmin() {
    console.log('API: Запрос переговорных комнат (админ)');
    const result = await this.request('/api/meeting-rooms/rooms/admin');
    console.log('API: Ответ переговорных комнат (админ):', result);
    return result;
  }

  async getMeetingRoom(id) {
    console.log('API: Запрос переговорной комнаты:', id);
    const result = await this.request(`/api/meeting-rooms/rooms/${id}`);
    console.log('API: Ответ переговорной комнаты:', result);
    return result;
  }

  async createMeetingRoom(roomData) {
    console.log('API: Создание переговорной комнаты:', roomData);
    const result = await this.post('/api/meeting-rooms/rooms', roomData);
    console.log('API: Результат создания комнаты:', result);
    return result;
  }

  async updateMeetingRoom(id, roomData) {
    console.log('API: Обновление переговорной комнаты:', id, roomData);
    const result = await this.put(`/api/meeting-rooms/rooms/${id}`, roomData);
    console.log('API: Результат обновления комнаты:', result);
    return result;
  }

  async deleteMeetingRoom(id) {
    console.log('API: Удаление переговорной комнаты:', id);
    const result = await this.delete(`/api/meeting-rooms/rooms/${id}`);
    console.log('API: Результат удаления комнаты:', result);
    return result;
  }

  async getRoomSchedule(roomId, date) {
    const result = await this.request(`/api/meeting-rooms/rooms/${roomId}/schedule?date=${date}`);
    return result;
  }

  async getAvailableSlots(roomId, date) {
    const result = await this.request(`/api/meeting-rooms/rooms/${roomId}/slots?date=${date}`);
    return result;
  }

  // Meeting Room Bookings API
  async createBooking(bookingData) {
    console.log('API: Создание бронирования:', bookingData);
    const result = await this.post('/api/meeting-rooms/bookings', bookingData);
    console.log('API: Результат создания бронирования:', result);
    return result;
  }

  async getUserBookings() {
    console.log('API: Запрос бронирований пользователя');
    const result = await this.request('/api/meeting-rooms/bookings');
    console.log('API: Ответ бронирований пользователя:', result);
    return result;
  }

  async getBooking(id) {
    console.log('API: Запрос бронирования:', id);
    const result = await this.request(`/api/meeting-rooms/bookings/${id}`);
    console.log('API: Ответ бронирования:', result);
    return result;
  }

  async updateBooking(id, bookingData) {
    console.log('API: Обновление бронирования:', id, bookingData);
    const result = await this.put(`/api/meeting-rooms/bookings/${id}`, bookingData);
    console.log('API: Результат обновления бронирования:', result);
    return result;
  }

  async cancelBooking(id) {
    console.log('API: Отмена бронирования:', id);
    const result = await this.delete(`/api/meeting-rooms/bookings/${id}`);
    console.log('API: Результат отмены бронирования:', result);
    return result;
  }

  async requestBookingChange(bookingId, requestData) {
    console.log('API: Запрос изменения бронирования:', bookingId, requestData);
    const result = await this.post(`/api/meeting-rooms/bookings/${bookingId}/request-change`, requestData);
    console.log('API: Результат запроса изменения:', result);
    return result;
  }

  async getBookingRequests() {
    console.log('API: Запрос запросов на изменение');
    const result = await this.request('/api/meeting-rooms/booking-requests');
    console.log('API: Ответ запросов на изменение:', result);
    return result;
  }

  // App Settings
  async getAppSettings() {
    return this.request('/api/app-settings');
  }

  async updateAppSetting(key, value, type = 'string') {
    return this.request(`/api/app-settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, type })
    });
  }

  async getAppSetting(key) {
    return this.request(`/api/app-settings/${key}`);
  }

  // Meeting Room Service API
  async getMeetingRoomServiceStatus() {
    const result = await this.request('/api/meeting-room-service/status');
    return result;
  }

  async startMeetingRoomService() {
    const result = await this.post('/api/meeting-room-service/start');
    return result;
  }

  async stopMeetingRoomService() {
    const result = await this.post('/api/meeting-room-service/stop');
    return result;
  }

  async processMeetingRoomTasksNow() {
    const result = await this.post('/api/meeting-room-service/process-now');
    return result;
  }
}

// Создаем экземпляр API сервиса
const api = new ApiService();

// Делаем API доступным глобально для отладки
if (typeof window !== 'undefined') {
  window.api = {
    ...api,
    clearThrottling: () => {
      requestQueue.clear();
    },
    clearCache: () => {
      cache.clear();
      localStorage.removeItem('profile_cache');
    },
    getCacheStats: () => ({
      cacheSize: cache.size,
      throttledRequests: requestQueue.size,
      throttledDelays: Object.fromEntries(requestQueue)
    })
  };
  
  // Добавляем удобные функции для отладки
  window.resetApiThrottling = () => {
    api.resetThrottling();

  };
  
  window.clearApiCache = () => {
    api.clearCache();
  };
  
  window.getApiStats = () => {
    return {
      cacheSize: cache.size,
      throttlingEntries: api.throttledRequests.size,
      throttlingDelays: Object.fromEntries(api.throttledRequests)
    };
  };
}

export default api; 