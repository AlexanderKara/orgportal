# Favicon для A-Team Portal

## Файлы favicon:

- **favicon.svg** - Основной SVG favicon (векторный, масштабируемый)
- **192.png** - PNG иконка 192x192 пикселей
- **512.png** - PNG иконка 512x512 пикселей

## Настройка в HTML:

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/512.png" />
<link rel="apple-touch-icon" href="/192.png" />
<link rel="apple-touch-icon" sizes="192x192" href="/192.png" />
<link rel="apple-touch-icon" sizes="512x512" href="/512.png" />
<link rel="mask-icon" href="/favicon.svg" color="#E42E0F" />
```

## Цвета:

- **Основной цвет**: #E42E0F (корпоративный красный)
- **Фон**: #E42E0F
- **Элементы**: белый

## Совместимость:

- ✅ **Chrome/Edge** - поддерживает SVG и PNG
- ✅ **Firefox** - поддерживает SVG и PNG  
- ✅ **Safari** - поддерживает PNG и apple-touch-icon
- ✅ **iOS** - использует apple-touch-icon
- ✅ **Android** - использует manifest.json иконки
- ✅ **PWA** - использует manifest.json иконки

## Развертывание:

При сборке проекта (`npm run build`) все favicon файлы копируются в папку `dist/` и доступны по соответствующим URL.

## Проверка:

1. Откройте приложение в браузере
2. Проверьте вкладку браузера - должен отображаться favicon
3. Добавьте в закладки - favicon должен отображаться
4. На мобильных устройствах - проверьте иконку при добавлении на главный экран 