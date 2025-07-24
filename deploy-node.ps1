# 🚀 Скрипт развертывания приложения на Node.js (PowerShell)
# Использование: .\deploy-node.ps1 -ServerIP "192.168.1.100" -Domain "myapp.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Domain
)

# Если домен не указан, используем IP
if (-not $Domain) {
    $Domain = $ServerIP
}

Write-Host "🚀 Начинаем развертывание на сервер $ServerIP" -ForegroundColor Green

# Создание временного архива
Write-Host "📦 Создание архива приложения..." -ForegroundColor Yellow
if (Test-Path "orgchart-app.tar.gz") {
    Remove-Item "orgchart-app.tar.gz" -Force
}

# Используем 7zip для создания архива (если установлен)
if (Get-Command "7z" -ErrorAction SilentlyContinue) {
    7z a -ttar orgchart-app.tar.gz orgchart\*
} else {
    # Альтернативный способ с tar (если доступен)
    if (Get-Command "tar" -ErrorAction SilentlyContinue) {
        tar -czf orgchart-app.tar.gz orgchart/
    } else {
        Write-Host "❌ Не найден tar или 7zip. Установите один из них." -ForegroundColor Red
        exit 1
    }
}

# Копирование на сервер
Write-Host "📤 Копирование файлов на сервер..." -ForegroundColor Yellow
scp orgchart-app.tar.gz root@${ServerIP}:/tmp/

# Выполнение команд на сервере
Write-Host "🔧 Выполнение команд на сервере..." -ForegroundColor Yellow

$remoteScript = @"
set -e

# Функции для вывода
log_info() {
    echo -e "\033[0;32m[INFO]\033[0m \$1"
}

log_warn() {
    echo -e "\033[1;33m[WARN]\033[0m \$1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m \$1"
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
        try_files \$uri \$uri/ /index.html;
        
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
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
log_info "Приложение доступно по адресу: http://$Domain"
log_info "Для проверки статуса выполните: pm2 status"
log_info "Для просмотра логов выполните: pm2 logs orgchart-backend"
"@

# Отправка и выполнение скрипта на сервере
$remoteScript | ssh root@${ServerIP} "bash -s"

# Очистка
Write-Host "🧹 Очистка временных файлов..." -ForegroundColor Yellow
if (Test-Path "orgchart-app.tar.gz") {
    Remove-Item "orgchart-app.tar.gz" -Force
}

Write-Host "✅ Развертывание завершено!" -ForegroundColor Green
Write-Host "🌐 Приложение доступно по адресу: http://$Domain" -ForegroundColor Cyan
Write-Host "📊 Для проверки статуса: ssh root@${ServerIP} 'pm2 status'" -ForegroundColor Cyan
Write-Host "📝 Для просмотра логов: ssh root@${ServerIP} 'pm2 logs orgchart-backend'" -ForegroundColor Cyan 