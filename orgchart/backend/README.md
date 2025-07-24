# OrgChart Backend

Backend API для системы управления организационной структурой компании.

## Технологии

- Node.js
- Express.js
- MySQL
- Sequelize ORM
- JWT для аутентификации
- bcryptjs для хеширования паролей

## Требования

- Node.js 18+
- MySQL 8.0+
- npm или yarn

## Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd orgchart/backend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Настройте переменные окружения в файле `.env`:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=orgchart_dev
DB_NAME_TEST=orgchart_test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## Настройка базы данных

1. Создайте базу данных MySQL:
```sql
CREATE DATABASE orgchart_dev;
CREATE DATABASE orgchart_test;
```

2. Запустите миграции для создания таблиц:
```bash
npm run db:migrate
```

3. Заполните базу данных начальными данными:
```bash
npm run db:seed
```

## Запуск

### Разработка
```bash
npm run dev
```

### Продакшн
```bash
npm start
```

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/logout` - Выход из системы

### Сотрудники
- `GET /api/employees` - Получить список сотрудников
- `POST /api/employees` - Создать сотрудника
- `GET /api/employees/:id` - Получить сотрудника
- `PUT /api/employees/:id` - Обновить сотрудника
- `DELETE /api/employees/:id` - Удалить сотрудника

### Отделы
- `GET /api/departments` - Получить список отделов
- `POST /api/departments` - Создать отдел
- `GET /api/departments/:id` - Получить отдел
- `PUT /api/departments/:id` - Обновить отдел
- `DELETE /api/departments/:id` - Удалить отдел

### Навыки
- `GET /api/skills` - Получить список навыков
- `POST /api/skills` - Создать навык
- `GET /api/skills/:id` - Получить навык
- `PUT /api/skills/:id` - Обновить навык
- `DELETE /api/skills/:id` - Удалить навык

### Группы навыков
- `GET /api/skill-groups` - Получить список групп навыков
- `POST /api/skill-groups` - Создать группу навыков
- `GET /api/skill-groups/:id` - Получить группу навыков
- `PUT /api/skill-groups/:id` - Обновить группу навыков
- `DELETE /api/skill-groups/:id` - Удалить группу навыков

### Продукты
- `GET /api/products` - Получить список продуктов
- `POST /api/products` - Создать продукт
- `GET /api/products/:id` - Получить продукт
- `PUT /api/products/:id` - Обновить продукт
- `DELETE /api/products/:id` - Удалить продукт

### Отпуска
- `GET /api/vacations` - Получить список отпусков
- `POST /api/vacations` - Создать отпуск
- `GET /api/vacations/:id` - Получить отпуск
- `PUT /api/vacations/:id` - Обновить отпуск
- `DELETE /api/vacations/:id` - Удалить отпуск

### Роли
- `GET /api/roles` - Получить список ролей
- `POST /api/roles` - Создать роль
- `GET /api/roles/:id` - Получить роль
- `PUT /api/roles/:id` - Обновить роль
- `DELETE /api/roles/:id` - Удалить роль

## Структура базы данных

### Основные таблицы:
- `departments` - Отделы
- `employees` - Сотрудники
- `roles` - Роли пользователей
- `skills` - Навыки
- `skill_groups` - Группы навыков
- `skill_levels` - Уровни навыков
- `employee_skills` - Связь сотрудников и навыков
- `products` - Продукты
- `product_participants` - Участники продуктов
- `product_versions` - Версии продуктов
- `product_relations` - Связи между продуктами
- `vacations` - Отпуска

## Команды для работы с базой данных

```bash
# Запуск миграций
npm run db:migrate

# Откат миграций
npm run db:migrate:undo

# Заполнение данными
npm run db:seed

# Сброс базы данных (удаление, создание, миграции, заполнение)
npm run db:reset
```

## Демо-данные

После запуска сидеров в системе будет создан администратор:
- Email: `admin@example.com`
- Пароль: `admin123`

## Тестирование

```bash
npm test
```

## Линтинг

```bash
npm run lint
npm run lint:fix
```

## Структура проекта

```
backend/
├── config/
│   └── database.js          # Конфигурация базы данных
├── controllers/             # Контроллеры API
├── middleware/              # Промежуточное ПО
├── migrations/              # Миграции базы данных
├── models/                  # Модели Sequelize
├── routes/                  # Маршруты API
├── seeders/                 # Сидеры данных
├── services/                # Бизнес-логика
├── .sequelizerc            # Конфигурация Sequelize CLI
├── server.js               # Точка входа приложения
└── package.json
```

## Лицензия

MIT 