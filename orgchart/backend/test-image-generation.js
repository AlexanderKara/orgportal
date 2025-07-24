const { createCorporateImage } = require('./services/telegramBotInstance');
const fs = require('fs');
const path = require('path');

async function testImageGeneration() {
  console.log('🧪 Тестирование генерации изображений...');
  
  try {
    // Тестируем генерацию изображения "Привет!"
    console.log('📸 Генерируем изображение "Привет!"...');
    const helloImage = await createCorporateImage('Привет!');
    
    // Сохраняем в файл для проверки
    const helloPath = path.join(__dirname, 'test-hello.png');
    fs.writeFileSync(helloPath, helloImage);
    console.log(`✅ Изображение "Привет!" сохранено в: ${helloPath}`);
    
    // Тестируем генерацию изображения "Бот подключен!"
    console.log('📸 Генерируем изображение "Бот подключен!"...');
    const connectedImage = await createCorporateImage('Бот подключен!');
    
    // Сохраняем в файл для проверки
    const connectedPath = path.join(__dirname, 'test-connected.png');
    fs.writeFileSync(connectedPath, connectedImage);
    console.log(`✅ Изображение "Бот подключен!" сохранено в: ${connectedPath}`);
    
    // Тестируем генерацию изображения "Бот в группе!"
    console.log('📸 Генерируем изображение "Бот в группе!"...');
    const groupImage = await createCorporateImage('Бот в группе!');
    
    // Сохраняем в файл для проверки
    const groupPath = path.join(__dirname, 'test-group.png');
    fs.writeFileSync(groupPath, groupImage);
    console.log(`✅ Изображение "Бот в группе!" сохранено в: ${groupPath}`);
    
    console.log('\n🎉 Все изображения успешно сгенерированы!');
    console.log('📁 Проверьте файлы в папке backend:');
    console.log('   - test-hello.png');
    console.log('   - test-connected.png');
    console.log('   - test-group.png');
    
  } catch (error) {
    console.error('❌ Ошибка при генерации изображений:', error);
  }
}

// Запускаем тест
testImageGeneration(); 