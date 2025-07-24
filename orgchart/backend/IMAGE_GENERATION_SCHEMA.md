# Схема генерации изображений для сообщений бота

## 📍 Места определения генерации изображений

### 1. **Команда `/start`** 
**Файл:** `telegramBotInstance.js` (строки 287-350)

```javascript
bot.onText(/\/start/, async (msg) => {
  // ✅ ГЕНЕРИРУЕТСЯ ИЗОБРАЖЕНИЕ
  const imageBuffer = await createCorporateImage('Привет!');
  await bot.sendPhoto(chatId, imageBuffer, {
    caption: welcomeMessage,
    parse_mode: 'HTML',
    filename: 'welcome.png'
  });
  
  // Для групповых чатов - ДОПОЛНИТЕЛЬНОЕ изображение
  const groupImageBuffer = await createCorporateImage('Бот в группе!');
  await bot.sendPhoto(chatId, groupImageBuffer, {
    caption: `✅ Бот успешно подключен к группе "${chatName}"...`,
    filename: 'group-connected.png'
  });
});
```

### 2. **Команда `/link`** 
**Файл:** `telegramBotInstance.js` (строки 403-490)

```javascript
bot.onText(/\/link/, async (msg) => {
  // ✅ ГЕНЕРИРУЕТСЯ ИЗОБРАЖЕНИЕ (только при успехе)
  if (success) {
    const imageBuffer = await createCorporateImage('Бот подключен!');
    await bot.sendPhoto(chatId, imageBuffer, {
      caption: successMessage,
      parse_mode: 'HTML',
      filename: 'bot-connected.png'
    });
  } else {
    // ❌ НЕ ГЕНЕРИРУЕТСЯ - только текст
    await bot.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' });
  }
});
```

### 3. **Команда `/help`** 
**Файл:** `telegramBotInstance.js` (строки 352-380)

```javascript
bot.onText(/\/help/, async (msg) => {
  // ❌ НЕ ГЕНЕРИРУЕТСЯ - только текст
  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
});
```

### 4. **Команда `/status`** 
**Файл:** `telegramBotInstance.js` (строки 382-420)

```javascript
bot.onText(/\/status/, async (msg) => {
  // ❌ НЕ ГЕНЕРИРУЕТСЯ - только текст
  await bot.sendMessage(chatId, statusMessage, { parse_mode: 'HTML' });
});
```

### 5. **Команда `/chatid`** 
**Файл:** `telegramBotInstance.js` (строки 492-510)

```javascript
bot.onText(/\/chatid/, async (msg) => {
  // ❌ НЕ ГЕНЕРИРУЕТСЯ - только текст
  await bot.sendMessage(chatId, chatInfoMessage, { parse_mode: 'HTML' });
});
```

### 6. **Уведомления о токенах** 
**Файл:** `notificationService.js` (строки 486-520)

```javascript
async sendPersonalNotification(chatId, message, imageData = null) {
  if (imageData && imageData.type === 'image' && imageData.url) {
    // ✅ ГЕНЕРИРУЕТСЯ - если есть изображение токена
    await bot.sendPhoto(chatId, imageData.url, {
      caption: message,
      parse_mode: 'HTML',
      filename: 'token-notification.png'
    });
  } else {
    // ❌ НЕ ГЕНЕРИРУЕТСЯ - только текст
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  }
}
```

## 📊 Сводка по командам

| Команда | Генерирует изображение | Текст изображения | Файл |
|---------|----------------------|------------------|------|
| `/start` | ✅ Да | "Привет!" | welcome.png |
| `/start` (группа) | ✅ Да | "Бот в группе!" | group-connected.png |
| `/link` (успех) | ✅ Да | "Бот подключен!" | bot-connected.png |
| `/link` (ошибка) | ❌ Нет | - | - |
| `/help` | ❌ Нет | - | - |
| `/status` | ❌ Нет | - | - |
| `/chatid` | ❌ Нет | - | - |
| Уведомления о токенах | ✅ Да* | Изображение токена | token-notification.png |

*Только если токен имеет изображение

## 🔧 Как добавить изображение для новой команды

1. **Найти обработчик команды** в `telegramBotInstance.js`
2. **Добавить генерацию изображения:**
   ```javascript
   const imageBuffer = await createCorporateImage('Текст изображения!');
   await bot.sendPhoto(chatId, imageBuffer, {
     caption: message,
     parse_mode: 'HTML',
     filename: 'command-name.png'
   });
   ```
3. **Заменить `bot.sendMessage()` на `bot.sendPhoto()`**

## 🎨 Функция генерации изображений

**Файл:** `telegramBotInstance.js` (строки 122-180)

```javascript
const createCorporateImage = async (title) => {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');
  
  // Корпоративные цвета
  const gradient = ctx.createLinearGradient(0, 0, 800, 400);
  gradient.addColorStop(0, '#E42E0F'); // Красный
  gradient.addColorStop(1, '#C41E3A'); // Темно-красный
  
  // Логотип + текст
  // Возвращает Buffer
};
``` 