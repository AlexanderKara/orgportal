# 🗄️ Настройка с внешней базой данных

## 📋 Предварительные требования

1. **Внешний MySQL сервер** с доступом
2. **Созданная база данных** `orgchart`
3. **Пользователь БД** с правами на создание таблиц

## 🔧 Настройка подключения

### 1. Обновите .env файл:

```bash
# Внешняя база данных
DB_HOST=your_external_db_host.com
DB_PORT=3306
DB_NAME=orgchart
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Telegram Bot Token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:3000
REACT_APP_FRONTEND_URL=http://localhost:3001
```

### 2. Проверьте подключение к БД:

```bash
# Тест подключения
node setup-db.js
```

### 3. Запустите приложение:

```bash
# Сборка образов
docker-compose build

# Запуск сервисов
docker-compose up -d
```

## 🔍 Проверка работы

### Проверка backend:
```bash
curl http://localhost:3000/health
```

### Проверка frontend:
```bash
curl http://localhost:3001
```

### Проверка логов:
```bash
docker-compose logs backend
```

## 🛠️ Управление БД

### Выполнение миграций:
```bash
# В контейнере
docker-compose exec backend npm run db:migrate

# Или локально
cd orgchart/backend
npm run db:migrate
```

### Загрузка тестовых данных:
```bash
# В контейнере
docker-compose exec backend npm run db:seed

# Или локально
cd orgchart/backend
npm run db:seed
```

### Сброс БД:
```bash
# В контейнере
docker-compose exec backend npm run db:reset

# Или локально
cd orgchart/backend
npm run db:reset
```

## 🔒 Безопасность

### Рекомендации:
1. **Используйте SSL** для подключения к БД
2. **Ограничьте доступ** к БД по IP
3. **Используйте сильные пароли**
4. **Регулярно обновляйте** права пользователей

### Настройка SSL:
```bash
# В .env добавьте:
DB_SSL=true
DB_SSL_CA=/path/to/ca-cert.pem
```

## 🚨 Устранение неполадок

### Ошибка подключения:
1. Проверьте правильность настроек в .env
2. Убедитесь, что БД доступна с вашего сервера
3. Проверьте права пользователя БД

### Ошибка миграций:
1. Убедитесь, что пользователь имеет права CREATE TABLE
2. Проверьте, что БД существует
3. Выполните миграции вручную

### Ошибка авторизации:
1. Проверьте, что backend подключен к БД
2. Убедитесь, что таблицы созданы
3. Проверьте логи backend

## 📊 Мониторинг

### Проверка статуса:
```bash
docker-compose ps
```

### Просмотр логов:
```bash
docker-compose logs -f backend
```

### Проверка БД:
```bash
# Подключение к внешней БД
mysql -h your_external_db_host.com -u your_db_user -p orgchart
``` 