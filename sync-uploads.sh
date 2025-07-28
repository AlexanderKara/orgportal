#!/bin/bash

# Скрипт для синхронизации папки uploads между backend и frontend
BACKEND_UPLOADS="/root/orgportal/orgchart/backend/uploads"
FRONTEND_UPLOADS="/var/www/a-team.moscow/uploads"

# Создаем папку если её нет
mkdir -p "$FRONTEND_UPLOADS"

# Синхронизируем файлы
rsync -av --delete "$BACKEND_UPLOADS/" "$FRONTEND_UPLOADS/"

# Устанавливаем правильные права
chown -R www-data:www-data "$FRONTEND_UPLOADS"
chmod -R 755 "$FRONTEND_UPLOADS"

echo "Синхронизация завершена: $(date)" 