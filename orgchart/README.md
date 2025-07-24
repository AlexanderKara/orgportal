# Организационная структура - Монорепозиторий

Система управления организационной структурой с разделением ролей и прав доступа.

## 🚀 Быстрый старт

### Предварительные требования
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 5.0

### Установка

1. **Клонирование репозитория**
```bash
git clone <repository-url>
cd orgchart
```

2. **Установка зависимостей**
```bash
# Автоматическая установка всех зависимостей
node install.js

# Или через npm скрипт
npm run setup
```

3. **Настройка окружения**
```bash
# Копирование примера конфигурации
cp backend/env.example backend/.env
```

4. **Запуск в режиме разработки**
```bash
# Запуск frontend и backend одновременно
npm run dev

# Или по отдельности:
npm run dev:frontend  # Frontend на http://localhost:3000
npm run dev:backend   # Backend на http://localhost:5000
```

## 📁 Структура проекта

```
orgchart/
├── frontend/          # React приложение
│   ├── src/
│   │   ├── pages/    # Страницы приложения
│   │   ├── components/ # React компоненты
│   │   └── ...
├── backend/           # Node.js API
│   ├── models/       # Mongoose модели
│   ├── controllers/  # Контроллеры API
│   ├── routes/       # Маршруты API
│   └── ...
├── install.js         # Скрипт установки зависимостей
└── package.json      # Корневой package.json для монорепозитория
```

## 🔧 Управление зависимостями

### Добавление зависимостей
```bash
# В корневой проект
npm install package-name

# В frontend
cd frontend && npm install package-name

# В backend
cd backend && npm install package-name
```

### Обновление зависимостей
```bash
# Обновление всех зависимостей
npm update

# Проверка устаревших пакетов
npm outdated
```

## ⚠️ Устранение предупреждений npm

### Предупреждения о deprecated пакетах
Некоторые предупреждения о deprecated пакетах являются нормальными и не влияют на функциональность:

- `inflight@1.0.6` - используется внутренними зависимостями
- `glob@7.2.3` - используется в dev-зависимостях
- `supertest@6.3.4` - обновлен до версии 7.0.0
- `multer@1.4.5-lts.2` - обновлен до версии 2.0.0
- `superagent@8.1.2` - обновлен до версии 10.2.2

### Предупреждение о workspace
```
npm warn workspaces orgchart-backend in filter set, but no workspace folder present
```
Это предупреждение появляется при установке в отдельных папках. Для устранения:

1. Установите зависимости из корневой папки:
```bash
cd orgchart
npm install
```

2. Или используйте флаг для игнорирования workspace:
```bash
npm install --ignore-workspace-root-check
```

## 🛠️ Скрипты

### Корневые скрипты
- `npm run dev` - запуск frontend и backend в режиме разработки
- `npm run build` - сборка frontend и backend
- `npm run setup` - установка всех зависимостей
- `npm run clean` - очистка node_modules
- `npm run test` - запуск тестов для frontend и backend

### Frontend скрипты
- `npm run dev` - запуск dev сервера
- `npm run build` - сборка для продакшена
- `npm run preview` - предварительный просмотр сборки

### Backend скрипты
- `npm run dev` - запуск с nodemon
- `npm start` - запуск в продакшене
- `npm test` - запуск тестов

## 🔐 Аутентификация и авторизация

### Роли пользователей
- **Администратор** - полный доступ ко всем функциям
- **Менеджер** - управление сотрудниками и отделами
- **HR-специалист** - управление кадрами и отпусками
- **Сотрудник** - базовый доступ к просмотру информации

### Управление ролями
1. Создание ролей: `/admin/roles`
2. Назначение ролей: `/admin/user-roles`

## 📊 API Endpoints

### Аутентификация
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `POST /api/auth/logout` - выход

### Сотрудники
- `GET /api/employees` - список сотрудников
- `POST /api/employees` - создание сотрудника
- `PUT /api/employees/:id` - обновление сотрудника
- `DELETE /api/employees/:id` - удаление сотрудника

### Роли
- `GET /api/roles` - список ролей
- `POST /api/roles` - создание роли
- `PUT /api/roles/:id` - обновление роли
- `DELETE /api/roles/:id` - удаление роли

### Назначение ролей
- `GET /api/user-roles` - список назначений ролей
- `PUT /api/user-roles/:employeeId` - назначение роли сотруднику
- `PUT /api/user-roles/bulk` - массовое назначение ролей

## 🚨 Устранение неполадок

### Ошибки установки зависимостей
```bash
# Очистка кэша npm
npm cache clean --force

# Удаление node_modules и переустановка
npm run clean
node install.js
```

### Ошибки MongoDB
```bash
# Проверка подключения к MongoDB
mongo --eval "db.runCommand('ping')"
```

### Ошибки портов
```bash
# Проверка занятых портов
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
```

## 📝 Лицензия

MIT License - см. файл LICENSE для деталей.

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request 