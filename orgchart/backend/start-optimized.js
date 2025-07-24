const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск оптимизированного сервера...\n');

// Настройки для оптимизации
process.env.NODE_ENV = 'development';
process.env.NODE_OPTIONS = '--max-old-space-size=512'; // Ограничиваем память

// Запускаем сервер
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

// Обработка завершения
server.on('close', (code) => {
  console.log(`\n🛑 Сервер завершен с кодом ${code}`);
});

server.on('error', (error) => {
  console.error('❌ Ошибка запуска сервера:', error);
});

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  server.kill('SIGTERM');
});

console.log('✅ Сервер запущен на http://localhost:5000');
console.log('📊 Для мониторинга производительности запустите: node monitor-performance.js'); 