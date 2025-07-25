#!/bin/bash

# Скрипт для автоматического обновления и деплоя приложения
# Использование: ./deploy.sh

set -e

echo "🚀 Начинаем процесс деплоя..."

# Сохраняем текущую ветку
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Текущая ветка: $CURRENT_BRANCH"

# Переключаемся на master
echo "🔄 Переключаемся на master..."
git checkout master

# Получаем последние изменения
echo "📥 Получаем последние изменения с удаленного репозитория..."
git pull origin master

# Устанавливаем зависимости для монорепозитория
echo "📦 Устанавливаем зависимости..."
cd orgchart
npm install

# Устанавливаем зависимости для бэкенда
echo "🔧 Устанавливаем зависимости для бэкенда..."
cd backend
npm install
cd ..

# Устанавливаем зависимости для фронтенда
echo "🎨 Устанавливаем зависимости для фронтенда..."
cd frontend
npm install
cd ..

# Собираем фронтенд
echo "🏗️ Собираем фронтенд..."
cd frontend
npm run build
cd ..

# Копируем собранный фронтенд в Nginx директорию
echo "📁 Копируем фронтенд в Nginx директорию..."
mkdir -p /var/www/a-team.moscow
cp -r frontend/dist/* /var/www/a-team.moscow/
chown -R www-data:www-data /var/www/a-team.moscow/
chmod -R 755 /var/www/a-team.moscow/

# Возвращаемся в корневую директорию
cd ..

# Останавливаем текущие процессы PM2
echo "⏹️ Останавливаем текущие процессы..."
pm2 stop all || true

# Удаляем старые процессы
echo "🗑️ Удаляем старые процессы..."
pm2 delete all || true

# Запускаем приложения через PM2
echo "▶️ Запускаем приложения через PM2..."
pm2 start ecosystem.config.js --env production

# Сохраняем конфигурацию PM2
echo "💾 Сохраняем конфигурацию PM2..."
pm2 save

# Перезапускаем Nginx
echo "🔄 Перезапускаем Nginx..."
systemctl reload nginx

# Показываем статус
echo "📊 Статус приложений:"
pm2 status

# Возвращаемся на исходную ветку
if [ "$CURRENT_BRANCH" != "master" ]; then
    echo "🔄 Возвращаемся на ветку: $CURRENT_BRANCH"
    git checkout $CURRENT_BRANCH
fi

echo "✅ Деплой завершен успешно!"
echo "🌐 Фронтенд доступен на: https://a-team.moscow"
echo "🔧 Бэкенд доступен на: http://localhost:3001" 