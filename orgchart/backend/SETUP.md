# Инструкции по настройке MySQL для OrgChart

## 1. Установка MySQL

### Windows

1. Скачайте MySQL Community Server с официального сайта:
   https://dev.mysql.com/downloads/mysql/

2. Установите MySQL, следуя инструкциям установщика
3. Запомните пароль root пользователя

### Альтернативно: XAMPP

1. Скачайте XAMPP: https://www.apachefriends.org/
2. Установите XAMPP
3. Запустите XAMPP Control Panel
4. Запустите MySQL сервис

## 2. Создание базы данных

После установки MySQL выполните следующие команды:

```sql
-- Подключитесь к MySQL как root
mysql -u root -p

-- Создайте базы данных
CREATE DATABASE orgchart_dev;
CREATE DATABASE orgchart_test;

-- Проверьте создание
SHOW DATABASES;
```

## 3. Настройка переменных окружения

Создайте файл `.env` в папке `backend/` со следующим содержимым:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=orgchart_dev
DB_NAME_TEST=orgchart_test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
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

**Важно:** Замените `your_mysql_root_password` на ваш реальный пароль root пользователя MySQL.

## 4. Запуск миграций

После настройки .env файла выполните:

```bash
# Установите зависимости (если еще не установлены)
npm install

# Запустите миграции для создания таблиц
npm run db:migrate

# Заполните базу данных начальными данными
npm run db:seed
```

## 5. Запуск приложения

```bash
# Режим разработки
npm run dev

# Или продакшн режим
npm start
```

## 6. Проверка работы

После запуска приложения:

1. Откройте браузер и перейдите на `http://localhost:5000/api/health`
2. Вы должны увидеть статус подключения к базе данных

## 7. Демо-аккаунт

После запуска сидеров в системе будет создан администратор:
- Email: `admin@example.com`
- Пароль: `admin123`

## Устранение проблем

### Ошибка подключения к MySQL

1. Убедитесь, что MySQL сервис запущен
2. Проверьте правильность пароля в .env файле
3. Убедитесь, что базы данных созданы

### Ошибка "Access denied"

1. Проверьте права доступа пользователя MySQL
2. Убедитесь, что пользователь имеет права на создание/изменение таблиц

### Ошибка "Connection refused"

1. Проверьте, что MySQL сервис запущен
2. Убедитесь, что порт 3306 не занят другим приложением

## Полезные команды MySQL

```sql
-- Подключение к базе данных
mysql -u root -p orgchart_dev

-- Просмотр таблиц
SHOW TABLES;

-- Просмотр структуры таблицы
DESCRIBE employees;

-- Просмотр данных
SELECT * FROM employees LIMIT 5;
``` 