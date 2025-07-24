# 🚀 Развертывание приложения на сервере

## 📋 Требования к серверу

- **ОС**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: 18.x или выше
- **MySQL**: 8.0 или выше
- **PM2**: для управления процессами
- **Nginx**: для проксирования запросов

## 🔧 Подготовка сервера

### 1. Установка Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Установка PM2
```bash
sudo npm install -g pm2
```

### 3. Установка Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 4. Создание пользователя для приложения
```bash
sudo useradd -m -s /bin/bash orgchart
sudo usermod -aG sudo orgchart
```

## 📁 Развертывание приложения

### 1. Клонирование репозитория
```bash
sudo mkdir -p /var/www
sudo chown orgchart:orgchart /var/www
cd /var/www
git clone <your-repo-url> orgchart
cd orgchart
```

### 2. Установка зависимостей
```bash
# Backend
cd orgchart/backend
npm install --production

# Frontend
cd ../frontend
npm install --production
npm run build
```

### 3. Настройка переменных окружения

Создайте файл `.env` в папке `orgchart/backend/`:

```env
# Database
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASS=your-database-password

# Server
PORT=3000
NODE_ENV=production

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### 4. Настройка базы данных
```bash
cd orgchart/backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

## ⚙️ Настройка PM2

### 1. Создание конфигурации PM2
Создайте файл `ecosystem.config.js` в корне проекта:

```javascript
module.exports = {
  apps: [
    {
      name: 'orgchart-backend',
      script: './orgchart/backend/server.js',
      cwd: '/var/www/orgchart',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/orgchart/backend-error.log',
      out_file: '/var/log/orgchart/backend-out.log',
      log_file: '/var/log/orgchart/backend-combined.log',
      time: true
    }
  ]
};
```

### 2. Создание лог-директорий
```bash
sudo mkdir -p /var/log/orgchart
sudo chown orgchart:orgchart /var/log/orgchart
```

### 3. Запуск приложения
```bash
cd /var/www/orgchart
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Настройка Nginx

### 1. Создание конфигурации Nginx
Создайте файл `/etc/nginx/sites-available/orgchart`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (React build)
    location / {
        root /var/www/orgchart/orgchart/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads/ {
        alias /var/www/orgchart/orgchart/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### 2. Активация сайта
```bash
sudo ln -s /etc/nginx/sites-available/orgchart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Настройка SSL (опционально)

### 1. Установка Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

### 2. Получение SSL сертификата
```bash
sudo certbot --nginx -d your-domain.com
```

## 📊 Мониторинг

### 1. Проверка статуса PM2
```bash
pm2 status
pm2 logs orgchart-backend
```

### 2. Проверка Nginx
```bash
sudo systemctl status nginx
sudo nginx -t
```

### 3. Проверка портов
```bash
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
```

## 🔄 Обновление приложения

### 1. Остановка приложения
```bash
pm2 stop orgchart-backend
```

### 2. Обновление кода
```bash
cd /var/www/orgchart
git pull origin main
```

### 3. Обновление зависимостей
```bash
cd orgchart/backend
npm install --production

cd ../frontend
npm install --production
npm run build
```

### 4. Запуск приложения
```bash
pm2 start orgchart-backend
pm2 save
```

## 🛠️ Устранение неполадок

### 1. Проверка логов
```bash
pm2 logs orgchart-backend --lines 100
sudo tail -f /var/log/nginx/error.log
```

### 2. Перезапуск сервисов
```bash
pm2 restart orgchart-backend
sudo systemctl restart nginx
```

### 3. Проверка прав доступа
```bash
sudo chown -R orgchart:orgchart /var/www/orgchart
sudo chmod -R 755 /var/www/orgchart
```

## 📝 Полезные команды

```bash
# Просмотр процессов PM2
pm2 list

# Мониторинг в реальном времени
pm2 monit

# Перезапуск всех приложений
pm2 restart all

# Остановка всех приложений
pm2 stop all

# Удаление приложения из PM2
pm2 delete orgchart-backend
``` 