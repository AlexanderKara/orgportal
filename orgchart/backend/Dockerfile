# Используем официальный образ Node.js
FROM node:20-alpine

# Устанавливаем системные зависимости для canvas и других нативных модулей
RUN apk add --no-cache \
    python3 \
    python3-dev \
    py3-pip \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    pkgconfig

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json
COPY package.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь код приложения
COPY . .

# Создаем директории для логов и загрузок
RUN mkdir -p /app/logs /app/uploads

# Открываем порт
EXPOSE 3000

# Запускаем приложение (миграции выполняются при первом подключении)
CMD ["npm", "start"] 