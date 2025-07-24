#!/bin/bash

# 🚀 Скрипт развертывания приложения на Node.js
# Использование: ./deploy-node.sh [server-ip] [domain]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функции для вывода
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка аргументов
if [ $# -lt 1 ]; then
    echo "Использование: $0 <server-ip> [domain]"
    echo "Пример: $0 192.168.1.100 myapp.com"
    exit 1
fi

SERVER_IP=$1
DOMAIN=${2:-$SERVER_IP}

log_info "Начинаем развертывание на сервер $SERVER_IP"

# Создание временного архива
log_info "Создание архива приложения..."
tar --exclude='node_modules' --exclude='.git' --exclude='dist' -czf orgchart-app.tar.gz orgchart/

# Копирование на сервер
log_info "Копирование файлов на сервер..."
scp orgchart-app.tar.gz root@$SERVER_IP:/tmp/

# Выполнение команд на сервере
log_info "Выполнение команд на сервере..."
ssh root@$SERVER_IP << 'EOF'
set -e

# Функции для вывода
log_info() {
    echo -e "\033[0;32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[1;33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# Обновление системы
log_info "Обновление системы..."
apt update && apt upgrade -y

# Установка необходимых пакетов
log_info "Установка необходимых пакетов..."
apt install -y curl wget git nginx mysql-client

# Установка Node.js
log_info "Установка Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Установка PM2
log_info "Установка PM2..."
npm install -g pm2

# Создание пользователя
log_info "Создание пользователя orgchart..."
useradd -m -s /bin/bash orgchart || true
usermod -aG sudo orgchart

# Создание директорий
log_info "Создание директорий..."
mkdir -p /var/www
mkdir -p /var/log/orgchart
chown orgchart:orgchart /var/www
chown orgchart:orgchart /var/log/orgchart

# Распаковка приложения
log_info "Распаковка приложения..."
cd /var/www
tar -xzf /tmp/orgchart-app.tar.gz
chown -R orgchart:orgchart /var/www/orgchart

# Установка зависимостей
log_info "Установка зависимостей backend..."
cd /var/www/orgchart/orgchart/backend
npm install --production

log_info "Установка зависимостей frontend..."
cd /var/www/orgchart/orgchart/frontend
npm install --production
npm run build

# Создание конфигурации PM2
log_info "Создание конфигурации PM2..."
cat > /var/www/orgchart/ecosystem.config.js << 'PM2CONFIG'
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
PM2CONFIG

# Создание конфигурации Nginx
log_info "Создание конфигурации Nginx..."
cat > /etc/nginx/sites-available/orgchart << 'NGINXCONFIG'
server {
    listen 80;
    server_name _;

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
NGINXCONFIG

# Активация сайта
log_info "Активация Nginx сайта..."
ln -sf /etc/nginx/sites-available/orgchart /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Настройка firewall
log_info "Настройка firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Запуск приложения
log_info "Запуск приложения..."
cd /var/www/orgchart
pm2 start ecosystem.config.js
pm2 save
pm2 startup

log_info "Развертывание завершено!"
log_info "Приложение доступно по адресу: http://$DOMAIN"
log_info "Для проверки статуса выполните: pm2 status"
log_info "Для просмотра логов выполните: pm2 logs orgchart-backend"
EOF

# Очистка
log_info "Очистка временных файлов..."
rm -f orgchart-app.tar.gz

log_info "✅ Развертывание завершено!"
log_info "🌐 Приложение доступно по адресу: http://$DOMAIN"
log_info "📊 Для проверки статуса: ssh root@$SERVER_IP 'pm2 status'"
log_info "📝 Для просмотра логов: ssh root@$SERVER_IP 'pm2 logs orgchart-backend'" 